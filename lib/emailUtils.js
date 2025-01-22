import { google } from 'googleapis';

export async function fetchGmailMessages(accessToken) {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    const detailedMessages = await Promise.all(
      messages.map(async (message) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });
        return detail.data;
      })
    );

    return detailedMessages;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

export async function fetchOutlookMessages(accessToken) {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=subject,from,receivedDateTime,bodyPreview', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching Outlook messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error('Error fetching Outlook messages:', error);
    throw error;
  }
}
