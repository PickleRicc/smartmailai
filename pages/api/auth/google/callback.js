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

    // Get user info from Google
    const userInfo = await fetchGoogleUserInfo(tokens.access_token);

    // Update or insert user in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        provider: 'google',
        provider_user_id: userInfo.id,
        email: userInfo.email,
        updated_at: new Date()
      })
      .single();

    if (userError) throw userError;

    // Store the tokens
    await storeTokens({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      provider: 'google',
      expiresIn: tokens.expires_in
    });

    // Redirect back to the app
    res.redirect('/dashboard?provider=google');
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/login?error=GoogleAuthFailed');
  }
}

async function exchangeCodeForTokens(code) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return data;
}

async function fetchGoogleUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
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
