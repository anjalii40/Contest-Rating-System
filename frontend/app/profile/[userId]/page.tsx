import { getUserProfile } from '@/lib/api';
import TierBadge from '@/components/TierBadge';
import RatingChart from '@/components/RatingChart';
import { Trophy, TrendingUp, Maximize, Target } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
    try {
        const { user, history } = await getUserProfile(params.userId);

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Header Profile Info */}
                    <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">{user.name}</h1>
                            <div className="flex items-center gap-3">
                                <TierBadge tier={user.tier} />
                                <span className="text-slate-400 text-sm">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Current Rating</div>
                            <div className="text-5xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                {user.current_rating}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 border-b border-gray-100">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Trophy size={16} /> <span className="text-sm font-medium">Contests</span>
                            </div>
                            <div className="text-2xl font-bold">{user.contests_played}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Maximize size={16} /> <span className="text-sm font-medium">Max Rating</span>
                            </div>
                            <div className="text-2xl font-bold">{user.max_rating}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <TrendingUp size={16} /> <span className="text-sm font-medium">Change</span>
                            </div>
                            <div className="text-2xl font-bold text-green-500">
                                {history.length > 0 && history[0].rating_change > 0 ? '+' : ''}
                                {history.length > 0 ? history[0].rating_change : 0}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Target size={16} /> <span className="text-sm font-medium">Last Perf</span>
                            </div>
                            <div className="text-2xl font-bold">{history.length > 0 ? history[0].performance_rating : '-'}</div>
                        </div>
                    </div>

                    {/* Rating Graph */}
                    <div className="p-8">
                        <h2 className="text-xl font-bold mb-2">Rating Graph</h2>
                        <RatingChart history={history} />
                    </div>

                </div>
            </div>
        );
    } catch (error) {
        return notFound();
    }
}
