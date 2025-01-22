/**
 * Google API Helper Functions
 * 
 * Utilities for Gmail API interactions:
 * - Email fetching
 * - Message manipulation (archive/delete)
 * - Label management
 * - Token refresh handling
 * - Rate limiting and batch operations
 */

import { google } from 'googleapis';

export async function archiveEmail(accessToken, messageId) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });
    return true;
  } catch (error) {
    console.error('Error archiving email:', error);
    throw error;
  }
}

export async function deleteEmail(accessToken, messageId) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}

export async function markAsImportant(accessToken, messageId) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['IMPORTANT'],
      },
    });
    return true;
  } catch (error) {
    console.error('Error marking email as important:', error);
    throw error;
  }
}