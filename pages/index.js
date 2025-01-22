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

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/emails/fetch');
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      const data = await response.json();
      setEmails(data.messages);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
            <p className="text-gray-600">{session.user.email}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Fetch Emails'}
            </button>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {emails.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Recent Emails</h2>
            </div>
            <div className="divide-y">
              {emails.map((email) => (
                <div key={email.id} className="p-4 hover:bg-gray-50">
                  {session.provider === 'google' ? (
                    // Gmail format
                    <div>
                      {email.payload?.headers?.map((header) => {
                        if (header.name === 'Subject') {
                          return <p key="subject" className="font-medium">{header.value}</p>;
                        }
                        if (header.name === 'From') {
                          return <p key="from" className="text-sm text-gray-600">{header.value}</p>;
                        }
                        return null;
                      })}
                      <p className="text-sm mt-2">
                        {email.snippet}
                      </p>
                    </div>
                  ) : (
                    // Outlook format
                    <div>
                      <p className="font-medium">{email.subject}</p>
                      <p className="text-sm text-gray-600">{email.from?.emailAddress?.name}</p>
                      <p className="text-sm mt-2">{email.bodyPreview}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}