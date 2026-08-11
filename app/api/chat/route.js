// app/api/chat/route.js
import { streamText, convertToModelMessages } from 'ai';
import { CHAT_MODEL, SYSTEM_PROMPT, CHAT_CONFIG } from '@/lib/ai/config';
import { searchCity, getCurrentWeather, getForecast } from '@/services/weatherApi';

export const runtime = 'edge';
export const maxDuration = 30;

// Common trailing/leading words that aren't part of a city name
const STOPWORDS = /\b(today|tomorrow|now|right now|please|weather|forecast|update|report)\b/gi;

// Greetings and small talk that should never be treated as a city name
const NON_CITY_WORDS = new Set([
  'hi', 'hello', 'hey', 'yo', 'sup',
  'thanks', 'thank you', 'thx', 'ty',
  'ok', 'okay', 'yes', 'no', 'yep', 'nope',
  'bye', 'goodbye', 'cool', 'nice', 'great',
  'help', 'test',
]);

// Short confirmations that mean "yes, that city" -- when we see one of these
// and can't extract a city from it, we look back at earlier messages instead.
const AFFIRMATIONS = new Set(['yes', 'yeah', 'yep', 'yup', 'correct', 'right', 'sure', 'ok', 'okay']);

function extractCity(text) {
  const cleaned = text.replace(/[?.!]/g, '').trim();

  // Pattern 1: "weather in X", "forecast for X", "rain chance of X"
  const parts = cleaned.split(/\b(?:in|of|for)\b/i);
  if (parts.length > 1) {
    let candidate = parts[parts.length - 1].trim();
    candidate = candidate.replace(STOPWORDS, '').trim();
    if (candidate) return candidate;
  }

  // Pattern 2: "X weather", "X forecast"
  const beforeKeyword = cleaned.match(/([a-zA-Z\s]+?)\s+(?:weather|forecast)\b/i);
  if (beforeKeyword) {
    const candidate = beforeKeyword[1].trim();
    if (candidate) return candidate;
  }

  // Pattern 3: plain city name with a trailing time word, e.g. "karachi tomorrow?"
  const withTrailing = cleaned.match(/^([a-zA-Z\s]+?)\s+(today|tomorrow|now|right now)$/i);
  if (withTrailing) {
    return withTrailing[1].trim();
  }

  // Pattern 4: message is just a bare city name (1-3 words, no question words)
  const bareWords = cleaned.split(/\s+/);
  const hasQuestionWord = /\b(what|how|why|when|will|should|is|are|do|does|can)\b/i.test(cleaned);
  const isNonCityWord = NON_CITY_WORDS.has(cleaned.toLowerCase());
  if (!isNonCityWord && !hasQuestionWord && bareWords.length <= 3 && /^[a-zA-Z\s]+$/.test(cleaned)) {
    return cleaned.trim();
  }

  return null;
}

async function withRetry(fn, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function POST(req) {
  const { messages } = await req.json();

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserText =
    lastUserMessage?.parts?.map((p) => (p.type === 'text' ? p.text : '')).join('') || '';

  let weatherContext = '';
  let cityGuess = extractCity(lastUserText);

  // If the user just confirmed ("yes"/"correct"/etc.) rather than naming a
  // city, the real city name is in an earlier message -- walk back to find it.
  if (!cityGuess && AFFIRMATIONS.has(lastUserText.trim().toLowerCase())) {
    const userMessages = messages.filter((m) => m.role === 'user');
    for (let i = userMessages.length - 2; i >= 0; i--) {
      const text =
        userMessages[i]?.parts?.map((p) => (p.type === 'text' ? p.text : '')).join('') || '';
      const guess = extractCity(text);
      if (guess) {
        cityGuess = guess;
        break;
      }
    }
  }

  if (cityGuess) {
    try {
      const cities = await withRetry(() => searchCity(cityGuess));

      if (cities.length > 0) {
        const city = cities[0];
        const [current, days] = await withRetry(() =>
          Promise.all([
            getCurrentWeather(city.latitude, city.longitude),
            getForecast(city.latitude, city.longitude),
          ])
        );

        const upcoming = days
          .slice(0, 3)
          .map((d) => {
            const uv = d.uvIndex != null ? `, UV index ${d.uvIndex}` : '';
            const rain = d.precipitation != null ? `, ${d.precipitation}% chance of rain` : '';
            return `${d.date}: ${d.tempMin}–${d.tempMax}°C${rain}${uv}`;
          })
          .join('; ');

        // If there were other close matches, mention them so the model can
        // clarify if the picked city seems wrong (e.g. ambiguous "Cambridge")
        const alternates = cities.slice(1, 3).map((c) => `${c.name}, ${c.country}`).join(' or ');
        const ambiguityNote = alternates
          ? `\n(If this doesn't seem like the right place, other matches for "${cityGuess}" include ${alternates} — ask the user to confirm which one they meant.)`
          : '';

        weatherContext = `

Live forecast data for ${city.name}, ${city.country}:
Current: ${current.temperature}°C, feels like ${current.feelsLike}°C, humidity ${current.humidity}%, wind ${current.windSpeed} km/h.
Next few days: ${upcoming}.
Use these real numbers directly when answering -- don't say you can't see the data.${ambiguityNote}`;
      } else {
        weatherContext = `\n\n(Searched for "${cityGuess}" but found no matching city -- let the user know and ask them to check the spelling, or suggest they try a nearby larger city.)`;
      }
    } catch (e) {
      console.error('Weather lookup failed:', e);
      weatherContext = '\n\n(Live weather lookup failed for this request -- mention that briefly.)';
    }
  }

  try {
    const result = streamText({
      model: CHAT_MODEL,
      system: SYSTEM_PROMPT + weatherContext,
      messages: await convertToModelMessages(messages),
      maxTokens: CHAT_CONFIG.maxTokens,
      temperature: CHAT_CONFIG.temperature,
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