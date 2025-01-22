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

    // Check if we already have emails in Supabase for this user
    const { data: existingEmails, error: existingError } = await supabase
      .from("emails")
      .select("email_id")
      .eq("user_id", user.id)
      .range(start, start + pageSize - 1)
      .order('created_at', { ascending: false });

    console.log('Database check:', {
      start,
      pageSize,
      existingEmailsCount: existingEmails?.length || 0
    });

    // Only return existing emails if we have enough for this page
    if (existingEmails?.length === pageSize) {
      const { data: fullEmails, error: fullError } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .range(start, start + pageSize - 1)
        .order('created_at', { ascending: false });

      console.log('Retrieved from database:', {
        requestedRange: [start, start + pageSize - 1],
        retrievedCount: fullEmails?.length || 0
      });

      if (fullError) throw fullError;

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("emails")
        .select("email_id", { count: 'exact' })
        .eq("user_id", user.id);

      if (countError) throw countError;

      return res.status(200).json({
        success: true,
        message: 'Emails retrieved from database',
        count: fullEmails.length,
        messages: fullEmails,
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
      hasMoreEmails = messages.length === pageSize;  // For Gmail, assume more if we got a full page
    } else if (provider === 'azure-ad') {
      const response = await fetchOutlookMessages(accessToken, pageSize, page);
      messages = response.messages;
      hasMoreEmails = response.hasMore;
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    console.log('Fetched messages:', {
      count: messages?.length || 0,
      pageSize,
      page,
      hasMore: hasMoreEmails
    });

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

    // Store email metadata in Supabase using the user's UUID
    const storedResults = await Promise.all(
      messages.map(message => storeEmailMetadata(user.id, message, provider))
    );

    console.log('Stored in database:', {
      storedCount: storedResults.length
    });

    // Extract emailData from stored results for categorization
    const emailsToProcess = storedResults.map(result => result.emailData);

    console.log('Processing batches:', {
      totalEmails: emailsToProcess.length,
      batchCount: Math.ceil(emailsToProcess.length / MAX_BATCH_SIZE),
      batchSizes: Array(Math.ceil(emailsToProcess.length / MAX_BATCH_SIZE)).fill(MAX_BATCH_SIZE)
    });

    // Process emails in batches for categorization
    const batches = [];
    for (let i = 0; i < emailsToProcess.length; i += MAX_BATCH_SIZE) {
      batches.push(emailsToProcess.slice(i, i + MAX_BATCH_SIZE));
    }

    // Categorize each batch and update database
    const processedEmails = [];
    for (const batch of batches) {
      const categorizations = await processBatchEmails(batch);
      
      // Update emails with categorizations
      await Promise.all(
        batch.map(async (email, index) => {
          const categorization = categorizations[index];
          const { error } = await supabase
            .from("emails")
            .update({
              category: categorization.category,
              priority: categorization.priority,
              labels: categorization.tags
            })
            .match({ email_id: email.email_id, user_id: user.id });

          if (error) throw error;
          
          // Add processed email to our list
          processedEmails.push({
            ...email,
            category: categorization.category,
            priority: categorization.priority,
            labels: categorization.tags
          });
        })
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Emails fetched and categorized successfully',
      count: emailsToProcess.length,
      messages: processedEmails,
      pagination: {
        page,
        pageSize,
        totalMessages: messages.length,
        hasMore: hasMoreEmails
      }
    });

  } catch (error) {
    console.error('Error processing emails:', error);
    return res.status(500).json({ error: error.message });
  }
}