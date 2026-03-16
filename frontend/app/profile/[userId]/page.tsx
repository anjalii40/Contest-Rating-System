import { getUserProfile } from '@/lib/api';
import TierBadge from '@/components/TierBadge';
import RatingChart from '@/components/RatingChart';
import { Trophy, TrendingUp, Maximize, Target, ArrowLeft, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Tier thresholds (must match backend DetermineTier in rating.go)
const TIER_CONFIG = [
    { name: 'Grandmaster', min: 1800, max: Infinity },
    { name: 'Master', min: 1600, max: 1799 },
    { name: 'Expert', min: 1400, max: 1599 },
    { name: 'Specialist', min: 1200, max: 1399 },
    { name: 'Pupil', min: 1000, max: 1199 },
    { name: 'Newbie', min: 800, max: 999 },
];

function getTierProgress(rating: number) {
    const tier = TIER_CONFIG.find((t) => rating >= t.min);
    if (!tier) return { tier: 'Newbie', pct: 0, current: rating, min: 800, max: 999, nextTier: null, toNext: 0 };

    if (tier.max === Infinity) {
        // Grandmaster: show progress above 1800
        return { tier: tier.name, pct: 100, current: rating, min: tier.min, max: tier.min + 200, nextTier: null, toNext: 0 };
    }

    const range = tier.max - tier.min + 1;
    const pos = rating - tier.min;
    const pct = Math.min(100, Math.round((pos / range) * 100));
    const idx = TIER_CONFIG.indexOf(tier);
    const next = idx > 0 ? TIER_CONFIG[idx - 1] : null;
    const toNext = next ? next.min - rating : 0;
    return { tier: tier.name, pct, current: rating, min: tier.min, max: tier.max, nextTier: next?.name ?? null, toNext };
}

function determineTierFromRating(rating: number) {
    const tier = TIER_CONFIG.find((t) => rating >= t.min);
    return tier?.name ?? 'Newbie';
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const profile = await getUserProfile(userId).catch(() => null);
    if (!profile) {
        notFound();
    }

    const { user, history: liveHistory } = profile;
    const history = liveHistory;

    const latestHistoryEntry = history[0];
    const historyMaxRating = history.reduce((max, entry) => Math.max(max, entry.new_rating), 0);
    const derivedCurrentRating = latestHistoryEntry?.new_rating ?? user.current_rating;
    const derivedMaxRating = history.length > 0 ? Math.max(user.max_rating, historyMaxRating) : user.max_rating;
    const derivedContestsPlayed = history.length > 0 ? history.length : user.contests_played;
    const derivedTier = history.length > 0 ? determineTierFromRating(derivedCurrentRating) : user.tier;

    const displayUser = {
        ...user,
        current_rating: derivedCurrentRating,
        max_rating: derivedMaxRating,
        contests_played: derivedContestsPlayed,
        tier: derivedTier,
    };

    const latestChange = history.length > 0 ? history[0].rating_change : 0;
    const latestChangeColor =
        latestChange > 0 ? 'text-green-500' : latestChange < 0 ? 'text-red-500' : 'text-slate-500';

    const progress = getTierProgress(displayUser.current_rating);

    // history is newest-first from the API
    const sortedHistory = [...history].sort(
        (a, b) => new Date(b.contest_date).getTime() - new Date(a.contest_date).getTime()
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 sm:py-10 px-4">
            <div className="w-full max-w-4xl space-y-4">

                {/* ── Breadcrumb + user quick-nav ── */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                        id="back-home-link"
                    >
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                </div>

                {/* ── Main Card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Header Profile Info */}
                    <div className="bg-slate-900 p-5 sm:p-8 text-white flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">
                        <div className="min-w-0">
                            <div className="text-xs text-slate-400 mb-1 uppercase tracking-widest font-medium">User #{userId}</div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 break-words">{displayUser.name}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <TierBadge tier={displayUser.tier} />
                                <span className="text-slate-400 text-sm">Joined {new Date(displayUser.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
                                <Maximize size={16} />
                                <span>Max Rating {displayUser.max_rating}</span>
                            </div>
                            <div className="text-left sm:text-right">
                                <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Current Rating</div>
                                <div className="text-4xl sm:text-5xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                    {displayUser.current_rating}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tier Progress Bar ── */}
                    <div className="px-5 sm:px-8 pt-5 pb-4 border-b border-gray-100 bg-slate-50">
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="font-semibold text-slate-700">{progress.tier}</span>
                            {progress.nextTier ? (
                                <span className="text-slate-500">
                                    <span className="font-semibold text-indigo-600">+{progress.toNext}</span> pts to{' '}
                                    <span className="font-medium">{progress.nextTier}</span>
                                </span>
                            ) : (
                                <span className="text-red-500 font-semibold text-xs">Maximum Tier 🏆</span>
                            )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700"
                                style={{ width: `${progress.pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>{progress.min}</span>
                            <span>{progress.max === Infinity ? `${progress.min}+` : progress.max}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-8 border-b border-gray-100">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Trophy size={16} /> <span className="text-sm font-medium">Contests</span>
                            </div>
                            <div className="text-2xl font-bold">{displayUser.contests_played}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Maximize size={16} /> <span className="text-sm font-medium">Max Rating</span>
                            </div>
                            <div className="text-2xl font-bold">{displayUser.max_rating}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <TrendingUp size={16} /> <span className="text-sm font-medium">Last Change</span>
                            </div>
                            <div className={`text-2xl font-bold ${latestChangeColor}`}>
                                {latestChange > 0 ? '+' : ''}{latestChange}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Target size={16} /> <span className="text-sm font-medium">Last Perf</span>
                            </div>
                            <div className="text-2xl font-bold">{history.length > 0 ? history[0].performance_rating : '—'}</div>
                        </div>
                    </div>

                    {/* Rating Chart */}
                    <div className="p-5 sm:p-8 border-b border-gray-100">
                        <h2 className="text-xl font-bold mb-1">Rating Graph</h2>
                        <p className="text-sm text-slate-400 mb-4">Hover over dots to see contest details.</p>
                        <RatingChart history={history} />
                    </div>

                    {/* ── Contest History Table ── */}
                    <div className="p-5 sm:p-8">
                        <h2 className="text-xl font-bold mb-1">Contest History</h2>
                        <p className="text-sm text-slate-400 mb-4">All contests this user has participated in, newest first.</p>

                        {sortedHistory.length === 0 ? (
                            <p className="text-slate-400 italic text-center py-6">No contests yet.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-gray-100">
                                            <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Contest</th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Rank</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Percentile</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Old</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">New</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Change</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedHistory.map((entry, i) => {
                                            const changeColor = entry.rating_change > 0
                                                ? 'text-green-600'
                                                : entry.rating_change < 0
                                                    ? 'text-red-500'
                                                    : 'text-slate-500';
                                            return (
                                                <tr
                                                    key={entry.id}
                                                    className={`${i < sortedHistory.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-slate-50 transition-colors`}
                                                >
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <ChevronRight size={14} className="text-slate-300 shrink-0" />
                                                            <span className="truncate max-w-[160px] sm:max-w-xs">{entry.contest_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                                                        {new Date(entry.contest_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-700 font-medium">#{entry.rank}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell">
                                                        {entry.percentile.toFixed(1)}%
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-400 hidden md:table-cell">{entry.old_rating}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{entry.new_rating}</td>
                                                    <td className={`px-4 py-3 text-right font-bold ${changeColor}`}>
                                                        {entry.rating_change > 0 ? '+' : ''}{entry.rating_change}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Rating formula explainer */}
                        <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
                            <span className="font-semibold">How ratings are calculated: </span>
                            Your percentile in a contest maps to a &quot;standard performance&quot; score. Your new rating = old rating + (standard performance − old rating) / 2.
                            Top 1% → 1800 perf, top 5% → 1400, top 10% → 1200, top 20% → 1150, top 30% → 1100, top 50% → 1000.
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
