import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Construct Google OAuth URL
  const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly');
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/google/callback`);
  const state = encodeURIComponent(JSON.stringify({ userId: session.user.id }));

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  res.redirect(googleAuthUrl);
}
