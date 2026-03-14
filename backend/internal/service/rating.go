package service

// Tier constants
const (
	TierNewbie      = "Newbie"       // gray
	TierPupil       = "Pupil"        // green
	TierSpecialist  = "Specialist"   // cyan
	TierExpert      = "Expert"       // blue
	TierMaster      = "Master"       // purple
	TierGrandmaster = "Grandmaster"  // red
)

// RatingResult holds the breakdown of the rating calculation
type RatingResult struct {
	Beaten       int
	Percentile   float64
	StandardPerf int
	RatingChange int
	NewRating    int
}

// CalculateRating computes the new rating based on current rating, contest performance, and percentiles.
func CalculateRating(totalParticipants int, rank int, currentRating int) RatingResult {
	if totalParticipants <= 0 || rank <= 0 || rank > totalParticipants {
		return RatingResult{
			StandardPerf: currentRating,
			NewRating:    currentRating,
		}
	}

	beaten := totalParticipants - rank
	percentile := float64(beaten) / float64(totalParticipants)

	// Determine standard performance based on percentile brackets
	// Standard performance represents the expected rating of someone performing at this percentile.
	// Bottom 50% defaults to 800.
	standardPerf := 800
	
	if percentile >= 0.99 {       // Top 1%
		standardPerf = 1800
	} else if percentile >= 0.95 { // Top 5%
		standardPerf = 1400
	} else if percentile >= 0.90 { // Top 10%
		standardPerf = 1200
	} else if percentile >= 0.80 { // Top 20%
		standardPerf = 1150
	} else if percentile >= 0.70 { // Top 30%
		standardPerf = 1100
	} else if percentile >= 0.50 { // Top 50%
		standardPerf = 1000
	}

	ratingChange := (standardPerf - currentRating) / 2
	newRating := currentRating + ratingChange

	return RatingResult{
		Beaten:       beaten,
		Percentile:   percentile, // Between 0.0 and <1.0
		StandardPerf: standardPerf,
		RatingChange: ratingChange,
		NewRating:    newRating,
	}
}

// DetermineTier returns the semantic tier based on a user's current rating.
func DetermineTier(rating int) string {
	if rating >= 1800 {
		return TierGrandmaster
	}
	if rating >= 1600 {
		return TierMaster
	}
	if rating >= 1400 {
		return TierExpert
	}
	if rating >= 1200 {
		return TierSpecialist
	}
	if rating >= 1000 {
		return TierPupil
	}
	return TierNewbie
}

