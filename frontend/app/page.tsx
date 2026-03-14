'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Search, BarChart3, Users, Zap } from 'lucide-react';

export default function Home() {
  const [userId, setUserId] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      router.push(`/profile/${userId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4">

      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="max-w-3xl w-full text-center relative z-10">

        {/* Header Hero */}
        <div className="mb-8 inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Trophy className="text-yellow-500 mr-2" size={28} />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">
            Contest Rating System
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
          Track Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Competitive</span> Progress
        </h1>

        <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed">
          The ultimate platform for measuring performance, calculating percentile tiers, and comparing contest histories inside real-time ecosystems.
        </p>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-16 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400 z-10" size={20} />
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your User ID (e.g. 1)"
              className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
            <button
              type="submit"
              className="absolute right-2 py-2 px-6 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-bold mb-2">Percentile Math</h3>
            <p className="text-sm text-slate-500">Core logic ensures rankings strictly abide by mathematical variance and pool size.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Trophy size={20} />
            </div>
            <h3 className="font-bold mb-2">Automated Tiers</h3>
            <p className="text-sm text-slate-500">Six visual tiers varying from Newbie to Grandmaster applied instantly.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Zap size={20} />
            </div>
            <h3 className="font-bold mb-2">Lightning Fast</h3>
            <p className="text-sm text-slate-500">Decoupled Go backend architecture easily handles scale computations.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
