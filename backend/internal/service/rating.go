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

const InitialRating = 800

var Brackets = []struct {
	Threshold float64
	Rating    int
}{
	{0.99, 1800},
	{0.95, 1400},
	{0.90, 1200},
	{0.80, 1150},
	{0.70, 1100},
	{0.50, 1000},
}

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
	for _, b := range Brackets {
		if percentile >= b.Threshold {
			standardPerf = b.Rating
			break
		}
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

