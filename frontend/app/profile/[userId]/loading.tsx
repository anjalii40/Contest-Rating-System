import React from 'react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">

                {/* Header Skeleton */}
                <div className="bg-slate-200 p-8 flex justify-between items-center h-40">
                    <div>
                        <div className="h-8 bg-slate-300 rounded w-48 mb-4"></div>
                        <div className="h-6 bg-slate-300 rounded-full w-24"></div>
                    </div>
                    <div className="text-right">
                        <div className="h-4 bg-slate-300 rounded w-24 mb-2 ml-auto"></div>
                        <div className="h-12 bg-slate-300 rounded w-32 ml-auto"></div>
                    </div>
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 border-b border-gray-100">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl">
                            <div className="h-4 bg-slate-200 rounded w-16 mb-2"></div>
                            <div className="h-8 bg-slate-200 rounded w-24"></div>
                        </div>
                    ))}
                </div>

                {/* Graph Skeleton */}
                <div className="p-8">
                    <div className="h-6 bg-slate-200 rounded w-32 mb-6"></div>
                    <div className="h-64 bg-slate-50 rounded-xl w-full"></div>
                </div>

            </div>
        </div>
    );
}
