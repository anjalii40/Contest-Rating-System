package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/user/backend/internal/handler"
	"github.com/user/backend/internal/repository"
)

func main() {
	// Load .env file
	_ = godotenv.Load()

	// Initialize Database Repository
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback for docker-compose based on .env.example
		dbURL = "postgres://postgres:postgres@localhost:5432/contest_engine?sslmode=disable"
	}
	
	repo, err := repository.NewRepository(dbURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer repo.Close()

	// Setup API handlers
	h := handler.NewHandler(repo)

	// Initialize Gin router
	router := gin.Default()

	// Setup CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://contest-rating-system-beige.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check route
	router.GET("/health", handler.HealthCheck)

	// API Routes
	api := router.Group("/api")
	{
		// User profiles and leadership
		api.POST("/users", h.CreateUser)
		api.GET("/users/:id/profile", h.GetUserProfile)
		api.GET("/leaderboard", h.GetLeaderboard)

		// Contests definition and data
		api.POST("/contests", h.CreateContest)
		api.GET("/contests", h.GetContests)
		api.GET("/contests/:id", h.GetContestWithStandings)
		api.POST("/contests/:id/submit-results", h.SubmitContestResults)
	}

	// Determine port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	
	// Start server
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
