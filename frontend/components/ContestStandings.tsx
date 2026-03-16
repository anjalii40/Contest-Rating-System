'use client';

import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { Search, ArrowUpRight, Trophy, Users, Sparkles } from 'lucide-react';
import type { Contest, Standing } from '@/lib/api';

interface ContestStandingsProps {
  contest: Contest;
  standings: Standing[];
}

export default function ContestStandings({ contest, standings }: ContestStandingsProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredStandings = standings.filter((entry) => {
    if (!deferredQuery) {
      return true;
    }

    return (
      entry.username.toLowerCase().includes(deferredQuery) ||
      String(entry.user_id).includes(deferredQuery) ||
      String(entry.rank).includes(deferredQuery)
    );
  });

  const winner = standings[0] ?? null;
  const biggestGain = standings.length > 0 ? [...standings].sort((a, b) => b.rating_change - a.rating_change)[0] : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Trophy size={16} className="text-amber-500" />
            Winner
          </div>
          {winner ? (
            <>
              <Link
                href={`/profile/${winner.user_id}`}
                className="inline-flex items-center gap-2 text-lg font-bold text-slate-900 hover:text-indigo-600"
              >
                {winner.username}
                <ArrowUpRight size={16} />
              </Link>
              <p className="mt-1 text-sm text-slate-500">Rank #{winner.rank} · New rating {winner.new_rating}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No stored standings yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Users size={16} className="text-sky-500" />
            Participants
          </div>
          <p className="text-3xl font-black text-slate-900">{contest.total_participants}</p>
          <p className="mt-1 text-sm text-slate-500">
            {filteredStandings.length === standings.length
              ? 'Showing everyone in this contest.'
              : `Showing ${filteredStandings.length} filtered users.`}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Sparkles size={16} className="text-emerald-500" />
            Biggest Gain
          </div>
          {biggestGain ? (
            <>
              <Link
                href={`/profile/${biggestGain.user_id}`}
                className="inline-flex items-center gap-2 text-lg font-bold text-slate-900 hover:text-emerald-600"
              >
                {biggestGain.username}
                <ArrowUpRight size={16} />
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {biggestGain.rating_change > 0 ? '+' : ''}
                {biggestGain.rating_change} rating change
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Ratings will appear here after results are stored.</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Rank List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by name, user ID, or rank, then open any profile directly from the standings.
            </p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users, IDs, or ranks"
              className="w-full rounded-xl border border-gray-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        {filteredStandings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No users matched that search.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Old</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">New</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Change</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Percentile</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandings.map((entry, index) => {
                  const changeColor =
                    entry.rating_change > 0 ? 'text-emerald-600' : entry.rating_change < 0 ? 'text-rose-500' : 'text-slate-500';

                  return (
                    <tr
                      key={`${contest.id}-${entry.user_id}`}
                      className={index < filteredStandings.length - 1 ? 'border-b border-gray-50' : ''}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">#{entry.rank}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/profile/${entry.user_id}`}
                          className="group inline-flex items-center gap-2 font-semibold text-slate-800 hover:text-indigo-600"
                        >
                          <span>{entry.username}</span>
                          <span className="text-xs font-medium text-slate-400">ID {entry.user_id}</span>
                          <ArrowUpRight size={14} className="text-slate-300 transition group-hover:text-indigo-500" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">{entry.old_rating}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{entry.new_rating}</td>
                      <td className={`px-4 py-3 text-right font-bold ${changeColor}`}>
                        {entry.rating_change > 0 ? '+' : ''}
                        {entry.rating_change}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell">
                        {entry.percentile.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
