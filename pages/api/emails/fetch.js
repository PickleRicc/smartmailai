import { getSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { GmailAdapter } from '@/lib/email/providers/gmail';
import { OutlookAdapter } from '@/lib/email/providers/outlook';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (tokenError || !tokens) {
      console.error('Token error:', tokenError);
      return res.status(401).json({ error: 'No valid tokens found' });
    }

    // Get sync state
    const { data: syncState, error: syncError } = await supabase
      .from('sync_state')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('provider', tokens.provider)
      .single();

    if (syncError) {
      console.error('Sync state error:', syncError);
    }

    // Initialize email provider adapter
    const adapter = tokens.provider === 'google' 
      ? new GmailAdapter(tokens.access_token)
      : new OutlookAdapter(tokens.access_token);

    try {
      // Fetch emails using the appropriate page token
      const { emails, nextPageToken } = await adapter.fetchEmails({
        pageToken: req.query.pageToken || syncState?.sync_token,
        maxResults: 50
      });

      // Store new emails in database
      if (emails.length > 0) {
        const { error: insertError } = await supabase
          .from('emails')
          .upsert(
            emails.map(email => ({
              user_id: session.user.id,
              ...email,
              folder: 'inbox', // Default folder, will be updated by AI
              is_focus: false  // Default focus state, will be updated by AI
            })),
            { onConflict: 'provider_email_id' }
          );

        if (insertError) {
          console.error('Error storing emails:', insertError);
          return res.status(500).json({ error: 'Failed to store emails' });
        }
      }

      // Update sync state with new token
      if (nextPageToken) {
        const { error: updateError } = await supabase
          .from('sync_state')
          .upsert({
            user_id: session.user.id,
            provider: tokens.provider,
            sync_token: nextPageToken,
            last_sync_time: new Date().toISOString()
          }, {
            onConflict: 'user_id,provider'
          });

        if (updateError) {
          console.error('Error updating sync state:', updateError);
        }
      }

      // Queue emails for AI processing
      if (emails.length > 0) {
        const { error: queueError } = await supabase
          .from('email_processing_queue')
          .insert(
            emails.map(email => ({
              email_id: email.id,
              status: 'pending'
            }))
          );

        if (queueError) {
          console.error('Error queueing emails for processing:', queueError);
        }
      }

      return res.status(200).json({
        emails,
        nextPageToken,
        count: emails.length
      });
    } catch (fetchError) {
      console.error('Email fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch emails' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}