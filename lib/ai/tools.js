import { tool } from 'ai';
import { z } from 'zod';
import { searchCity, getCurrentWeather, getForecast as fetchForecastDays } from '@/services/weatherApi';

/**
 * getForecast (AI tool)
 * ------------------------------------------------------------------
 * Replaces the regex-based extractCity()/context-stuffing that used
 * to live in app/api/chat/route.js. The model now decides when a
 * forecast is needed and calls this directly, instead of us parsing
 * intent by hand before the model ever sees the message.
 *
 * Wraps your existing searchCity / getCurrentWeather / getForecast —
 * no new fetch logic, same data your /forecast page already trusts.
 */
export const getForecast = tool({
  description:
    "Look up the current conditions and 5-day forecast for a city so it can be shown to the user. Always call this when the user asks about weather, temperature, rain, wind, or UV for a place — never guess or reuse a number from earlier in the conversation.",
  inputSchema: z.object({
    location: z
      .string()
      .min(1)
      .describe(
        'A city name as typed or implied by the user, e.g. "Lahore" or "Karachi tomorrow" -> "Karachi". Do not invent a location the user never mentioned.',
      ),
  }),
  execute: async ({ location }) => {
    const cities = await searchCity(location);
    const city = cities[0];

    if (!city) {
      // Thrown here -> AI SDK turns this into an output-error tool
      // part with errorText set to this message. Not a crash.
      throw new Error(`No location found matching "${location}"`);
    }

    const [current, days] = await Promise.all([
      getCurrentWeather(city.latitude, city.longitude),
      fetchForecastDays(city.latitude, city.longitude),
    ]);

    // Other close name matches (e.g. ambiguous "Cambridge") -- optional,
    // the card only shows these if present, and the model can ask the
    // user to confirm instead of committing to the wrong one.
    const alternates = cities
      .slice(1, 3)
      .map((c) => ({ name: c.name, country: c.country }));

    return {
      location: { name: city.name, country: city.country, admin1: city.admin1 ?? null },
      current,
      days,
      alternates,
    };
  },
});

export const voltcastTools = { getForecast };