/**
 * Main Dashboard Page
 * 
 * Serves as the primary interface for the email management system.
 * Features:
 * - Email categorization display
 * - Priority inbox
 * - Bulk actions (archive/delete)
 * - Weekly analytics and insights
 */

import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold mb-8">Welcome to SmartMail</h1>
        <button
          onClick={() => signIn('google')}
          className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <img src="/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
        <button
          onClick={() => signIn('azure-ad')}
          className="px-4 py-2 bg-[#2F2F2F] text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <img src="/microsoft.svg" alt="Microsoft" className="w-5 h-5" />
          Sign in with Microsoft
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
            <p className="text-gray-600">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        {/* Email dashboard content will go here */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Successfully signed in with {session.provider}</p>
        </div>
      </div>
    </div>
  );
}