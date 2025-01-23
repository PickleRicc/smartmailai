export class OutlookAdapter {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  async fetchEmails({ skipToken, maxResults = 50 }) {
    try {
      console.log('=== Starting Outlook fetchEmails ===');
      console.log('Input params:', { skipToken, maxResults });

      // Use the full nextLink URL if provided, otherwise construct initial URL
      const url = skipToken
        ? `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$skiptoken=${skipToken}`
        : `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$select=id,subject,bodyPreview,receivedDateTime,from,importance,isRead`;

      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      let errorData;
      let responseText;
      
      try {
        responseText = await response.text(); // Get raw response text first
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          // Response wasn't JSON, use text as error message
          errorData = { error: responseText };
        }
      } catch (e) {
        errorData = { error: 'Failed to read response' };
      }

      if (!response.ok) {
        console.error('Outlook API error:', errorData);
        throw new Error(`Failed to fetch from Outlook API: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse Outlook API response:', e);
        throw new Error('Invalid JSON response from Outlook API');
      }

      console.log('Response metadata:', {
        count: data.value?.length,
        hasNextPage: !!data['@odata.nextLink'],
        firstEmailDate: data.value?.[0]?.receivedDateTime,
        lastEmailDate: data.value?.[data.value.length - 1]?.receivedDateTime
      });
      
      const emails = data.value.map(message => {
        const mappedEmail = {
          provider_email_id: message.id,
          subject: message.subject || '',
          snippet: message.bodyPreview || '',
          date_received: new Date(message.receivedDateTime),
          raw_data: {
            from: message.from?.emailAddress?.address,
            importance: message.importance,
            isRead: message.isRead,
          },
        };

        console.log('Mapped email:', {
          id: mappedEmail.provider_email_id,
          subject: mappedEmail.subject.substring(0, 30) + '...',
          date: mappedEmail.date_received.toISOString(),
          from: mappedEmail.raw_data.from
        });

        return mappedEmail;
      });

      // Sort by date just to be sure
      const sortedEmails = emails.sort((a, b) => 
        b.date_received.getTime() - a.date_received.getTime()
      );

      console.log('=== Finished Outlook fetchEmails ===');

      return {
        emails: sortedEmails,
        nextPageToken: data['@odata.nextLink'] || null
      };
    } catch (error) {
      console.error('Outlook fetch error:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch emails from Outlook: ${error.message}`);
    }
  }
}
