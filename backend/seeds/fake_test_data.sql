-- Fake dataset for local or deployed database testing.
-- This script clears existing app data, inserts sample users/contests/history,
-- and resets sequences so new records continue from the correct IDs.

BEGIN;

TRUNCATE TABLE rating_history, contests, users RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, current_rating, max_rating, contests_played, tier, created_at, updated_at)
VALUES
    (1, 'Alice', 1675, 1675, 3, 'Master', '2026-01-01T09:00:00Z', '2026-03-10T12:30:00Z'),
    (2, 'Bob', 1500, 1600, 3, 'Expert', '2026-01-01T09:05:00Z', '2026-03-10T12:30:00Z'),
    (3, 'Charlie', 1212, 1400, 3, 'Specialist', '2026-01-01T09:10:00Z', '2026-03-10T12:30:00Z'),
    (4, 'Diana', 980, 1100, 3, 'Newbie', '2026-01-01T09:15:00Z', '2026-03-10T12:30:00Z'),
    (5, 'Eve', 1437, 1500, 2, 'Expert', '2026-01-01T09:20:00Z', '2026-02-22T16:00:00Z'),
    (6, 'Frank', 1088, 1500, 2, 'Pupil', '2026-01-01T09:25:00Z', '2026-02-22T16:00:00Z');

INSERT INTO contests (id, name, date, total_participants, created_at, updated_at)
VALUES
    (1, 'January Challenge 2026', '2026-01-12T18:00:00Z', 100, '2026-01-10T10:00:00Z', '2026-01-10T10:00:00Z'),
    (2, 'February Long Challenge 2026', '2026-02-18T18:00:00Z', 120, '2026-02-15T10:00:00Z', '2026-02-15T10:00:00Z'),
    (3, 'Spring Starter Round 2026', '2026-03-10T18:00:00Z', 90, '2026-03-07T10:00:00Z', '2026-03-07T10:00:00Z');

INSERT INTO rating_history (
    id,
    user_id,
    contest_id,
    old_rating,
    new_rating,
    performance_rating,
    rank,
    percentile,
    rating_change,
    created_at
)
VALUES
    (1, 1, 1, 1500, 1650, 1800, 1, 99.00, 150, '2026-01-12T20:30:00Z'),
    (2, 2, 1, 1500, 1450, 1400, 4, 96.00, -50, '2026-01-12T20:30:00Z'),
    (3, 3, 1, 1500, 1250, 1000, 45, 55.00, -250, '2026-01-12T20:30:00Z'),
    (4, 4, 1, 1500, 1150, 800, 80, 20.00, -350, '2026-01-12T20:30:00Z'),
    (5, 5, 1, 1500, 1300, 1100, 25, 75.00, -200, '2026-01-12T20:30:00Z'),
    (6, 6, 1, 1500, 1150, 800, 90, 10.00, -350, '2026-01-12T20:30:00Z'),

    (7, 1, 2, 1650, 1525, 1400, 3, 97.50, -125, '2026-02-18T20:30:00Z'),
    (8, 2, 2, 1450, 1600, 1750, 1, 99.17, 150, '2026-02-18T20:30:00Z'),
    (9, 3, 2, 1250, 1400, 1550, 2, 98.33, 150, '2026-02-18T20:30:00Z'),
    (10, 4, 2, 1150, 975, 800, 75, 37.50, -175, '2026-02-18T20:30:00Z'),
    (11, 5, 2, 1300, 1437, 1575, 1, 99.17, 137, '2026-02-18T20:30:00Z'),
    (12, 6, 2, 1150, 975, 800, 88, 26.67, -175, '2026-02-18T20:30:00Z'),

    (13, 1, 3, 1525, 1675, 1825, 1, 98.89, 150, '2026-03-10T20:30:00Z'),
    (14, 2, 3, 1600, 1500, 1400, 3, 96.67, -100, '2026-03-10T20:30:00Z'),
    (15, 3, 3, 1400, 1212, 1025, 40, 55.56, -188, '2026-03-10T20:30:00Z'),
    (16, 4, 3, 975, 980, 985, 44, 51.11, 5, '2026-03-10T20:30:00Z');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('contests_id_seq', (SELECT MAX(id) FROM contests));
SELECT setval('rating_history_id_seq', (SELECT MAX(id) FROM rating_history));

COMMIT;
