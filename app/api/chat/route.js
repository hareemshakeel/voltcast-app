import { streamText, convertToModelMessages } from 'ai';
import { CHAT_MODEL, SYSTEM_PROMPT, CHAT_CONFIG } from '@/lib/ai/config';
import { voltcastTools } from '@/lib/ai/tools';

export const runtime = 'edge';
export const maxDuration = 30;

// Sabotage toggle for Test 2 (mid-stream failure).
// Flip to true, restart dev server, send a real message from the UI, screenshot the result.
// Flip back to false before you submit the checkpoint.
// Forced off in production regardless of this value, as a safety net.
const FORCE_MIDSTREAM_TEST = process.env.NODE_ENV !== 'production' && false;

export async function POST(req) {
  const url = new URL(req.url);
  const simulate = process.env.NODE_ENV !== 'production' ? url.searchParams.get('simulate') : null;

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Malformed request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No messages provided.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (simulate === 'rate-limit') {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (simulate === 'setup-error') {
    return new Response(
      JSON.stringify({ error: 'Model request failed. Check server logs for details.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (simulate === 'malformed') {
    return new Response('not valid json{{{', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = streamText({
      model: CHAT_MODEL,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      maxTokens: CHAT_CONFIG.maxTokens,
      temperature: CHAT_CONFIG.temperature,
      tools: voltcastTools,
      ...((simulate === 'midstream' || FORCE_MIDSTREAM_TEST) && {
        experimental_transform: () => {
          let chunks = 0;
          return new TransformStream({
            transform(chunk, controller) {
              chunks++;
              if (chunks === 3) {
                throw new Error('Simulated mid-stream failure');
              }
              controller.enqueue(chunk);
            },
          });
        },
      }),
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('Stream error:', error);

        const message = error instanceof Error ? error.message : String(error);

        if (message.toLowerCase().includes('rate limit') || message.includes('429')) {
          return 'Rate limit exceeded. Please wait a moment and try again.';
        }
        if (message.toLowerCase().includes('midstream')) {
          return 'The connection was interrupted. Please retry.';
        }
        return 'Something went wrong generating a response. Please retry.';
      },
    });
  } catch (e) {
    console.error('Model call failed:', e);
    return new Response(
      JSON.stringify({ error: 'Model request failed. Check server logs for details.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}