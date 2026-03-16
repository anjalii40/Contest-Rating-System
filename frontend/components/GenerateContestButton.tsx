'use client';

import { LoaderCircle, Sparkles } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export default function GenerateContestButton() {
  const { pending } = useFormStatus();

  return (
    <>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/60 bg-white/95 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-300 to-pink-300 shadow-lg shadow-amber-200/80">
              <LoaderCircle size={36} className="animate-spin text-slate-900" />
            </div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles size={14} className="text-amber-500" />
              Creating contest
            </div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Generating fresh ranks...</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              We&apos;re assigning random ranks, updating ratings, and preparing the standings page.
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3.5 bg-amber-500 text-slate-950 rounded-xl font-semibold transition-colors shadow-md shadow-amber-100 hover:bg-amber-400 disabled:cursor-wait disabled:bg-amber-300"
      >
        {pending ? 'Generating Contest...' : 'Generate Demo Contest For All Users'}
      </button>
    </>
  );
}
