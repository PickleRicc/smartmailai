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
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function Home() {
  const { data: session, status } = useSession();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading Emails');
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('all');

  useEffect(() => {
    if (session && !hasFetchedInitial) {
      setInitialLoading(true);
      fetchEmails(1, 'all');
    }
  }, [session]);

  useEffect(() => {
    if (initialLoading) {
      const interval = setInterval(() => {
        setLoadingText(prev => prev === 'Loading Emails' ? 'Sorting with AI' : 'Loading Emails');
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [initialLoading]);

  const handleFolderSelect = (folderId) => {
    console.log('Folder selected:', folderId);
    setCurrentFolder(folderId);
    setPage(1); // Reset pagination when changing folders
    setEmails([]); // Clear existing emails
    fetchEmails(1, folderId); // Fetch emails for new folder
  };

  const fetchEmails = async (pageNum = 1, folder = currentFolder) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching emails:', {
        page: pageNum,
        folder,
        currentFolder
      });

      const response = await fetch(
        `/api/emails/fetch?page=${pageNum}&folder=${folder}`
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch emails');

      console.log('Received emails:', {
        count: data.messages?.length || 0,
        hasMore: data.pagination.hasMore
      });

      // If it's page 1, replace emails. Otherwise, append them
      setEmails(prev => pageNum === 1 ? data.messages : [...prev, ...data.messages]);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
      
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setHasFetchedInitial(true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchEmails(page + 1);
    }
  };

  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">{loadingText}...</p>
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

  const displayEmails = filteredEmails.length > 0 ? filteredEmails : emails;

  return (
    <div className="min-h-screen bg-[#1A1B1E] flex">
      <Navbar onFolderSelect={handleFolderSelect} />
      
      <main className="flex-1 bg-[#1A1B1E] border-l border-[#2D2E32]">
        {/* Header */}
        <div className="h-16 border-b border-[#2D2E32] flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-medium text-white">Smart Inbox</h1>
            <p className="text-sm text-gray-400">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M16 13v-2H7V8l-5 4 5 4v-3z M3.9 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8zm8 6c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6z"/>
            </svg>
          </button>
        </div>

        {/* Email List */}
        <div className="p-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {displayEmails.length > 0 ? (
            <div className="space-y-2">
              {displayEmails.filter(email => email).map((email) => (
                <div 
                  key={email.email_id} 
                  className="bg-[#25262B] rounded-lg p-4 hover:bg-[#2C2D32] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-white truncate">{email.subject}</h3>
                        {email.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#6366F1]/20 text-[#6366F1]">
                            {email.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{email.sender}</p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{email.snippet}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                      <span className="text-xs text-gray-400">
                        {new Date(email.received_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasFetchedInitial ? (
            <div className="text-center text-gray-400 py-12">No emails found</div>
          ) : null}

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-[#2D2E32] text-gray-300 px-6 py-2 rounded-lg hover:bg-[#35363A] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}