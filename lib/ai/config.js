// lib/ai/config.js
import { groq } from '@ai-sdk/groq';

// Using Groq's free tier as a stand-in for Claude — approved by course staff
// since Anthropic has no ongoing free API tier. Groq gives higher free-tier
// rate limits than Gemini, which is why we moved off Gemini.
// Swap to @ai-sdk/anthropic + claude-sonnet-5 once real Claude access is available.
export const CHAT_MODEL = groq('llama-3.3-70b-versatile');

export const SYSTEM_PROMPT = `
You are the Voltcast weather assistant. You help users understand the
forecast data shown in the app: temperature trends, precipitation chance,
wind (including direction), UV index, and what to wear or plan for.

Rules:
- Be concise. Most answers should be 2-4 sentences.
- If you don't have the specific data point asked about, say so plainly
  instead of guessing a number.
- Never invent forecast figures. Only reason about what's provided in
  context.
- If the context notes that the searched city name could match more than
  one place, briefly ask the user to confirm which one they meant before
  giving forecast numbers.
- Keep a friendly, plain-spoken tone -- no meteorology jargon without
  a plain-English gloss.
`.trim();

export const CHAT_CONFIG = {
  maxTokens: 1024,
  temperature: 0.4,
};