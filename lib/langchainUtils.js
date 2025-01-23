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
import { PromptTemplate } from "@langchain/core/prompts";

// Initialize the OpenAI model with environment variables
const model = new ChatOpenAI({
  model: process.env.CATEGORIZATION_MODEL || "gpt-4o-mini",
  temperature: 0, // Keep responses deterministic
});

// Define the expected JSON structure for email categorization
const formatInstructions = `
Return a valid JSON object with the following fields:
- category: One of ["Work", "Personal", "Newsletter", "Promotion", "Update"]
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
    return 'update';
  }
  return 'business';
}

// Create the prompt template for email analysis
const emailPrompt = new PromptTemplate({
  template: `Analyze this email and assign ONE category based on these rules:

1. If it's marketing/sales/promotional → "Promotion"
2. If it's a newsletter/digest → "Newsletter"
3. If it's social media or platform notification → "Update"
4. If it's from business domain with work content → "Work"
5. Everything else → "Personal"

Subject: {subject}
From: {sender} <{sender_email}>
Domain Type: {sender_domain_type}
Snippet: {snippet}

Return a JSON response:
{format_instructions}`,
  inputVariables: ["subject", "sender", "sender_email", "sender_domain_type", "snippet", "format_instructions"],
});

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
    const sender_domain_type = getDomainType(email.sender_email);
    
    const result = await categorizeEmail.invoke({
      subject: email.subject,
      sender: email.sender,
      sender_email: email.sender_email,
      sender_domain_type,
      snippet: email.snippet,
      format_instructions: formatInstructions
    });

    // Add domain information
    result.domain_type = sender_domain_type;
    result.sender_domain = email.sender_email?.split('@')[1] || 'unknown';

    return result;

  } catch (error) {
    console.error('Error processing email:', error);
    return {
      category: 'Personal',
      reasoning: 'Error in processing, defaulted to Personal',
      domain_type: getDomainType(email.sender_email),
      sender_domain: email.sender_email?.split('@')[1] || 'unknown'
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
            category: "Personal",
            reasoning: "Error in processing, defaulted to Personal",
            domain_type: getDomainType(email.sender_email),
            sender_domain: email.sender_email?.split('@')[1] || 'unknown'
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
      category: "Personal",
      reasoning: "Error in processing, defaulted to Personal",
      domain_type: 'unknown',
      sender_domain: 'unknown'
    }));
  }
}
