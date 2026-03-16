package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository defines the interface for data access
type Repository interface {
	GetUserByID(ctx context.Context, id int) (*User, error)
	GetUserByName(ctx context.Context, name string) (*User, error)
	GetAllUsers(ctx context.Context) ([]*User, error)
	CreateUser(ctx context.Context, user *User) (*User, error)
	UpdateUserName(ctx context.Context, userID int, name string) error
	GetContestByID(ctx context.Context, id int) (*Contest, error)
	CreateContest(ctx context.Context, contest *Contest) (*Contest, error)
	UpdateContestName(ctx context.Context, contestID int, name string) error
	SaveRatingHistory(ctx context.Context, entry *RatingHistory) error
	UpdateUserRating(ctx context.Context, userID int, newRating int, newTier string, maxRating int) error
	GetUserRatingHistory(ctx context.Context, userID int) ([]*RatingHistory, error)
	GetLeaderboard(ctx context.Context, tier string, limit, offset int) ([]*User, error)
	GetContests(ctx context.Context) ([]*Contest, error)
	GetContestStandings(ctx context.Context, contestID int) ([]*Standing, error)
	SubmitContestResultsTx(ctx context.Context, updates []ContestResultUpdate) error
	Close()
}

type pgRepository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new instance of the PostgreSQL repository
func NewRepository(databaseURL string) (Repository, error) {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Ping the database to ensure connection is valid
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return &pgRepository{pool: pool}, nil
}

// Close closes the connection pool
func (r *pgRepository) Close() {
	r.pool.Close()
}

// GetUserByID retrieves a user by ID
func (r *pgRepository) GetUserByID(ctx context.Context, id int) (*User, error) {
	user := &User{}
	query := `
		SELECT id, name, current_rating, max_rating, contests_played, tier, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Name, &user.CurrentRating, &user.MaxRating, 
		&user.ContestsPlayed, &user.Tier, &user.CreatedAt, &user.UpdatedAt,
	)
	
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user with ID %d not found", id)
		}
		return nil, fmt.Errorf("error querying user: %w", err)
	}
	
	return user, nil
}

// GetUserByName retrieves a user by exact name match.
func (r *pgRepository) GetUserByName(ctx context.Context, name string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, name, current_rating, max_rating, contests_played, tier, created_at, updated_at
		FROM users
		WHERE name = $1
	`

	err := r.pool.QueryRow(ctx, query, name).Scan(
		&user.ID, &user.Name, &user.CurrentRating, &user.MaxRating,
		&user.ContestsPlayed, &user.Tier, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user with name %q not found", name)
		}
		return nil, fmt.Errorf("error querying user by name: %w", err)
	}

	return user, nil
}

// GetAllUsers retrieves every user sorted by ID.
func (r *pgRepository) GetAllUsers(ctx context.Context) ([]*User, error) {
	query := `
		SELECT id, name, current_rating, max_rating, contests_played, tier, created_at, updated_at
		FROM users
		ORDER BY id ASC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error querying users: %w", err)
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		user := &User{}
		if err := rows.Scan(
			&user.ID, &user.Name, &user.CurrentRating, &user.MaxRating,
			&user.ContestsPlayed, &user.Tier, &user.CreatedAt, &user.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning user row: %w", err)
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user rows: %w", err)
	}

	if users == nil {
		users = []*User{}
	}

	return users, nil
}

// CreateUser inserts a new user
func (r *pgRepository) CreateUser(ctx context.Context, user *User) (*User, error) {
	query := `
		INSERT INTO users (name, current_rating, max_rating, contests_played, tier)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	
	err := r.pool.QueryRow(ctx, query, 
		user.Name, user.CurrentRating, user.MaxRating, user.ContestsPlayed, user.Tier,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
	
	if err != nil {
		return nil, fmt.Errorf("error creating user: %w", err)
	}

	return user, nil
}

// UpdateUserName renames an existing user.
func (r *pgRepository) UpdateUserName(ctx context.Context, userID int, name string) error {
	query := `
		UPDATE users
		SET name = $1,
		    updated_at = $2
		WHERE id = $3
	`

	cmdTag, err := r.pool.Exec(ctx, query, name, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("error updating user name: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("user with ID %d not found for rename", userID)
	}

	return nil
}

// GetContestByID retrieves a contest by ID
func (r *pgRepository) GetContestByID(ctx context.Context, id int) (*Contest, error) {
	contest := &Contest{}
	query := `
		SELECT id, name, date, total_participants, created_at, updated_at
		FROM contests
		WHERE id = $1
	`
	
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&contest.ID, &contest.Name, &contest.Date, &contest.TotalParticipants, 
		&contest.CreatedAt, &contest.UpdatedAt,
	)
	
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("contest with ID %d not found", id)
		}
		return nil, fmt.Errorf("error querying contest: %w", err)
	}
	
	return contest, nil
}

