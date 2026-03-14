'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RatingHistory } from '../lib/api';

interface RatingChartProps {
    history: RatingHistory[];
}

export default function RatingChart({ history }: RatingChartProps) {
    // Recharts iterates left to right. Since our API returns newest first (descending by date),
    // we need to reverse it so the chart displays oldest to newest.
    const chartData = [...history].reverse().map((entry) => ({
        name: entry.contest_name,
        date: new Date(entry.contest_date).toLocaleDateString(),
        rating: entry.new_rating,
        change: entry.rating_change,
        rank: entry.rank,
        percentile: entry.percentile
    }));

    if (history.length === 0) {
        return <div className="text-gray-500 italic mt-4 text-center">No contests played yet.</div>;
    }

    // Custom Tooltip for detailed information
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-lg">
                    <p className="font-bold text-gray-900 mb-2">{data.name}</p>
                    <div className="text-sm space-y-1">
                        <p className="text-gray-600">Date: <span className="font-medium text-gray-900">{data.date}</span></p>
                        <p className="text-gray-600">Rank: <span className="font-medium text-gray-900">#{data.rank}</span></p>
                        <p className="text-gray-600">Rating: <span className="font-bold text-indigo-600">{data.rating}</span></p>
                        <p className="text-gray-600">
                            Change: <span className={`font-medium ${data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.change > 0 ? `+${data.change}` : data.change}
                            </span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[300px] sm:h-[400px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 25, left: -20 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        dy={10}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
