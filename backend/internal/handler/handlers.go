package handler

import (
	"log"
	"net/http"
	"strconv"
	
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

// DetermineTier Helper
func determineTier(rating int) string {
	if rating >= 1800 {
		return "Grandmaster"
	}
	if rating >= 1400 {
		return "Master"
	}
	if rating >= 1200 {
		return "Expert"
	}
	if rating >= 1000 {
		return "Advanced"
	}
	return "Novice"
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
		CurrentRating: 1500,
		MaxRating:     1500,
		Tier:          "Master", // 1500 puts them in Master based on our bounds
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
		TotalParticipants: input.TotalParticipants,
	}

	createdContest, err := h.repo.CreateContest(c.Request.Context(), contest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contest"})
		return
	}

	c.JSON(http.StatusCreated, createdContest)
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

	// Process updates
	for _, res := range results {
		user, err := h.repo.GetUserByID(ctx, res.UserID)
		if err != nil {
			log.Printf("User %d not found for contest %d, skipping. error: %v", res.UserID, contestID, err)
			continue
		}

		// Calculate rating using the core engine logic
		ratingResult := service.CalculateRating(contest.TotalParticipants, res.Rank, user.CurrentRating)

		history := &repository.RatingHistory{
			UserID:            user.ID,
			ContestID:         contest.ID,
			OldRating:         user.CurrentRating,
			NewRating:         ratingResult.NewRating,
			PerformanceRating: ratingResult.StandardPerf,
			Rank:              res.Rank,
			Percentile:        ratingResult.Percentile * 100, // Make it 0-100 logic for DB decimal(5,2) if needed
			RatingChange:      ratingResult.RatingChange,
		}

		// Save the rating history
		if err := h.repo.SaveRatingHistory(ctx, history); err != nil {
			log.Printf("Failed to save rating history for User %d in contest %d: %v", res.UserID, contestID, err)
			continue
		}

		newMaxRating := user.MaxRating
		if ratingResult.NewRating > newMaxRating {
			newMaxRating = ratingResult.NewRating
		}
		
		newTier := determineTier(ratingResult.NewRating)

		// Update User row 
		if err := h.repo.UpdateUserRating(ctx, user.ID, ratingResult.NewRating, newTier, newMaxRating); err != nil {
			log.Printf("Failed to update user rating for User %d: %v", res.UserID, err)
		}
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
