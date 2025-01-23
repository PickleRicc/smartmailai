import { supabase } from '@/lib/supabase';
import { storeTokens } from '@/lib/auth/tokenManager';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // Parse the state parameter to get userId
    const { userId } = JSON.parse(decodeURIComponent(state));

    // Exchange the code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info from Microsoft Graph
    const userInfo = await fetchMicrosoftUserInfo(tokens.access_token);

    // Update or insert user in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        provider: 'microsoft',
        provider_user_id: userInfo.id,
        email: userInfo.userPrincipalName,
        updated_at: new Date()
      })
      .single();

    if (userError) throw userError;

    // Store the tokens
    await storeTokens({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      provider: 'microsoft',
      expiresIn: tokens.expires_in
    });

    // Redirect back to the app
    res.redirect('/dashboard?provider=microsoft');
  } catch (error) {
    console.error('Microsoft callback error:', error);
    res.redirect('/login?error=MicrosoftAuthFailed');
  }
}

async function exchangeCodeForTokens(code) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/microsoft/callback`;
  
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: 'offline_access https://graph.microsoft.com/mail.read',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return data;
}

async function fetchMicrosoftUserInfo(accessToken) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return data;
}
