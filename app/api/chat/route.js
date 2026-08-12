import { streamText, convertToModelMessages } from 'ai';
import { CHAT_MODEL, SYSTEM_PROMPT, CHAT_CONFIG } from '@/lib/ai/config';
import { voltcastTools } from '@/lib/ai/tools';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req) {
  const { messages } = await req.json();

  try {
    const result = streamText({
      model: CHAT_MODEL,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      maxTokens: CHAT_CONFIG.maxTokens,
      temperature: CHAT_CONFIG.temperature,
      tools: voltcastTools,
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error('Model call failed:', e);
    return new Response(
      JSON.stringify({ error: 'Model request failed. Check server logs for details.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}