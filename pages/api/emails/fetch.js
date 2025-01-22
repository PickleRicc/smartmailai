/**
 * Email Fetching API Endpoint
 */

import { getSession } from 'next-auth/react';
import { fetchGmailMessages, fetchOutlookMessages } from '../../../lib/emailUtils';
import { storeEmailMetadata, getOrCreateUser } from '../../../lib/dbUtils';

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

    if (!accessToken) {
      return res.status(401).json({ error: 'No access token found' });
    }

    if (!email) {
      return res.status(400).json({ error: 'No email found in session' });
    }

    // Get or create user in Supabase
    const user = await getOrCreateUser(email, provider);
    console.log('User record:', user);

    let messages;
    
    if (provider === 'google') {
      messages = await fetchGmailMessages(accessToken);
    } else if (provider === 'azure-ad') {
      messages = await fetchOutlookMessages(accessToken);
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Store email metadata in Supabase using the user's UUID
    const storedEmails = await Promise.all(
      messages.map(message => storeEmailMetadata(user.id, message, provider))
    );

    return res.status(200).json({ 
      messages,
      stored: storedEmails 
    });
  } catch (error) {
    console.error('Error in fetch emails endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch emails',
      message: error.message 
    });
  }
}