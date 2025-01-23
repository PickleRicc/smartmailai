/**
 * LangChain Configuration for Email Categorization
 * 
 * Handles:
 * - OpenAI model setup
 * - Prompt templating
 * - JSON output parsing
 * - Email categorization chain
 */

import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Initialize the OpenAI model with environment variables
const model = new ChatOpenAI({
  model: process.env.CATEGORIZATION_MODEL || "gpt-4o-mini",
  temperature: 0, // Keep responses deterministic
});

// Define the expected JSON structure for email categorization
const formatInstructions = `
Return a valid JSON object with the following fields:
- category: One of ["Work", "Personal", "Newsletter", "Promotion", "Social", "Administrative"]
- confidence: Number between 0 and 1
- priority: Integer from 1-5 where 5 is highest priority
- tags: Array of relevant topic tags
- reasoning: Brief explanation for the categorization
`;

// Helper function to extract domain from email
function getDomainType(email) {
  if (!email) return 'unknown';
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'unknown';
  
  // Common domain categorizations
  if (domain.includes('gmail.com') || domain.includes('hotmail.com') || domain.includes('yahoo.com')) {
    return 'personal';
  }
  if (domain.includes('substack') || domain.includes('medium.com')) {
    return 'newsletter';
  }
  if (domain.includes('linkedin') || domain.includes('facebook')) {
    return 'social';
  }
  return 'business'; // Default to business for unknown domains
}

// Create the prompt template for email analysis
const emailPrompt = ChatPromptTemplate.fromTemplate(`
You are an intelligent email categorization system. Analyze this email using the following structured information:

SENDER ANALYSIS
Domain Type: {sender_domain_type}
Sender: {sender} <{sender_email}>

EMAIL CONTENT
Subject: {subject}
Content: {snippet}

CATEGORIZATION GUIDELINES:
1. Work Emails (Priority 4-5):
   - Client communications, project updates
   - Meeting invites, deadlines, reports
   - Management requests, team discussions

2. Personal Emails (Priority 3-4):
   - Family and friends communication
   - Personal appointments, bills
   - Important personal notifications

3. Newsletter Emails (Priority 2-3):
   - Subscribed content, industry updates
   - News digests, blog updates
   - Educational content

4. Promotional Emails (Priority 1-2):
   - Marketing campaigns, sales
   - Product promotions, discounts
   - Commercial announcements

5. Social Emails (Priority 2-3):
   - Social network notifications
   - Event invites, social updates
   - Community discussions

6. Administrative Emails (Priority varies 2-5):
   - System notifications
   - Account security alerts
   - IT/HR communications

PRIORITY SCORING:
5 (Urgent): Immediate action required, time-sensitive
4 (High): Important but not immediate, business-critical
3 (Medium): Regular business/personal importance
2 (Low): Informational, can be read later
1 (Minimal): No action needed, promotional

{format_instructions}

Analyze the email and respond only with the requested JSON format.
`);

// Set up the JSON parser
const parser = new JsonOutputParser();

// Create the processing chain
const categorizeEmail = emailPrompt
  .pipe(model)
  .pipe(parser);

/**
 * Process a single email for categorization
 * @param {Object} email - Email object containing subject, sender, sender_email, and snippet
 * @returns {Promise<Object>} Categorization results
 */
export async function processEmail(email) {
  try {
    console.log('Processing email:', {
      subject: email.subject,
      sender: email.sender,
      snippet: email.snippet?.substring(0, 50) + '...'
    });

    const result = await categorizeEmail.invoke({
      subject: email.subject || "",
      sender: email.sender || "",
      sender_email: email.sender_email || "",
      snippet: email.snippet || "",
      sender_domain_type: getDomainType(email.sender_email),
      format_instructions: formatInstructions,
    });

    console.log('Raw model response:', result);
    
    // Handle different response formats
    try {
      // If it's already a valid JSON object, return it
      if (typeof result === 'object' && result !== null) {
        return result;
      }
      
      // If it's a string, try various parsing methods
      if (typeof result === 'string') {
        // Try parsing markdown JSON
        if (result.includes('```json')) {
          const jsonStr = result.replace(/```json\n|\n```/g, '').trim();
          return JSON.parse(jsonStr);
        }
        
        // Try parsing plain JSON string
        try {
          return JSON.parse(result);
        } catch (parseError) {
          console.log('Not a plain JSON string, using fallback');
        }
      }

      // Fallback: Return a basic categorization
      console.log('Using fallback categorization for email:', email.subject);
      return {
        category: "Uncategorized",
        confidence: 0.5,
        priority: 3,
        tags: ["auto-categorized"],
        reasoning: "Fallback categorization due to processing error"
      };
    } catch (processingError) {
      console.error('Error processing model response:', processingError);
      // Return fallback categorization instead of throwing
      return {
        category: "Uncategorized",
        confidence: 0.5,
        priority: 3,
        tags: ["auto-categorized"],
        reasoning: "Fallback categorization due to processing error"
      };
    }
  } catch (error) {
    console.error("Error processing email:", error);
    // Return fallback instead of throwing
    return {
      category: "Uncategorized",
      confidence: 0.5,
      priority: 3,
      tags: ["auto-categorized"],
      reasoning: "Fallback categorization due to processing error"
    };
  }
}

/**
 * Process a batch of emails for categorization
 * @param {Array} emails - Array of email objects
 * @returns {Promise<Array>} Array of categorization results
 */
export async function processBatchEmails(emails) {
  console.log(`Processing batch of ${emails.length} emails`);
  
  try {
    // Process emails with individual error handling
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          return await processEmail(email);
        } catch (error) {
          console.error(`Error processing email in batch (${email.subject}):`, error);
          // Return fallback for failed email instead of failing entire batch
          return {
            category: "Uncategorized",
            confidence: 0.5,
            priority: 3,
            tags: ["auto-categorized"],
            reasoning: "Fallback categorization due to batch processing error"
          };
        }
      })
    );

    console.log(`Successfully processed ${results.length} emails in batch`);
    return results;
  } catch (error) {
    console.error("Error processing batch:", error);
    // Return fallback results for all emails instead of failing
    return emails.map(() => ({
      category: "Uncategorized",
      confidence: 0.5,
      priority: 3,
      tags: ["auto-categorized"],
      reasoning: "Fallback categorization due to batch processing error"
    }));
  }
}
