'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, Trophy, RotateCcw, ChevronRight, Info } from 'lucide-react';

// ── Rating math (mirrors backend/internal/service/rating.go exactly) ──────────

const BRACKETS = [
    { threshold: 0.99, perf: 1800 },
    { threshold: 0.95, perf: 1400 },
    { threshold: 0.90, perf: 1200 },
    { threshold: 0.80, perf: 1150 },
    { threshold: 0.70, perf: 1100 },
    { threshold: 0.50, perf: 1000 },
];

function calcStdPerf(percentile: number): number {
    for (const b of BRACKETS) {
        if (percentile >= b.threshold) return b.perf;
    }
    return 800;
}

function calculateRating(totalParticipants: number, rank: number, currentRating: number) {
    const beaten = totalParticipants - rank;
    const percentile = beaten / totalParticipants;
    const stdPerf = calcStdPerf(percentile);
    const ratingChange = Math.trunc((stdPerf - currentRating) / 2);
    const newRating = currentRating + ratingChange;
    return { beaten, percentile, stdPerf, ratingChange, newRating };
}

function determineTier(rating: number): string {
    if (rating >= 1800) return 'Grandmaster';
    if (rating >= 1600) return 'Master';
    if (rating >= 1400) return 'Expert';
    if (rating >= 1200) return 'Specialist';
    if (rating >= 1000) return 'Pupil';
    return 'Newbie';
}

