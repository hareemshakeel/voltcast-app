# Voltcast — Generative UI / Tool Calling

## Setup

npm install ai @ai-sdk/react @ai-sdk/groq zod framer-motion

Model: Groq's free tier (openai/gpt-oss-120b) stands in for Claude, approved
by course staff since Anthropic has no ongoing free API tier — see
lib/ai/config.js for the swap-in note. No key is needed for the weather
data itself; services/weatherApi.js calls the free, unauthenticated
Open-Meteo API.

Files:

services/weatherApi.js                 existing geocoding + forecast fetch layer (unchanged, one bug fix)
lib/ai/config.js                       model + system prompt
lib/ai/tools.js                        the getForecast tool (schema + execute)
app/api/chat/route.js                  streamText route wiring the tool in
components/ForecastToolCard.jsx        4-state renderer for getForecast
components/WeatherChat.jsx             chat UI wiring useChat + tool parts

## Tool contract

### getForecast — server-side, automatic

Runs: On the server, inside streamText. The model decides on its own when to call it — no manual intent parsing.

Input schema: { location: string (required, min 1 char) }

Return shape: { location: { name, country, admin1 }, current: { temperature, feelsLike, weatherCode, humidity, windSpeed, cloudCover, tempMax, tempMin, uvIndex, sunrise, sunset }, days: [{ label, date, condition, tempMax, tempMin, feelsLike, uvIndex, precipitation, windSpeed, humidity, cloudCover, sunrise, sunset, hourly }] (5 entries), alternates: [{ name, country }] (0-2 entries) }

Errors: Throws a plain Error when searchCity() finds no match. streamText turns that into an output-error tool part with errorText set to the message — never an unhandled crash.

Missing-field plan: alternates is often an empty array — the card only renders the "Also matched…" line when it's non-empty. admin1 can be null from the geocoder — not shown in the card, only kept for future use.

## Tool part state machine

getForecast renders through four typed states (part.state), each answering a different question:

1. input-streaming — what is it doing, with what input so far? Shows the partial location as it streams in.
2. input-available — it has what it needs — running now. A pulsing dot plus the resolved city name.
3. output-available — here's the answer. Renders ForecastToolCard's ForecastBody — a real forecast card (current temp, feels-like, humidity/wind/UV, 5-day strip) — not a JSON dump.
4. output-error — what went wrong, framed for a human. A red-bordered card with errorText, never a stack trace.

Transitions are wrapped in framer-motion's AnimatePresence with a 200ms crossfade so input-streaming → output-available morphs instead of jumping.

## Known data fix

services/weatherApi.js originally mapped precipitation_sum (rainfall in mm) into a field labeled as a percentage, multiplying by 10 as a rough scale — this produced values over 100% on wet days. Fixed by requesting precipitation_probability_max from Open-Meteo instead, which is an actual 0–100 forecast probability, and dropping the * 10.

## Wiring it into a page

<WeatherChat /> is self-contained (currently rendered on /assistant) — it only needs /api/chat to exist and GROQ_API_KEY set as an environment variable, both locally (.env.local) and on Vercel (Project Settings → Environment Variables).