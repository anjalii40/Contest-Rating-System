import React from 'react';
import { Trophy, Search, BarChart3, Zap, BookOpen, ArrowRight } from 'lucide-react';
import { getUserProfile } from '@/lib/api';
import TierBadge from '@/components/TierBadge';
import { redirect } from 'next/navigation';

const DEMO_USER_IDS = [1, 2, 3, 4, 5, 6];

const TIERS = [
  { name: 'Grandmaster', min: 1800, max: null, color: 'bg-red-600', text: '≥ 1800' },
  { name: 'Master', min: 1600, max: 1799, color: 'bg-purple-600', text: '1600 – 1799' },
  { name: 'Expert', min: 1400, max: 1599, color: 'bg-blue-600', text: '1400 – 1599' },
  { name: 'Specialist', min: 1200, max: 1399, color: 'bg-cyan-500', text: '1200 – 1399' },
  { name: 'Pupil', min: 1000, max: 1199, color: 'bg-green-500', text: '1000 – 1199' },
  { name: 'Newbie', min: 800, max: 999, color: 'bg-gray-400', text: '< 1000' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Pick a User',
    desc: 'Enter any User ID (1–6) in the search box, or click one of the live demo cards below.',
    color: 'bg-blue-600',
  },
  {
    step: '2',
    title: 'View Their Profile',
    desc: 'See current rating, tier badge, all-time stats, and a full rating history chart.',
    color: 'bg-indigo-600',
  },
  {
    step: '3',
    title: 'Explore Contests',
    desc: "Scroll down on the profile to see each contest's rank, percentile, and rating change.",
    color: 'bg-purple-600',
  },
];

// Fetch all 6 demo users in parallel, silently skip any that fail
async function getDemoUsers() {
  const results = await Promise.allSettled(
    DEMO_USER_IDS.map((id) => getUserProfile(String(id)))
  );
  return results
    .map((r, i) => ({ id: DEMO_USER_IDS[i], result: r }))
    .filter((x) => x.result.status === 'fulfilled')
    .map((x) => ({
      id: x.id,
      // @ts-expect-error: status is 'fulfilled' after filter
      user: x.result.value.user as import('@/lib/api').User,
    }));
}

function tierColor(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'newbie': return 'bg-gray-400';
    case 'pupil': return 'bg-green-500';
    case 'specialist': return 'bg-cyan-500';
    case 'expert': return 'bg-blue-600';
    case 'master': return 'bg-purple-600';
    case 'grandmaster': return 'bg-red-600';
    default: return 'bg-slate-500';
  }
}

// Server action that handles the search form submission
async function handleSearch(formData: FormData) {
  'use server';
  const id = formData.get('userId')?.toString().trim();
  if (id) redirect(`/profile/${id}`);
}

export default async function Home() {
  const demoUsers = await getDemoUsers();

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 flex flex-col items-center gap-16">

        {/* ── Hero ── */}
        <div className="text-center w-full">
          <div className="mb-6 inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Trophy className="text-yellow-500 mr-2" size={28} />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">
              Contest Rating System
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-5 tracking-tight">
            Track Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Competitive
            </span>{' '}
            Progress
          </h1>

          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Percentile-based ratings, automated tier assignment, and full contest history — all from a Go backend.
          </p>

          {/* Search form — uses Next.js Server Action */}
          <form action={handleSearch} className="max-w-md mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400 z-10" size={20} />
              <input
                id="user-id-input"
                type="number"
                name="userId"
                placeholder="Enter User ID (e.g. 1)"
                className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
                min="1"
              />
              <button
                id="lookup-btn"
                type="submit"
                className="absolute right-2 py-2 px-6 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md"
              >
                Lookup
              </button>
            </div>
          </form>
        </div>

        {/* ── Live Demo Users ── */}
        <section className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800">Quick Demo — click any user</h2>
            <span className="ml-1 text-sm text-slate-500">(live data from the API)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {demoUsers.map(({ id, user }) => (
              <a
                key={id}
                href={`/profile/${id}`}
                id={`demo-user-${id}`}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
              >
                <div className={`w-9 h-9 rounded-full ${tierColor(user.tier)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">{user.name}</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <TierBadge tier={user.tier} />
                    <span className="text-xs text-slate-500">{user.current_rating}</span>
                  </div>
                </div>
                <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
              </a>
            ))}
            {/* Fallback if no users loaded */}
            {demoUsers.length === 0 && (
              <div className="col-span-3 text-center py-6 text-slate-400 italic text-sm">
                Could not reach the API — start the backend and refresh.
              </div>
            )}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="w-full">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={18} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex gap-4">
                <div className={`w-8 h-8 rounded-full ${s.color} text-white font-bold text-sm flex items-center justify-center shrink-0 mt-0.5`}>
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tier Reference Table ── */}
        <section className="w-full">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={18} className="text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">Tier Reference</h2>
            <span className="ml-1 text-sm text-slate-500">— how ratings map to tiers</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide text-xs">Tier</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide text-xs">Rating Range</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide text-xs hidden sm:table-cell">Users in Demo</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t, i) => {
                  const examples = demoUsers
                    .filter((u) => u.user.tier.toLowerCase() === t.name.toLowerCase())
                    .map((u) => u.user.name)
                    .join(', ');
                  return (
                    <tr key={t.name} className={i < TIERS.length - 1 ? 'border-b border-gray-50' : ''}>
                      <td className="px-5 py-3">
                        <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${t.color}`}>{t.name}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-700">{t.text}</td>
                      <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{examples || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400 text-center">
            Tiers are recalculated after every contest via percentile-based performance scoring (Go backend).
          </p>
        </section>

      </div>
    </div>
  );
}