function tierColor(tier: string) {
    switch (tier.toLowerCase()) {
        case 'grandmaster': return { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-200', light: 'bg-red-50' };
        case 'master': return { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50' };
        case 'expert': return { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' };
        case 'specialist': return { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-200', light: 'bg-cyan-50' };
        case 'pupil': return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' };
        default: return { bg: 'bg-gray-400', text: 'text-gray-500', border: 'border-gray-200', light: 'bg-gray-50' };
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface HistoryEntry {
    contest: number;
    label: string;
    rank: number;
    total: number;
    percentile: number;
    stdPerf: number;
    oldRating: number;
    newRating: number;
    ratingChange: number;
    tier: string;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

interface TooltipPayload { payload?: { payload: HistoryEntry }[] }
function ChartTooltip({ active, payload }: { active?: boolean } & TooltipPayload) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
            <p className="font-bold text-slate-800 mb-1">{d.label}</p>
            <p className="text-slate-500">Rating: <span className="font-bold text-indigo-600">{d.newRating}</span></p>
            <p className={d.ratingChange >= 0 ? 'text-green-600' : 'text-red-500'}>
                Change: {d.ratingChange >= 0 ? '+' : ''}{d.ratingChange}
            </p>
            <p className="text-slate-400 text-xs mt-1">Top {(d.percentile * 100).toFixed(1)}%</p>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CalculatorPage() {
    const [rank, setRank] = useState('');
    const [total, setTotal] = useState('');
    const [currentRating, setCurrentRating] = useState('800');
    const [contestLabel, setContestLabel] = useState('');
    const [result, setResult] = useState<HistoryEntry | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [error, setError] = useState('');
    const contestCount = useRef(0);

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const r = parseInt(rank);
        const t = parseInt(total);
        const cr = parseInt(currentRating);

        if (isNaN(r) || isNaN(t) || isNaN(cr)) { setError('All fields must be valid numbers.'); return; }
        if (r < 1) { setError('Rank must be at least 1.'); return; }
        if (t < 1) { setError('Total participants must be at least 1.'); return; }
        if (r > t) { setError('Rank cannot exceed total participants.'); return; }
        if (cr < 0) { setError('Rating cannot be negative.'); return; }

        const { percentile, stdPerf, ratingChange, newRating } = calculateRating(t, r, cr);
        const tier = determineTier(newRating);
        contestCount.current += 1;
        const label = contestLabel.trim() || `Contest #${contestCount.current}`;

        const entry: HistoryEntry = {
            contest: contestCount.current,
            label,
            rank: r,
            total: t,
            percentile,
            stdPerf,
            oldRating: cr,
            newRating,
            ratingChange,
            tier,
        };

        setResult(entry);
        setHistory((prev) => [...prev, entry]);

        // Auto-advance: next input starts from the new rating
        setCurrentRating(String(newRating));
        setRank('');
        setTotal('');
        setContestLabel('');
    };

    const handleReset = () => {
        setHistory([]);
        setResult(null);
        setError('');
        setCurrentRating('800');
        setRank('');
        setTotal('');
        setContestLabel('');
        contestCount.current = 0;
    };

    const tc = result ? tierColor(result.tier) : null;

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-indigo-400 rounded-full blur-[120px] opacity-15 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-blue-500 rounded-full blur-[120px] opacity-15 pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 space-y-8">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                    {history.length > 0 && (
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
                            id="reset-btn"
                        >
                            <RotateCcw size={13} />
                            Reset session
                        </button>
                    )}
                </div>

                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm mb-4">
                        <Calculator className="text-indigo-500" size={20} />
                        <span className="font-bold text-slate-700">Rating Calculator</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
                        Simulate Your{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                            Rating Change
                        </span>
                    </h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        Uses the same percentile-bracket formula as the Go backend. Enter your contest result to see your updated rating and tier instantly.
                    </p>
                </div>

                {/* ── Input + Result Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Input Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            Contest Input
                        </h2>

                        <form id="calculator-form" onSubmit={handleCalculate} className="space-y-4">
                            {/* Contest Label */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                    Contest Name <span className="font-normal normal-case text-slate-400">(optional)</span>
                                </label>
                                <input
                                    id="input-label"
                                    type="text"
                                    value={contestLabel}
                                    onChange={(e) => setContestLabel(e.target.value)}
                                    placeholder="e.g. Spring Round 2026"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm"
                                />
                            </div>

                            {/* Rank */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                    Your Rank <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="input-rank"
                                    type="number"
                                    value={rank}
                                    onChange={(e) => setRank(e.target.value)}
                                    placeholder="e.g. 3"
                                    min="1"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm"
                                />
                            </div>

                            {/* Total Participants */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                    Total Participants <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="input-total"
                                    type="number"
                                    value={total}
                                    onChange={(e) => setTotal(e.target.value)}
                                    placeholder="e.g. 100"
                                    min="1"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm"
                                />
                            </div>

                            {/* Current Rating */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                    Current Rating <span className="text-red-400">*</span>
                                    <span className="ml-1 font-normal normal-case text-slate-400">(auto-advances after each submit)</span>
                                </label>
                                <input
                                    id="input-rating"
                                    type="number"
                                    value={currentRating}
                                    onChange={(e) => setCurrentRating(e.target.value)}
                                    placeholder="e.g. 800"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm"
                                />
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
                            )}

                            <button
                                id="calculate-btn"
                                type="submit"
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
                            >
                                Calculate
                            </button>
                        </form>

                        {/* Bracket reference */}
                        <div className="pt-2 border-t border-gray-50">
                            <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                                <Info size={11} /> Percentile → Performance bracket
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                                {BRACKETS.map((b) => (
                                    <div key={b.threshold} className="flex justify-between">
                                        <span>Top {((1 - b.threshold) * 100).toFixed(0)}%</span>
                                        <span className="font-mono font-semibold text-slate-700">{b.perf}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between">
                                    <span>Bottom 50%</span>
                                    <span className="font-mono font-semibold text-slate-700">800</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            Result
                        </h2>

                        {!result ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-10 gap-3">
                                <Calculator size={40} className="opacity-20" />
                                <p className="text-sm">Fill in the inputs and click <strong>Calculate</strong> to see your result here.</p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-4">
                                {/* Tier badge */}
                                <div className={`rounded-2xl border ${tc!.border} ${tc!.light} p-5 flex items-center justify-between`}>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Updated Tier</p>
                                        <span className={`text-2xl font-black ${tc!.text}`}>{result.tier}</span>
                                    </div>
                                    <div className={`w-14 h-14 rounded-full ${tc!.bg} flex items-center justify-center`}>
                                        <Trophy size={22} className="text-white" />
                                    </div>
                                </div>

                                {/* Rating numbers */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-400 mb-1">Old Rating</p>
                                        <p className="text-xl font-bold text-slate-700">{result.oldRating}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-400 mb-1">Change</p>
                                        <p className={`text-xl font-bold flex items-center justify-center gap-0.5 ${result.ratingChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {result.ratingChange >= 0
                                                ? <TrendingUp size={16} />
                                                : <TrendingDown size={16} />}
                                            {result.ratingChange >= 0 ? '+' : ''}{result.ratingChange}
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                                        <p className="text-xs text-indigo-400 mb-1">New Rating</p>
                                        <p className="text-xl font-bold text-indigo-700">{result.newRating}</p>
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                                    <p className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Calculation breakdown</p>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Rank</span><span className="font-mono font-semibold text-slate-700">#{result.rank} / {result.total}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Percentile</span><span className="font-mono font-semibold text-slate-700">Top {(result.percentile * 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Standard Perf</span><span className="font-mono font-semibold text-slate-700">{result.stdPerf}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 border-t border-gray-200 pt-2 mt-1">
                                        <span>Formula</span>
                                        <span className="font-mono text-xs text-slate-600">
                                            ({result.stdPerf} − {result.oldRating}) ÷ 2 = {result.ratingChange >= 0 ? '+' : ''}{result.ratingChange}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── History Chart + Table ── */}
                {history.length > 0 && (
                    <div className="space-y-6">

                        {/* Chart */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                            <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <TrendingUp size={18} className="text-indigo-500" />
                                Rating History
                            </h2>
                            <p className="text-sm text-slate-400 mb-5">Your simulated rating progression across all calculated contests this session.</p>

                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={history}
                                        margin={{ top: 10, right: 12, bottom: 8, left: -16 }}
                                    >
                                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            minTickGap={20}
                                            tickMargin={8}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={42}
                                        />
                                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        {/* Tier threshold lines */}
                                        {[1800, 1600, 1400, 1200, 1000].map((v) => (
                                            <ReferenceLine key={v} y={v} stroke="#e2e8f0" strokeDasharray="4 3"
                                                label={{ value: determineTier(v), fill: '#cbd5e1', fontSize: 10, position: 'right' }}
                                            />
                                        ))}
                                        <Line
                                            type="monotone"
                                            dataKey="newRating"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                            activeDot={{ r: 7, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                                            animationDuration={600}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                            <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <Trophy size={18} className="text-amber-500" />
                                Contest Log
                            </h2>
                            <p className="text-sm text-slate-400 mb-5">Full record of every calculation in this session.</p>

                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Contest</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Rank</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Percentile</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Std Perf</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Old</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">New</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Change</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Tier</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...history].reverse().map((h, i) => {
                                            const changeColor = h.ratingChange > 0 ? 'text-green-600' : h.ratingChange < 0 ? 'text-red-500' : 'text-slate-400';
                                            const colors = tierColor(h.tier);
                                            return (
                                                <tr key={h.contest} className={`${i < history.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-slate-50 transition-colors`}>
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <ChevronRight size={13} className="text-slate-300 shrink-0" />
                                                            <span className="truncate max-w-[140px]">{h.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-600">#{h.rank}/{h.total}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">Top {(h.percentile * 100).toFixed(1)}%</td>
                                                    <td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell">{h.stdPerf}</td>
                                                    <td className="px-4 py-3 text-right text-slate-400 hidden md:table-cell">{h.oldRating}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{h.newRating}</td>
                                                    <td className={`px-4 py-3 text-right font-bold ${changeColor}`}>
                                                        {h.ratingChange > 0 ? '+' : ''}{h.ratingChange}
                                                    </td>
                                                    <td className="px-4 py-3 hidden sm:table-cell">
                                                        <span className={`px-2.5 py-1 rounded-full text-white text-xs font-bold ${colors.bg}`}>{h.tier}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
