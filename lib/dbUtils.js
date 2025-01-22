/**
 * Database Utility Functions
 * 
 * Handles all Supabase database operations:
 * - Storing email metadata
 * - Updating email status
 * - Retrieving emails with filters
 */

import supabase from '@/lib/supabase';

export async function storeEmailMetadata(userId, email, provider) {
  try {
    let emailData = {
      user_id: userId,
      email_id: email.id,
      provider: provider,
      is_read: false,
      is_archived: false,
      received_at: new Date().toISOString(),
    };

    // Handle different email formats for Gmail and Outlook
    if (provider === 'google') {
      const headers = email.payload.headers;
      emailData = {
        ...emailData,
        subject: headers.find(h => h.name === 'Subject')?.value || '',
        sender: headers.find(h => h.name === 'From')?.value || '',
        sender_email: extractEmailAddress(headers.find(h => h.name === 'From')?.value || ''),
        snippet: email.snippet,
        thread_id: email.threadId,
        has_attachments: email.payload.parts?.some(part => part.filename) || false,
        labels: email.labelIds || []
      };
    } else if (provider === 'azure-ad') {
      emailData = {
        ...emailData,
        subject: email.subject,
        sender: email.from?.emailAddress?.name,
        sender_email: email.from?.emailAddress?.address,
        snippet: email.bodyPreview,
        thread_id: email.conversationId,
        has_attachments: email.hasAttachments || false,
        labels: []
      };
    }

    const { data, error } = await supabase
      .from('emails')
      .upsert(emailData, { 
        onConflict: 'email_id',
        returning: true 
      });

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error storing email metadata:', error);
    throw error;
  }
}

// Helper function to extract email address from "Name <email@domain.com>" format
function extractEmailAddress(from) {
  const match = from.match(/<(.+)>/);
  return match ? match[1] : from;
}

export async function getStoredEmails(userId, options = {}) {
  try {
    let query = supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .order('received_at', { ascending: false });

    // Apply filters if provided
    if (options.isRead !== undefined) {
      query = query.eq('is_read', options.isRead);
    }
    if (options.isArchived !== undefined) {
      query = query.eq('is_archived', options.isArchived);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error fetching stored emails:', error);
    throw error;
  }
}

export async function getOrCreateUser(email, provider) {
  try {
    // First, try to get the existing user
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    if (!user) {
      // Create new user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ email, provider }])
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}