// CreateContest inserts a new contest
func (r *pgRepository) CreateContest(ctx context.Context, contest *Contest) (*Contest, error) {
	query := `
		INSERT INTO contests (name, date, total_participants)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`
	
	err := r.pool.QueryRow(ctx, query, 
		contest.Name, contest.Date, contest.TotalParticipants,
	).Scan(&contest.ID, &contest.CreatedAt, &contest.UpdatedAt)
	
	if err != nil {
		return nil, fmt.Errorf("error creating contest: %w", err)
	}

	return contest, nil
}

// UpdateContestName renames an existing contest.
func (r *pgRepository) UpdateContestName(ctx context.Context, contestID int, name string) error {
	query := `
		UPDATE contests
		SET name = $1,
		    updated_at = $2
		WHERE id = $3
	`

	cmdTag, err := r.pool.Exec(ctx, query, name, time.Now(), contestID)
	if err != nil {
		return fmt.Errorf("error updating contest name: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("contest with ID %d not found for rename", contestID)
	}

	return nil
}

// SaveRatingHistory inserts a new rating history entry
func (r *pgRepository) SaveRatingHistory(ctx context.Context, entry *RatingHistory) error {
	query := `
		INSERT INTO rating_history 
		(user_id, contest_id, old_rating, new_rating, performance_rating, rank, percentile, rating_change)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`
	
	err := r.pool.QueryRow(ctx, query,
		entry.UserID, entry.ContestID, entry.OldRating, entry.NewRating, 
		entry.PerformanceRating, entry.Rank, entry.Percentile, entry.RatingChange,
	).Scan(&entry.ID, &entry.CreatedAt)
	
	if err != nil {
		return fmt.Errorf("error saving rating history: %w", err)
	}
	
	return nil
}

// UpdateUserRating updates user's rating stats after a contest
func (r *pgRepository) UpdateUserRating(ctx context.Context, userID int, newRating int, newTier string, maxRating int) error {
	query := `
		UPDATE users
		SET current_rating = $1, 
		    tier = $2, 
		    max_rating = $3,
		    contests_played = contests_played + 1,
		    updated_at = $4
		WHERE id = $5
	`
	
	cmdTag, err := r.pool.Exec(ctx, query, newRating, newTier, maxRating, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("error updating user rating: %w", err)
	}
	
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("user with ID %d not found for update", userID)
	}
	
	return nil
}

// SubmitContestResultsTx executes a batch of result updates within a single pgx.Tx transaction
func (r *pgRepository) SubmitContestResultsTx(ctx context.Context, updates []ContestResultUpdate) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, u := range updates {
		// Save rating history
		historyQuery := `
			INSERT INTO rating_history 
			(user_id, contest_id, old_rating, new_rating, performance_rating, rank, percentile, rating_change)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`
		_, err = tx.Exec(ctx, historyQuery,
			u.UserID, u.ContestID, u.OldRating, u.NewRating, 
			u.PerformanceRating, u.Rank, u.Percentile, u.RatingChange,
		)
		if err != nil {
			return fmt.Errorf("error saving rating history for user %d: %w", u.UserID, err)
		}

		// Update user rating stats
		userQuery := `
			UPDATE users
			SET current_rating = $1, 
			    tier = $2, 
			    max_rating = $3,
			    contests_played = contests_played + 1,
			    updated_at = $4
			WHERE id = $5
		`
		cmdTag, err := tx.Exec(ctx, userQuery, u.NewRating, u.NewTier, u.NewMaxRating, time.Now(), u.UserID)
		if err != nil {
			return fmt.Errorf("error updating user rating for user %d: %w", u.UserID, err)
		}
		
		if cmdTag.RowsAffected() == 0 {
			return fmt.Errorf("user with ID %d not found for update", u.UserID)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("error committing transaction: %w", err)
	}

	return nil
}

