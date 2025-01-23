/**
 * Email Fetching API Endpoint
 */

import { getSession } from 'next-auth/react';
import { fetchGmailMessages, fetchOutlookMessages } from '../../../lib/emailUtils';
import { storeEmailMetadata, getOrCreateUser } from '../../../lib/dbUtils';
import { processBatchEmails } from '../../../lib/langchainUtils';
import supabase from '../../../lib/supabase';

const MAX_BATCH_SIZE = 25; // Increased from 10 to 25

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { provider } = session;
    const accessToken = session.accessToken;
    const email = session.user.email;

    // Check for token refresh errors
    if (session.error === 'RefreshAccessTokenError') {
      return res.status(401).json({ 
        error: 'Your session has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.log('Session debug:', {
      provider,
      hasAccessToken: !!accessToken,
      accessTokenStart: accessToken?.substring(0, 10) + '...',
      email
    });

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || MAX_BATCH_SIZE;
    const start = (page - 1) * pageSize;

    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found' });
    }

    if (!email) {
      return res.status(400).json({ error: 'No email found in session' });
    }

    // Get or create user in Supabase
    const user = await getOrCreateUser(email, provider);
    console.log('User record:', user);

    /**
     * Pagination Strategy:
     * 1. Check Supabase first for emails in the requested range (e.g., 0-24 for page 1, 25-49 for page 2)
     * 2. If Supabase has enough emails in this range (pageSize), return them
     * 3. If Supabase doesn't have enough emails:
     *    - For Gmail: Fetch fresh emails from Gmail API (it automatically gives next batch)
     *    - For Outlook: Use page parameter to fetch correct batch
     * 4. Store newly fetched emails in Supabase
     * 
     * This approach ensures:
     * - We don't need to manually track pageTokens
     * - Each page request gets fresh data if not in Supabase
     * - Pagination works naturally through range checks
     */

    // Map folder IDs to categories
    const folderToCategory = {
      'all': 'all',
      'work': 'Work',
      'personal': 'Personal',
      'promotional': 'Promotion',
      'newsletters': 'Newsletter',
      'updates': 'Update'
    };

    // First try to get emails from database
    let query = supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .order('received_at', { ascending: false })
      .range(start, start + pageSize - 1);

    // Add folder filter if not 'all'
    const folder = req.query.folder || 'all';
    if (folder !== 'all') {
      const category = folderToCategory[folder];
      query = query.eq('category', category);
    }

    console.log('Querying database with:', {
      folder,
      category: folderToCategory[folder],
      start,
      end: start + pageSize - 1,
      userId: user.id
    });

    const { data: existingEmails, error: dbError } = await query;

    if (dbError) throw dbError;

    console.log('Found in database:', {
      folder,
      count: existingEmails?.length || 0,
      requestedCount: pageSize
    });

    // If we have enough emails in database, return them
    if (existingEmails && existingEmails.length === pageSize) {
      // Get total count for pagination
      let countQuery = supabase
        .from("emails")
        .select("*", { count: 'exact' })
        .eq("user_id", user.id);

      if (folder !== 'all') {
        const category = folderToCategory[folder];
        countQuery = countQuery.eq('category', category);
      }

      const { count } = await countQuery;

      return res.status(200).json({
        success: true,
        message: 'Emails retrieved from database',
        count: existingEmails.length,
        messages: existingEmails,
        pagination: {
          page,
          pageSize,
          totalMessages: count,
          hasMore: count > (start + pageSize)
        }
      });
    }

    // If we don't have enough emails in database, fetch new ones
    let messages;
    let hasMoreEmails = false;
    
    if (provider === 'google') {
      messages = await fetchGmailMessages(accessToken, pageSize);
      hasMoreEmails = messages.length === pageSize;
    } else if (provider === 'azure-ad') {
      const response = await fetchOutlookMessages(accessToken, pageSize, page);
      messages = response.messages;
      hasMoreEmails = response.hasMore;
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    if (!messages || messages.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No more emails to fetch',
        count: 0,
        messages: [],
        pagination: {
          page,
          pageSize,
          totalMessages: 0,
          hasMore: false
        }
      });
    }

    // Process emails in batches for categorization
    const processedEmails = [];
    const batches = [];
    for (let i = 0; i < messages.length; i += MAX_BATCH_SIZE) {
      batches.push(messages.slice(i, i + MAX_BATCH_SIZE));
    }

    // Process and store each batch
    for (const batch of batches) {
      // First, get AI categorization for the batch
      const categorizations = await processBatchEmails(batch);
      
      // Store emails with their categories
      const storedResults = await Promise.all(
        batch.map((email, index) => {
          const categorization = categorizations[index];
          return storeEmailMetadata(user.id, email, provider, categorization);
        })
      );

      // Add successfully stored emails to processed list
      processedEmails.push(...storedResults.map(result => result.data).filter(Boolean));
    }

    // After storing new emails, query the database again with folder filter
    let finalQuery = supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .order('received_at', { ascending: false })
      .range(start, start + pageSize - 1);

    // Add folder filter if not 'all'
    if (folder !== 'all') {
      const category = folderToCategory[folder];
      finalQuery = finalQuery.eq('category', category);
    }

    const { data: finalEmails, error: finalError } = await finalQuery;

    if (finalError) throw finalError;

    // Get total count for pagination
    let countQuery = supabase
      .from("emails")
      .select("*", { count: 'exact' })
      .eq("user_id", user.id);

    if (folder !== 'all') {
      const category = folderToCategory[folder];
      countQuery = countQuery.eq('category', category);
    }

    const { count } = await countQuery;

    return res.status(200).json({
      success: true,
      message: 'Emails fetched and categorized successfully',
      count: finalEmails?.length || 0,
      messages: finalEmails || [],
      pagination: {
        page,
        pageSize,
        totalMessages: count,
        hasMore: count > (start + pageSize)
      }
    });

  } catch (error) {
    console.error('Error processing emails:', error);
    return res.status(500).json({ error: error.message });
  }
}