import { google } from 'googleapis';

export class GmailAdapter {
  constructor(accessToken) {
    this.oauth2Client = new google.auth.OAuth2();
    this.oauth2Client.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async fetchEmails({ pageToken = undefined, maxResults = 10 }) {
    try {
      console.log('=== Starting fetchEmails ===');
      console.log('Input params:', { pageToken, maxResults });

      // List messages
      console.log('Fetching messages...');
      let response;
      try {
        response = await this.gmail.users.messages.list({
          userId: 'me',
          maxResults: 50, // Get more messages so we can sort by date
          labelIds: ['INBOX'],
          orderBy: 'internalDate desc'
        });

        if (!response?.data) {
          throw new Error('Invalid response format from Gmail API');
        }
      } catch (error) {
        console.error('Gmail API error:', error);
        // Check if error is auth-related
        if (error.code === 401 || error.code === 403) {
          throw new Error('Gmail authentication failed. Please sign in again.');
        }
        throw new Error(`Failed to fetch from Gmail API: ${error.message}`);
      }

      console.log('List response:', {
        messageCount: response.data.messages?.length,
        hasNextPage: !!response.data.nextPageToken,
        pageToken: pageToken || 'none (first page)',
        resultSizeEstimate: response.data.resultSizeEstimate,
        firstMessageId: response.data.messages?.[0]?.id,
        lastMessageId: response.data.messages?.[response.data.messages?.length - 1]?.id
      });

      const messages = response.data.messages || [];
      
      if (messages.length === 0) {
        console.log('No messages found');
        return { emails: [], nextPageToken: null };
      }

      console.log(`Fetching details for ${messages.length} messages...`);
      
      // Fetch full email details for each message
      const emailDetails = await Promise.all(
        messages.map(async (message, index) => {
          console.log(`Fetching details for message ${index + 1}/${messages.length}...`);
          
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });

          const headers = detail.data.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          const internalDate = parseInt(detail.data.internalDate);
          const receivedHeader = headers.find(h => h.name === 'Received')?.value;

          console.log('Message details:', {
            id: message.id,
            subject: subject.substring(0, 30) + '...',
            date,
            internalDate: new Date(internalDate).toISOString(),
            receivedHeader: receivedHeader?.substring(0, 50) + '...',
            labels: detail.data.labelIds,
            historyId: detail.data.historyId,
            threadId: detail.data.threadId
          });

          return {
            provider_email_id: message.id,
            subject,
            snippet: detail.data.snippet || '',
            date_received: new Date(internalDate),
            raw_data: {
              from,
              threadId: detail.data.threadId,
              labelIds: detail.data.labelIds,
              historyId: detail.data.historyId
            },
          };
        })
      );

      // Sort by internal date (newest first) and take only maxResults
      console.log('Sorting messages...');
      const sortedEmails = emailDetails
        .sort((a, b) => b.date_received.getTime() - a.date_received.getTime())
        .slice(0, maxResults);

      console.log('Final sorted messages:', sortedEmails.map(e => ({
        id: e.provider_email_id,
        date: e.date_received.toISOString(),
        subject: e.subject.substring(0, 30) + '...'
      })));

      console.log('=== Finished fetchEmails ===');

      return {
        emails: sortedEmails,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Gmail fetch error:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw new Error(`Failed to fetch emails from Gmail: ${error.message}`);
    }
  }
}
