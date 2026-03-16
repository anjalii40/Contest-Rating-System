import React from 'react';
import { Trophy } from 'lucide-react';
import { generateDemoContest } from '@/lib/api';
import { redirect } from 'next/navigation';

async function handleGenerateDemoContest() {
  'use server';

  let redirectPath = '';

  try {
    const result = await generateDemoContest();
    redirectPath = result.redirect_path;
  } catch {
    redirect('/?demoError=Could%20not%20generate%20a%20demo%20contest.%20Please%20make%20sure%20there%20are%20enough%20users%20in%20the%20database.');
  }

  redirect(redirectPath);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ demoError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const demoError = params?.demoError;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 flex flex-col items-center gap-12">

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

        <section className="w-full max-w-xl">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} className="text-amber-500" />
              <h2 className="text-xl font-bold text-slate-800">Generate Demo Contest</h2>
            </div>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-6">
              Create one contest for all registered users, assign random ranks, store every rating update, and open a searchable rank list with direct profile links.
            </p>

            {demoError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
                {demoError}
              </div>
            )}

            <form action={handleGenerateDemoContest}>
              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 text-slate-950 rounded-xl font-semibold hover:bg-amber-400 transition-colors shadow-md shadow-amber-100"
              >
                Generate Demo Contest For All Users
              </button>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
}
