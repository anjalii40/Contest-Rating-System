package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
	"os"
)

var baseURL = "https://contest-rating-system-o84v.onrender.com/api"

func init() {
	if envURL := os.Getenv("API_URL"); envURL != "" {
		baseURL = envURL
	}
}

type User struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	CurrentRating int    `json:"current_rating"`
	Tier          string `json:"tier"`
}

type Contest struct {
	ID                int    `json:"id"`
	Name              string `json:"name"`
	TotalParticipants int    `json:"total_participants"`
}

func main() {
	fmt.Println("🚀 Commencing Contest Rating System E2E Simulation test...")
	time.Sleep(1 * time.Second)

	// Step 1: Create multiple Users
	users := []string{"Bob", "Alice", "Charlie", "David", "Eve", "Frank"}
	var userIDs []int
	
	fmt.Println("\n--- 1. Registering Users ---")
	for _, name := range users {
		id := createUser(name)
		userIDs = append(userIDs, id)
	}

	// Step 2: Create a Contest
	fmt.Println("\n--- 2. Creating Contest ---")
	contestID := createContest("Weekly Algorithms Round #1", len(userIDs))

	// Step 3: Simulate Results 
	// Alice (userIDs[1]) wins 1st place!
	// Bob (userIDs[0]) comes 2nd.
	// Charlie (userIDs[2]) comes last.
	fmt.Println("\n--- 3. Submitting Real-time Results ---")
	
	results := []map[string]int{
		{"user_id": userIDs[1], "rank": 1}, // Alice (Top 16% -> Percentile 0.83)
		{"user_id": userIDs[0], "rank": 2}, // Bob (Top 33% -> Percentile 0.66)
		{"user_id": userIDs[3], "rank": 3}, // David (Top 50% -> Percentile 0.50)
		{"user_id": userIDs[4], "rank": 4}, // Eve (Bottom 50% -> Percentile 0.33)
		{"user_id": userIDs[5], "rank": 5}, // Frank (Bottom 50% -> Percentile 0.16)
		{"user_id": userIDs[2], "rank": 6}, // Charlie (Bottom 50% -> Percentile 0.00)
	}
	submitResults(contestID, results)
	
	// Let DB settle
	time.Sleep(1 * time.Second)

	// Step 4: Check Standings / Leaderboard changes
	fmt.Println("\n--- 4. Checking Global Leaderboard ---")
	fetchLeaderboard()

	// Step 5: Check Winner Profile (Alice)
	fmt.Println("\n--- 5. Checking Winner's Analytics Profile (Alice) ---")
	fetchUserProfile(userIDs[1])
}

func createUser(name string) int {
	body := map[string]string{"name": name}
	jsonBody, _ := json.Marshal(body)
	
	resp, err := http.Post(baseURL+"/users", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		log.Fatalf("Failed to create user %s: %v", name, err)
	}
	defer resp.Body.Close()
	
	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)
	
	id := int(res["id"].(float64))
	fmt.Printf("✅ Created User '%s' (ID: %d) starting deeply at Rating %v (%s)\n", name, id, res["current_rating"], res["tier"])
	return id
}

func createContest(name string, total int) int {
	body := map[string]interface{}{"name": name, "total_participants": total}
	jsonBody, _ := json.Marshal(body)
	
	resp, err := http.Post(baseURL+"/contests", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		log.Fatalf("Failed to create contest: %v", err)
	}
	defer resp.Body.Close()
	
	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)
	
	id := int(res["id"].(float64))
	fmt.Printf("✅ Created Contest '%s' (ID: %d, Participants: %d)\n", name, id, total)
	return id
}

func submitResults(contestID int, payload []map[string]int) {
	jsonBody, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/contests/%d/submit-results", baseURL, contestID)
	
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		log.Fatalf("Failed to submit results: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		log.Fatalf("Server rejected results (HTTP %d): %s", resp.StatusCode, string(b))
	}
	
	fmt.Printf("✅ Successfully processed entirely localized contest payload batch transaction.\n")
}

func fetchLeaderboard() {
	resp, err := http.Get(baseURL+"/leaderboard?limit=10")
	if err != nil {
		log.Fatalf("Failed to get leaderboard: %v", err)
	}
	defer resp.Body.Close()
	
	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)
	
	users := res["users"].([]interface{})
	for i, u := range users {
		user := u.(map[string]interface{})
		fmt.Printf("  #%d | ID: %v | Name: %s | Rating: %v | Tier: %s\n", 
			i+1, user["id"], user["name"], user["current_rating"], user["tier"])
	}
}

func fetchUserProfile(userID int) {
	resp, err := http.Get(fmt.Sprintf("%s/users/%d/profile", baseURL, userID))
	if err != nil {
		log.Fatalf("Failed to get profile: %v", err)
	}
	defer resp.Body.Close()
	
	b, _ := io.ReadAll(resp.Body)
	var prettyJSON bytes.Buffer
	json.Indent(&prettyJSON, b, "", "  ")
	fmt.Println(string(prettyJSON.Bytes()))
}
