CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    current_rating INT NOT NULL DEFAULT 1500,
    max_rating INT NOT NULL DEFAULT 1500,
    contests_played INT NOT NULL DEFAULT 0,
    tier VARCHAR(50) NOT NULL DEFAULT 'Novice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_participants INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rating_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contest_id INT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    old_rating INT NOT NULL,
    new_rating INT NOT NULL,
    performance_rating INT NOT NULL,
    rank INT NOT NULL,
    percentile DECIMAL(5, 2) NOT NULL,
    rating_change INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contest_id)
);

-- Indexes for performance
CREATE INDEX idx_rating_history_user_id ON rating_history(user_id);
CREATE INDEX idx_rating_history_contest_id ON rating_history(contest_id);
CREATE INDEX idx_users_current_rating ON users(current_rating DESC);
CREATE INDEX idx_contests_date ON contests(date DESC);
