import React from 'react';

interface TierBadgeProps {
    tier: string;
}

export default function TierBadge({ tier }: TierBadgeProps) {
    let bgColor = 'bg-gray-500';

    switch (tier.toLowerCase()) {
        case 'newbie':
            bgColor = 'bg-gray-400';
            break;
        case 'pupil':
            bgColor = 'bg-green-500';
            break;
        case 'specialist':
            bgColor = 'bg-cyan-500';
            break;
        case 'expert':
            bgColor = 'bg-blue-600';
            break;
        case 'master':
            bgColor = 'bg-purple-600';
            break;
        case 'grandmaster':
            bgColor = 'bg-red-600';
            break;
        default:
            bgColor = 'bg-slate-500';
    }

    return (
        <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${bgColor}`}>
            {tier}
        </span>
    );
}
