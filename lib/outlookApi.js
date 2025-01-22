/**
 * Microsoft Graph API Helper Functions
 * 
 * Utilities for Outlook API interactions:
 * - Email fetching
 * - Message manipulation (archive/delete)
 * - Folder management
 * - Token refresh handling
 * - Rate limiting and batch operations
 */

export async function archiveEmail(accessToken, messageId) {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}/move`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinationId: 'archive',
      }),
    });

    if (!response.ok) {
      throw new Error(`Error archiving email: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error archiving email:', error);
    throw error;
  }
}

export async function deleteEmail(accessToken, messageId) {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error deleting email: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}

export async function markAsImportant(accessToken, messageId) {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        importance: 'high',
      }),
    });

    if (!response.ok) {
      throw new Error(`Error marking email as important: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error marking email as important:', error);
    throw error;
  }
}