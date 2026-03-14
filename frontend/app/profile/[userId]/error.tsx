'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
                <p className="text-gray-500 mb-6">
                    We couldn't load the profile for this user. The user might not exist or our servers are experiencing issues.
                </p>
                <button
                    onClick={() => reset()}
                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
