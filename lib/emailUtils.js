

// Default batch size if not specified

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
 * Outlook API Behavior:
 * - Uses explicit skip/top pagination
 * - We calculate skip based on page number
 * - Each batch is independent (no need for continuationToken)
 * 
 */