/**
 * Email Categorization API Endpoint
 * 
 * Handles AI-powered email categorization:
 * - Processes email content through OpenAI
 * - Assigns priority levels
 * - Updates categories in Supabase
 * - Handles batch processing for multiple emails
 * 
 * Categories: Urgent, Important, Low Priority, Promotional, etc.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import supabase from "@/lib/supabase";
import { processBatchEmails } from "@/lib/langchainUtils";

const MAX_BATCH_SIZE = 25;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get emails to categorize from request body
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Invalid emails array" });
    }

    // Process emails in batches to avoid rate limits
    const batches = [];
    for (let i = 0; i < emails.length; i += MAX_BATCH_SIZE) {
      batches.push(emails.slice(i, i + MAX_BATCH_SIZE));
    }

    // Process each batch
    const results = [];
    for (const batch of batches) {
      const categorizations = await processBatchEmails(batch);
      
      // Update database with categorizations
      for (let i = 0; i < batch.length; i++) {
        const email = batch[i];
        const categorization = categorizations[i];
        
        const { error } = await supabase
          .from("emails")
          .update({
            category: categorization.category,
            priority: categorization.priority,
            labels: categorization.tags
          })
          .match({ email_id: email.email_id, user_id: session.user.id });

        if (error) throw error;
        
        results.push({
          email_id: email.email_id,
          categorization
        });
      }
    }

    return res.status(200).json({ 
      success: true, 
      results 
    });

  } catch (error) {
    console.error("Error in email categorization:", error);
    return res.status(500).json({ 
      error: "Failed to categorize emails",
      details: error.message 
    });
  }
}