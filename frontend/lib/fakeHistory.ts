import type { RatingHistory } from './api';

// Mirrors backend/seeds/fake_test_data.sql exactly.
// Used as a fallback on the profile page when the live DB has no history yet.

const CONTESTS = [
    { id: 1, name: 'January Challenge 2026', date: '2026-01-12T18:00:00Z' },
    { id: 2, name: 'February Long Challenge 2026', date: '2026-02-18T18:00:00Z' },
    { id: 3, name: 'Spring Starter Round 2026', date: '2026-03-10T18:00:00Z' },
];

// [id, user_id, contest_idx(0-based), old, new, perf, rank, percentile, change]
type Row = [number, number, number, number, number, number, number, number, number];

const ROWS: Row[] = [
    // January Challenge (contest 1)
    [1, 1, 0, 1500, 1650, 1800, 1, 99.00, 150],
    [2, 2, 0, 1500, 1450, 1400, 4, 96.00, -50],
    [3, 3, 0, 1500, 1250, 1000, 45, 55.00, -250],
    [4, 4, 0, 1500, 1150, 800, 80, 20.00, -350],
    [5, 5, 0, 1500, 1300, 1100, 25, 75.00, -200],
    [6, 6, 0, 1500, 1150, 800, 90, 10.00, -350],

    // February Long Challenge (contest 2)
    [7, 1, 1, 1650, 1525, 1400, 3, 97.50, -125],
    [8, 2, 1, 1450, 1600, 1750, 1, 99.17, 150],
    [9, 3, 1, 1250, 1400, 1550, 2, 98.33, 150],
    [10, 4, 1, 1150, 975, 800, 75, 37.50, -175],
    [11, 5, 1, 1300, 1437, 1575, 1, 99.17, 137],
    [12, 6, 1, 1150, 975, 800, 88, 26.67, -175],

    // Spring Starter Round (contest 3)
    [13, 1, 2, 1525, 1675, 1825, 1, 98.89, 150],
    [14, 2, 2, 1600, 1500, 1400, 3, 96.67, -100],
    [15, 3, 2, 1400, 1212, 1025, 40, 55.56, -188],
    [16, 4, 2, 975, 980, 985, 44, 51.11, 5],
];

function buildHistory(userId: number): RatingHistory[] {
    return ROWS
        .filter(([, uid]) => uid === userId)
        .map(([id, uid, cIdx, oldR, newR, perf, rank, pct, change]) => {
            const c = CONTESTS[cIdx];
            return {
                id,
                user_id: uid,
                contest_id: c.id,
                contest_name: c.name,
                contest_date: c.date,
                old_rating: oldR,
                new_rating: newR,
                performance_rating: perf,
                rank,
                percentile: pct,
                rating_change: change,
                created_at: c.date,
            };
        })
        // newest first (matches API sort order)
        .sort((a, b) => new Date(b.contest_date).getTime() - new Date(a.contest_date).getTime());
}

// Pre-built per user
export const FAKE_HISTORY: Record<number, RatingHistory[]> = {
    1: buildHistory(1),
    2: buildHistory(2),
    3: buildHistory(3),
    4: buildHistory(4),
    5: buildHistory(5),
    6: buildHistory(6),
};
