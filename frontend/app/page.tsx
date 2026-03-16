import React from 'react';
import { Trophy, BarChart3, Zap, BookOpen, ArrowRight, Workflow, Database, LineChart as LineChartIcon } from 'lucide-react';
import { createContest, generateDemoContest, getUserProfile, submitContestResults } from '@/lib/api';
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
    title: 'Choose A Demo User',
    desc: 'Open any live profile card below to inspect a user’s current rating, max rating, tier, and history.',
    color: 'bg-blue-600',
  },
  {
    step: '2',
    title: 'Submit Contest Results',
    desc: 'Use the contest flow form to enter a contest name, participant count, and final rank for that user.',
    color: 'bg-indigo-600',
  },
  {
    step: '3',
    title: 'See The Stored Outcome',
    desc: 'After submission, the backend stores the result and the updated rating appears on the user profile graph.',
    color: 'bg-purple-600',
  },
];

const FLOW_STEPS = [
  {
    title: 'Contest Ends',
    desc: 'You enter the user ID, contest name, total participants, and final rank.',
    icon: Trophy,
  },
  {
    title: 'Percentile Check',
    desc: 'The Go backend maps that rank into a percentile bracket and picks the expected performance rating.',
    icon: Workflow,
  },
  {
    title: 'Rating Update',
    desc: 'The system compares expected performance vs current rating and moves the rating halfway toward that target.',
    icon: BarChart3,
  },
  {
    title: 'Stored + Graphed',
    desc: 'The result is saved to the database and shown in the user profile history graph and contest table.',
    icon: Database,
  },
];

const IO_ROWS = [
  ['Your rank in a contest', 'New updated rating'],
  ['Total participants', 'Rating change (+/-)'],
  ['Your current rating', 'New tier (Bronze/Silver/Gold etc.)'],
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

async function handleContestFlow(formData: FormData) {
  'use server';

  const userId = formData.get('flowUserId')?.toString().trim() ?? '';
  const contestName = formData.get('contestName')?.toString().trim() ?? '';
  const totalParticipants = Number(formData.get('totalParticipants'));
  const rank = Number(formData.get('rank'));

  if (!userId || !contestName || !Number.isInteger(totalParticipants) || !Number.isInteger(rank)) {
    redirect('/?flowError=Please%20fill%20every%20field%20with%20valid%20numbers.');
  }

  if (totalParticipants < 1 || rank < 1 || rank > totalParticipants) {
    redirect('/?flowError=Rank%20must%20be%20between%201%20and%20total%20participants.');
  }

  try {
    await getUserProfile(userId);

    const contest = await createContest({
      name: contestName,
      total_participants: totalParticipants,
    });

    await submitContestResults(contest.id, [
      {
        user_id: Number(userId),
        rank,
      },
    ]);
  } catch {
    redirect('/?flowError=Could%20not%20store%20that%20contest%20result.%20Check%20the%20user%20ID%20and%20backend.');
  }

  redirect(`/profile/${userId}`);
}

async function handleGenerateDemoContest() {
  'use server';

  try {
    const result = await generateDemoContest();
    redirect(result.redirect_path);
  } catch {
    redirect('/?demoError=Could%20not%20generate%20a%20demo%20contest.%20Please%20make%20sure%20there%20are%20enough%20users%20in%20the%20database.');
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ flowError?: string; demoError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const demoUsers = await getDemoUsers();
  const flowError = params?.flowError;
  const demoError = params?.demoError;

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
            A contest rating workflow where every result becomes a stored rating update, a tier change, and a profile graph point powered by the Go backend.
          </p>
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
                  {id}
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

        {/* ── Input to Output Flow + real persistence ── */}
        <section className="w-full">
          <div className="flex items-center gap-2 mb-5">
            <Workflow size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800">Contest Ends - Input to Output Flow</h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Input → Output</h3>
                <p className="text-sm text-slate-500 mt-1">What goes into the system and what comes out after rating calculation.</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide text-xs">Input</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide text-xs">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {IO_ROWS.map(([input, output], index) => (
                    <tr key={input} className={index < IO_ROWS.length - 1 ? 'border-b border-gray-50' : ''}>
                      <td className="px-5 py-4 text-slate-800 font-medium">{input}</td>
                      <td className="px-5 py-4 text-slate-700">{output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <LineChartIcon size={18} className="text-indigo-500" />
                <h3 className="font-bold text-slate-800">Run The Real Flow</h3>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                This uses the deployed backend: it creates a contest, stores the result, updates the user rating, and then redirects to the profile graph.
              </p>

              <form action={handleContestFlow} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">User ID</label>
                  <input
                    name="flowUserId"
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Contest Name</label>
                  <input
                    name="contestName"
                    type="text"
                    placeholder="e.g. Weekly Round 12"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Total Participants</label>
                    <input
                      name="totalParticipants"
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Rank</label>
                    <input
                      name="rank"
                      type="number"
                      min="1"
                      placeholder="e.g. 7"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {flowError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {flowError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-md"
                >
                  Submit Result And Open Profile
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h4 className="font-bold text-slate-800">Generate Demo Contest</h4>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Instantly create one contest for all registered users, assign random ranks, update every rating in the database, and open the winner&apos;s profile graph.
                </p>

                {demoError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
                    {demoError}
                  </div>
                )}

                <form action={handleGenerateDemoContest}>
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl font-semibold hover:bg-amber-400 transition-colors shadow-md shadow-amber-100"
                  >
                    Generate Demo Contest For All Users
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {FLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Icon size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
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
