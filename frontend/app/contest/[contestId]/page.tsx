import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Trophy, Users } from 'lucide-react';
import ContestStandings from '@/components/ContestStandings';
import { getContestWithStandings } from '@/lib/api';

export default async function ContestPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contestData = await getContestWithStandings(contestId).catch(() => null);

  if (!contestData) {
    notFound();
  }

  const { contest, standings } = contestData;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 sm:self-auto">
            <Trophy size={16} />
            Contest generated successfully
          </div>
        </div>

        <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">Generated Contest</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">{contest.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                The backend assigned random ranks, recalculated ratings for everyone in this contest, and stored each result in rating history.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CalendarDays size={14} />
                  Date
                </div>
                <div className="text-sm font-semibold text-slate-900">{new Date(contest.date).toLocaleString()}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Users size={14} />
                  Participants
                </div>
                <div className="text-sm font-semibold text-slate-900">{contest.total_participants}</div>
              </div>
            </div>
          </div>
        </section>

        <ContestStandings contest={contest} standings={standings} />
      </div>
    </div>
  );
}
