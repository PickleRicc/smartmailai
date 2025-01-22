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
import { useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);  // Start with false since no emails fetched yet
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);  // Track if initial fetch happened

  const fetchEmails = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/emails/fetch?page=${pageNum}`);
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      const data = await response.json();
      
      // If it's the first page, replace emails. Otherwise, append them
      setEmails(prevEmails => pageNum === 1 ? data.messages : [...prevEmails, ...data.messages]);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
      setHasFetchedInitial(true);  // Mark that we've done the initial fetch
    } catch (err) {
      setError(err.message);
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchEmails(page + 1);
    }
  };

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
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Smart Inbox</h1>
            <p className="text-gray-600 mt-1">{session.user.email}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => fetchEmails(1)}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Emails'}
            </button>
            <button
              onClick={() => signOut()}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {emails.length > 0 ? (
          <div>
            <div className="space-y-4">
              {emails.map((email) => (
                <div key={email.email_id} className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold">{email.subject}</h3>
                  <p className="text-gray-600">{email.sender}</p>
                  <p className="text-sm text-gray-500 mt-2">{email.snippet}</p>
                  {email.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded mt-2">
                      {email.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Debug info */}
            <div className="mt-4 text-sm text-gray-500">
              <p>Has More: {hasMore ? 'true' : 'false'}</p>
              <p>Current Page: {page}</p>
              <p>Email Count: {emails.length}</p>
            </div>

            {/* Show Load More if hasMore is true */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        ) : hasFetchedInitial ? (
          <div className="text-center text-gray-600">No emails found</div>
        ) : (
          <div className="text-center text-gray-600">Click 'Fetch Emails' to load your messages</div>
        )}
      </main>
    </div>
  );
}