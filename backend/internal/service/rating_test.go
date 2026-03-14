package service

import (
	"testing"
)

func TestCalculateRating(t *testing.T) {
	tests := []struct {
		name              string
		totalParticipants int
		rank              int
		currentRating     int
		expectedPerf      int
		expectedChange    int
		expectedNew       int
	}{
		{
			name:              "Top 1%",
			totalParticipants: 100,
			rank:              1,   // beaten: 99, percentile: 0.99
			currentRating:     1500,
			expectedPerf:      1800,
			expectedChange:    150, // (1800 - 1500) / 2
			expectedNew:       1650,
		},
		{
			name:              "Top 5%",
			totalParticipants: 100,
			rank:              5,   // beaten: 95, percentile: 0.95
			currentRating:     1500,
			expectedPerf:      1400,
			expectedChange:    -50, // (1400 - 1500) / 2
			expectedNew:       1450,
		},
		{
			name:              "Top 10%",
			totalParticipants: 100,
			rank:              10,  // beaten: 90, percentile: 0.90
			currentRating:     1200,
			expectedPerf:      1200,
			expectedChange:    0,   // (1200 - 1200) / 2
			expectedNew:       1200,
		},
		{
			name:              "Top 20%",
			totalParticipants: 100,
			rank:              20,  // beaten: 80, percentile: 0.80
			currentRating:     1000,
			expectedPerf:      1150,
			expectedChange:    75,  // (1150 - 1000) / 2
			expectedNew:       1075,
		},
		{
			name:              "Top 30%",
			totalParticipants: 100,
			rank:              30,  // beaten: 70, percentile: 0.70
			currentRating:     1200,
			expectedPerf:      1100,
			expectedChange:    -50, // (1100 - 1200) / 2
			expectedNew:       1150,
		},
		{
			name:              "Top 50%",
			totalParticipants: 100,
			rank:              50,  // beaten: 50, percentile: 0.50
			currentRating:     900,
			expectedPerf:      1000,
			expectedChange:    50,  // (1000 - 900) / 2
			expectedNew:       950,
		},
		{
			name:              "Below 50% (Default 800 perf)",
			totalParticipants: 100,
			rank:              60,  // beaten: 40, percentile: 0.40
			currentRating:     1000,
			expectedPerf:      800,
			expectedChange:    -100, // (800 - 1000) / 2
			expectedNew:       900,
		},
		{
			name:              "Invalid Participant Input Edge Case",
			totalParticipants: 0,
			rank:              1,
			currentRating:     1500,
			expectedPerf:      1500,
			expectedChange:    0,
			expectedNew:       1500,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res := CalculateRating(tt.totalParticipants, tt.rank, tt.currentRating)
			
			if res.StandardPerf != tt.expectedPerf {
				t.Errorf("Expected StandardPerf %d, got %d", tt.expectedPerf, res.StandardPerf)
			}
			
			if res.RatingChange != tt.expectedChange {
				t.Errorf("Expected RatingChange %d, got %d", tt.expectedChange, res.RatingChange)
			}
			
			if res.NewRating != tt.expectedNew {
				t.Errorf("Expected NewRating %d, got %d", tt.expectedNew, res.NewRating)
			}
		})
	}
}
