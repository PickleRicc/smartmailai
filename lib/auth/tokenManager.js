import { supabase } from '../supabase';

/**
 * Stores OAuth tokens in the database
 */
export async function storeTokens({
  userId,
  accessToken,
  refreshToken,
  provider,
  expiresIn = 3600 // Default 1 hour
}) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // Check if tokens already exist for this user and provider
  const { data: existingTokens } = await supabase
    .from('tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (existingTokens) {
    // Update existing tokens
    const { error } = await supabase
      .from('tokens')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;
  } else {
    // Insert new tokens
    const { error } = await supabase
      .from('tokens')
      .insert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        provider
      });

    if (error) throw error;
  }
}

/**
 * Retrieves tokens for a user and provider
 */
export async function getTokens(userId, provider) {
  const { data: tokens, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error) throw error;
  return tokens;
}

/**
 * Checks if a token needs refresh and refreshes if necessary
 */
export async function ensureValidToken(userId, provider) {
  const tokens = await getTokens(userId, provider);
  
  if (!tokens) {
    throw new Error('No tokens found for user');
  }

  const tokenExpiresAt = new Date(tokens.token_expires_at);
  const now = new Date();
  
  // Add 5 minute buffer
  const bufferTime = 5 * 60 * 1000;
  
  if (tokenExpiresAt.getTime() - now.getTime() < bufferTime) {
    // Token is expired or will expire soon, refresh it
    if (provider === 'google') {
      return await refreshGoogleToken(tokens);
    } else if (provider === 'microsoft') {
      return await refreshMicrosoftToken(tokens);
    }
  }

  return tokens.access_token;
}

/**
 * Refreshes Google OAuth token
 */
async function refreshGoogleToken(tokens) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to refresh Google token');
  }

  await storeTokens({
    userId: tokens.user_id,
    accessToken: data.access_token,
    refreshToken: tokens.refresh_token, // Keep existing refresh token
    provider: 'google',
    expiresIn: data.expires_in,
  });

  return data.access_token;
}

/**
 * Refreshes Microsoft OAuth token
 */
async function refreshMicrosoftToken(tokens) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
      scope: 'offline_access https://graph.microsoft.com/mail.read',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to refresh Microsoft token');
  }

  await storeTokens({
    userId: tokens.user_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token, // Microsoft provides new refresh token
    provider: 'microsoft',
    expiresIn: data.expires_in,
  });

  return data.access_token;
}
