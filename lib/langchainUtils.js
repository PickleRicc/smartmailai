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