// GetUserRatingHistory retrieves the rating history for a specific user
func (r *pgRepository) GetUserRatingHistory(ctx context.Context, userID int) ([]*RatingHistory, error) {
	query := `
		SELECT rh.id, rh.user_id, rh.contest_id, c.name, c.date, rh.old_rating, rh.new_rating, 
		       rh.performance_rating, rh.rank, rh.percentile, rh.rating_change, rh.created_at
		FROM rating_history rh
		JOIN contests c ON rh.contest_id = c.id
		WHERE rh.user_id = $1
		ORDER BY c.date DESC
	`
	
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error querying rating history: %w", err)
	}
	defer rows.Close()
	
	var history []*RatingHistory
	for rows.Next() {
		h := &RatingHistory{}
		err := rows.Scan(
			&h.ID, &h.UserID, &h.ContestID, &h.ContestName, &h.ContestDate, &h.OldRating, &h.NewRating, 
			&h.PerformanceRating, &h.Rank, &h.Percentile, &h.RatingChange, &h.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning rating history row: %w", err)
		}
		history = append(history, h)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rating history rows: %w", err)
	}
	
	if history == nil {
		history = []*RatingHistory{}
	}
	
	return history, nil
}

// GetLeaderboard retrieves paginated users sorted by rating
func (r *pgRepository) GetLeaderboard(ctx context.Context, tier string, limit, offset int) ([]*User, error) {
	var query string
	var args []interface{}
	
	if tier != "" {
		query = `
			SELECT id, name, current_rating, max_rating, contests_played, tier, created_at, updated_at
			FROM users
			WHERE tier = $1
			ORDER BY current_rating DESC
			LIMIT $2 OFFSET $3
		`
		args = []interface{}{tier, limit, offset}
	} else {
		query = `
			SELECT id, name, current_rating, max_rating, contests_played, tier, created_at, updated_at
			FROM users
			ORDER BY current_rating DESC
			LIMIT $1 OFFSET $2
		`
		args = []interface{}{limit, offset}
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying leaderboard: %w", err)
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		u := &User{}
		if err := rows.Scan(
			&u.ID, &u.Name, &u.CurrentRating, &u.MaxRating, 
			&u.ContestsPlayed, &u.Tier, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning user row: %w", err)
		}
		users = append(users, u)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating leaderboard rows: %w", err)
	}

	if users == nil {
		users = []*User{}
	}

	return users, nil
}

// GetContests retrieves all contests sorted by date completely
func (r *pgRepository) GetContests(ctx context.Context) ([]*Contest, error) {
	query := `
		SELECT id, name, date, total_participants, created_at, updated_at
		FROM contests
		ORDER BY date DESC
	`
	
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error querying contests: %w", err)
	}
	defer rows.Close()

	var contests []*Contest
	for rows.Next() {
		c := &Contest{}
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Date, &c.TotalParticipants, 
			&c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning contest row: %w", err)
		}
		contests = append(contests, c)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating contest rows: %w", err)
	}

	if contests == nil {
		contests = []*Contest{}
	}

	return contests, nil
}

// GetContestStandings retrieves the ranking results and rating changes of a contest
func (r *pgRepository) GetContestStandings(ctx context.Context, contestID int) ([]*Standing, error) {
	query := `
		SELECT rh.rank, u.id, u.name, rh.old_rating, rh.new_rating, rh.rating_change, rh.percentile
		FROM rating_history rh
		JOIN users u ON rh.user_id = u.id
		WHERE rh.contest_id = $1
		ORDER BY rh.rank ASC
	`
	
	rows, err := r.pool.Query(ctx, query, contestID)
	if err != nil {
		return nil, fmt.Errorf("error querying contest standings: %w", err)
	}
	defer rows.Close()

	var standings []*Standing
	for rows.Next() {
		s := &Standing{}
		if err := rows.Scan(
			&s.Rank, &s.UserID, &s.Username, &s.OldRating, 
			&s.NewRating, &s.RatingChange, &s.Percentile,
		); err != nil {
			return nil, fmt.Errorf("error scanning standing row: %w", err)
		}
		standings = append(standings, s)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating standings rows: %w", err)
	}

	if standings == nil {
		standings = []*Standing{}
	}

	return standings, nil
}
