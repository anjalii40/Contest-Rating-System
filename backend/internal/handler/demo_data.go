package handler

import (
	"fmt"
	"math/rand"
	"strings"

	"github.com/user/backend/internal/repository"
)

var demoFirstNames = []string{
	"Aarav", "Aisha", "Arjun", "Camila", "Diana", "Elena", "Ethan", "Farah",
	"Grace", "Hugo", "Iris", "Jasper", "Kian", "Lena", "Maya", "Nadia",
	"Noah", "Omar", "Priya", "Rhea", "Ronan", "Sana", "Theo", "Vihaan",
	"Yara", "Zara", "Anika", "Kabir", "Meera", "Nolan", "Ritika", "Tara",
	"Vivaan", "Aiden", "Leila", "Mila", "Reyansh", "Sofia", "Zayn", "Ishaan",
}

var demoLastNames = []string{
	"Arora", "Bennett", "Chopra", "Das", "Everett", "Farooq", "Ghosh", "Hayes",
	"Iyer", "Jain", "Kapoor", "Lopez", "Malik", "Nair", "Owens", "Patel",
	"Quinn", "Rossi", "Shah", "Turner", "Usmani", "Verma", "Walker", "Xu",
	"Young", "Zaman", "Banerjee", "Carter", "Dawson", "Edwards", "Fernandes", "Gupta",
	"Hart", "Irwin", "Keller", "Lam", "Mehta", "Norris", "Parker", "Singh",
}

var contestDescriptors = []string{
	"Midnight", "Nebula", "Summit", "Quantum", "Velocity", "Aurora", "Crimson", "Vertex",
	"Cipher", "Ember", "Nova", "Cascade", "Granite", "Solar", "Monsoon", "Pixel",
}

var contestThemes = []string{
	"Logic", "Sprint", "Circuit", "Arena", "Clash", "Challenge", "Open", "Quest",
	"Rush", "Masters", "Marathon", "Showdown", "Cup", "Trials", "Series", "Gauntlet",
}

var contestFormats = []string{
	"Round", "Cup", "Sprint", "Challenge", "Battle", "Meet", "Classic", "Faceoff",
}

func isPlaceholderDemoName(name string) bool {
	normalized := strings.TrimSpace(strings.ToLower(name))
	return strings.HasPrefix(normalized, "demo user")
}

func buildUsedNameSet(users []*repository.User) map[string]struct{} {
	used := make(map[string]struct{}, len(users))
	for _, user := range users {
		used[strings.ToLower(strings.TrimSpace(user.Name))] = struct{}{}
	}
	return used
}

func nextRandomUserName(randomizer *rand.Rand, used map[string]struct{}) string {
	for attempts := 0; attempts < 5000; attempts++ {
		candidate := fmt.Sprintf(
			"%s %s",
			demoFirstNames[randomizer.Intn(len(demoFirstNames))],
			demoLastNames[randomizer.Intn(len(demoLastNames))],
		)
		key := strings.ToLower(candidate)
		if _, exists := used[key]; exists {
			continue
		}
		used[key] = struct{}{}
		return candidate
	}

	fallback := fmt.Sprintf(
		"%s %s %03d",
		demoFirstNames[randomizer.Intn(len(demoFirstNames))],
		demoLastNames[randomizer.Intn(len(demoLastNames))],
		randomizer.Intn(900)+100,
	)
	used[strings.ToLower(fallback)] = struct{}{}
	return fallback
}

func nextRandomContestName(randomizer *rand.Rand, contestNumber int) string {
	return fmt.Sprintf(
		"%s %s %s #%d",
		contestDescriptors[randomizer.Intn(len(contestDescriptors))],
		contestThemes[randomizer.Intn(len(contestThemes))],
		contestFormats[randomizer.Intn(len(contestFormats))],
		contestNumber,
	)
}
