import { google } from 'googleapis';

// Default batch size if not specified
const DEFAULT_BATCH_SIZE = 25;

/**
 * Fetch messages from Gmail API
 * 
 * Gmail API Behavior:
 * - Each call automatically returns the next batch of messages
 * - No need to track pageToken because:
 *   1. We check Supabase ranges first (e.g., 0-24, 25-49)
 *   2. If range is empty, we fetch fresh from Gmail
 *   3. Gmail gives us the next batch automatically
 * 
 * @param {string} accessToken - OAuth2 access token
 * @param {number} batchSize - Number of messages to fetch (default: 25)
 */
export async function fetchGmailMessages(accessToken, batchSize = DEFAULT_BATCH_SIZE) {
  try {
    console.log('Gmail access token:', accessToken?.substring(0, 10) + '...');
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });
    
    // First, get list of message IDs
    console.log('Requesting Gmail messages with batch size:', batchSize);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: batchSize,  // Request specific number of messages
      labelIds: ['INBOX'],    // Only get inbox messages
      q: 'in:inbox',          // Ensure we're only getting inbox messages
    });

    console.log('Gmail API Response:', {
      batchSize,
      resultCount: response.data.messages?.length || 0,
      nextPageToken: response.data.nextPageToken,
      response: response.data
    });

    if (!response.data.messages) {
      return [];
    }

    // Then get full message details
    const messages = response.data.messages.slice(0, batchSize);  // Ensure we don't process more than batchSize
    console.log('Processing messages:', messages.length);
    
    const detailedMessages = await Promise.all(
      messages.map(async (message) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });
        return detail.data;
      })
    );

    console.log('Fetched detailed messages:', detailedMessages.length);
    return detailedMessages;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

/**
 * Fetch messages from Outlook API
 * 
 * Outlook API Behavior:
 * - Uses explicit skip/top pagination
 * - We calculate skip based on page number
 * - Each batch is independent (no need for continuationToken)
 * 
 * @param {string} accessToken - OAuth2 access token
 * @param {number} batchSize - Number of messages to fetch (default: 25)
 * @param {number} page - Page number for pagination
 */
export async function fetchOutlookMessages(accessToken, batchSize = DEFAULT_BATCH_SIZE, page = 1) {
  try {
    console.log('Requesting Outlook messages with batch size:', batchSize, 'page:', page);
    
    // Calculate skip for pagination
    const skip = (page - 1) * batchSize;
    
    // Ensure we're requesting the right number of messages and only from inbox
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${batchSize}&$skip=${skip}&$select=subject,from,receivedDateTime,bodyPreview,conversationId,hasAttachments&$orderby=receivedDateTime desc`, 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching Outlook messages: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('Outlook API Response:', {
      batchSize,
      page,
      skip,
      resultCount: data.value?.length || 0,
      nextLink: data['@odata.nextLink'] ? 'Present' : 'None'
    });

    return {
      messages: data.value || [],
      nextLink: data['@odata.nextLink'],
      hasMore: !!data['@odata.nextLink']
    };
  } catch (error) {
    console.error('Error fetching Outlook messages:', error);
    throw error;
  }
}
