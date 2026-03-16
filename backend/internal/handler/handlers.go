package handler

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"
	
	"github.com/gin-gonic/gin"
	"github.com/user/backend/internal/repository"
	"github.com/user/backend/internal/service"
)

type Handler struct {
	repo repository.Repository
}

func NewHandler(repo repository.Repository) *Handler {
	return &Handler{repo: repo}
}

func buildContestResultUpdate(user *repository.User, contestID int, totalParticipants int, rank int) repository.ContestResultUpdate {
	ratingResult := service.CalculateRating(totalParticipants, rank, user.CurrentRating)

	newMaxRating := user.MaxRating
	if ratingResult.NewRating > newMaxRating {
		newMaxRating = ratingResult.NewRating
	}

	return repository.ContestResultUpdate{
		UserID:            user.ID,
		ContestID:         contestID,
		OldRating:         user.CurrentRating,
		NewRating:         ratingResult.NewRating,
		PerformanceRating: ratingResult.StandardPerf,
		Rank:              rank,
		Percentile:        ratingResult.Percentile * 100,
		RatingChange:      ratingResult.RatingChange,
		NewTier:           service.DetermineTier(ratingResult.NewRating),
		NewMaxRating:      newMaxRating,
	}
}

// POST /api/users
func (h *Handler) CreateUser(c *gin.Context) {
	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := &repository.User{
		Name:          input.Name,
		CurrentRating: service.InitialRating,
		MaxRating:     service.InitialRating,
		Tier:          service.DetermineTier(service.InitialRating),
	}

	createdUser, err := h.repo.CreateUser(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, createdUser)
}

// POST /api/contests
func (h *Handler) CreateContest(c *gin.Context) {
	var input struct {
		Name              string `json:"name" binding:"required"`
		TotalParticipants int    `json:"total_participants" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// For simplicity, we assume the contest is "now", but real API might take a date
	contest := &repository.Contest{
		Name:              input.Name,
		Date:              time.Now().UTC(),
		TotalParticipants: input.TotalParticipants,
	}

	createdContest, err := h.repo.CreateContest(c.Request.Context(), contest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contest"})
		return
	}

	c.JSON(http.StatusCreated, createdContest)
}

// POST /api/contests/generate-demo
func (h *Handler) GenerateDemoContest(c *gin.Context) {
	var input struct {
		ParticipantCount int `json:"participant_count"`
	}
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	ctx := c.Request.Context()
	users, err := h.repo.GetAllUsers(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	if len(users) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 users are required to generate a demo contest"})
		return
	}

	participantCount := len(users)
	if input.ParticipantCount > 0 {
		if input.ParticipantCount < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Participant count must be at least 2"})
			return
		}
		if input.ParticipantCount > len(users) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Participant count exceeds available users"})
			return
		}
		participantCount = input.ParticipantCount
	}

	randomizer := rand.New(rand.NewSource(time.Now().UnixNano()))
	randomizer.Shuffle(len(users), func(i, j int) {
		users[i], users[j] = users[j], users[i]
	})

	selectedUsers := users[:participantCount]
	usedNames := buildUsedNameSet(users)
	for _, user := range selectedUsers {
		if !isPlaceholderDemoName(user.Name) {
			continue
		}

		newName := nextRandomUserName(randomizer, usedNames)
		if err := h.repo.UpdateUserName(ctx, user.ID, newName); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to rename generated users"})
			return
		}
		user.Name = newName
	}

	now := time.Now().UTC()
	contest := &repository.Contest{
		Name:              "Generating Contest...",
		Date:              now,
		TotalParticipants: participantCount,
	}

	createdContest, err := h.repo.CreateContest(ctx, contest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create demo contest"})
		return
	}

	contestName := nextRandomContestName(randomizer, createdContest.ID)
	if err := h.repo.UpdateContestName(ctx, createdContest.ID, contestName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finalize demo contest name"})
		return
	}
	createdContest.Name = contestName

	updates := make([]repository.ContestResultUpdate, 0, participantCount)
	for i, user := range selectedUsers {
		updates = append(updates, buildContestResultUpdate(user, createdContest.ID, participantCount, i+1))
	}

	if err := h.repo.SubmitContestResultsTx(ctx, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store demo contest results"})
		return
	}

	winner := selectedUsers[0]
	c.JSON(http.StatusCreated, gin.H{
		"contest_id":         createdContest.ID,
		"contest_name":       createdContest.Name,
		"total_participants": participantCount,
		"updated_users":      participantCount,
		"winner_user_id":     winner.ID,
		"redirect_path":      fmt.Sprintf("/contest/%d", createdContest.ID),
	})
}

// POST /api/contests/:id/submit-results
func (h *Handler) SubmitContestResults(c *gin.Context) {
	contestIDStr := c.Param("id")
	contestID, err := strconv.Atoi(contestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contest ID"})
		return
	}

	var results []struct {
		UserID int `json:"user_id" binding:"required"`
		Rank   int `json:"rank" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&results); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	
	contest, err := h.repo.GetContestByID(ctx, contestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	// Validate input length
	if len(results) > contest.TotalParticipants {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Submitted results exceed total participants"})
		return
	}

	var updates []repository.ContestResultUpdate
	var errorsList []string

	// Process updates mapping
	for _, res := range results {
		user, err := h.repo.GetUserByID(ctx, res.UserID)
		if err != nil {
			errStr := fmt.Sprintf("User %d not found for contest %d", res.UserID, contestID)
			log.Println(errStr)
			errorsList = append(errorsList, errStr)
			continue
		}

		updates = append(updates, buildContestResultUpdate(user, contest.ID, contest.TotalParticipants, res.Rank))
	}

	// Submit via atomic transaction
	if len(updates) > 0 {
		if err := h.repo.SubmitContestResultsTx(ctx, updates); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed: " + err.Error()})
			return
		}
	}

	// Throw a multi-status mapping for explicit partials warning
	if len(errorsList) > 0 {
		c.JSON(207, gin.H{
			"message": "Partial success, some results failed to process",
			"errors":  errorsList,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Results submitted and ratings updated successfully"})
}

// GET /api/users/:id/profile
func (h *Handler) GetUserProfile(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := c.Request.Context()

	user, err := h.repo.GetUserByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	history, err := h.repo.GetUserRatingHistory(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":    user,
		"history": history,
	})
}

// GET /api/leaderboard
func (h *Handler) GetLeaderboard(c *gin.Context) {
	tier := c.Query("tier")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "25")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 25
	}
	if limit > 100 {
		limit = 100 // max bounds limit
	}

	offset := (page - 1) * limit
	ctx := c.Request.Context()

	users, err := h.repo.GetLeaderboard(ctx, tier, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":  page,
		"limit": limit,
		"users": users,
	})
}

// GET /api/contests
func (h *Handler) GetContests(c *gin.Context) {
	ctx := c.Request.Context()

	contests, err := h.repo.GetContests(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch contests"})
		return
	}

	c.JSON(http.StatusOK, contests)
}

// GET /api/contests/:id
func (h *Handler) GetContestWithStandings(c *gin.Context) {
	contestIDStr := c.Param("id")
	contestID, err := strconv.Atoi(contestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contest ID"})
		return
	}

	ctx := c.Request.Context()

	contest, err := h.repo.GetContestByID(ctx, contestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	standings, err := h.repo.GetContestStandings(ctx, contestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch standings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contest":   contest,
		"standings": standings,
	})
}
