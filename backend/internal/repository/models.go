package repository

import (
	"time"
)

// User represents the users table schema
type User struct {
	ID             int       `json:"id"`
	Name           string    `json:"name"`
	CurrentRating  int       `json:"current_rating"`
	MaxRating      int       `json:"max_rating"`
	ContestsPlayed int       `json:"contests_played"`
	Tier           string    `json:"tier"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Contest represents the contests table schema
type Contest struct {
	ID                int       `json:"id"`
	Name              string    `json:"name"`
	Date              time.Time `json:"date"`
	TotalParticipants int       `json:"total_participants"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// RatingHistory represents the rating_history table schema with joined contest info
type RatingHistory struct {
	ID                int       `json:"id"`
	UserID            int       `json:"user_id"`
	ContestID         int       `json:"contest_id"`
	ContestName       string    `json:"contest_name"`
	ContestDate       time.Time `json:"contest_date"`
	OldRating         int       `json:"old_rating"`
	NewRating         int       `json:"new_rating"`
	PerformanceRating int       `json:"performance_rating"`
	Rank              int       `json:"rank"`
	Percentile        float64   `json:"percentile"`
	RatingChange      int       `json:"rating_change"`
	CreatedAt         time.Time `json:"created_at"`
}
