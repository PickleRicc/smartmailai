import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Construct Microsoft OAuth URL
  const scope = encodeURIComponent('offline_access https://graph.microsoft.com/mail.read');
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/microsoft/callback`);
  const state = encodeURIComponent(JSON.stringify({ userId: session.user.id }));

  const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${process.env.MICROSOFT_CLIENT_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&response_mode=query` +
    `&state=${state}`;

  res.redirect(microsoftAuthUrl);
}
