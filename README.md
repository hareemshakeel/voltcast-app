# Voltcast

A weather application that pairs live weather, air quality, and UV data with an AI assistant that can answer plain-language questions about conditions — built as a capstone project for the frontend internship program.

**Live app:** https://voltcast-app.vercel.app/

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **AI:** Vercel AI SDK + Groq-hosted model, with custom tool calling
- **Weather data:** Open-Meteo (forecast, air quality, geocoding)
- **Testing:** Vitest + React Testing Library (unit), Playwright (end-to-end)

## Getting Started

### Prerequisites

- Node.js (LTS)
- A free Groq API key from [console.groq.com](https://console.groq.com)

### Setup

```bash
git clone https://github.com/hareemshakeel/voltcast-app.git
cd voltcast-app
npm install
```

Create a `.env.local` file in the project root:

```
GROQ_API_KEY=your_key_here
```

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Architecture Overview

- **`app/`** — Next.js App Router pages: homepage, `/forecast` (5-day forecast), `/health` (air quality & UV dashboard), and `app/api/chat/route.js` (the AI chat API endpoint, edge runtime).
- **`components/`** — UI building blocks: `Weather.jsx` (homepage layout and state), `SearchBar.jsx` (debounced city search with dropdown), `WeatherCard.jsx` (current conditions display), `FiveDayForecast.jsx`, `WeatherChat.jsx` (AI chat interface), `ForecastToolCard.jsx` (renders AI tool-call results inline in chat).
- **`lib/ai/`** — AI configuration: model setup, system prompt, and `voltcastTools` (the tool definitions the AI model can call, e.g. to fetch forecast data).
- **`services/`** — API integration layer (`weatherApi.js`) that calls Open-Meteo for live weather, air quality, and geocoding data.
- **`e2e/`** and component **`.test.jsx`** files — Playwright end-to-end tests and Vitest unit tests respectively.

## AI Integration

The AI chat feature (`app/api/chat/route.js`) uses the Vercel AI SDK's `streamText` function with a Groq-hosted model to power a conversational assistant. Rather than being a generic chatbot, it's given a defined set of tools (`voltcastTools`) that let it fetch live forecast data for a city and reason over it — so it can answer specific questions like "will it rain in Karachi tomorrow" using real data instead of a guess. Responses stream token-by-token to the UI.

The endpoint also includes deliberate, gated error-simulation paths (rate-limit, malformed response, mid-stream failure) used during development to verify the UI degrades gracefully under each failure mode. These are automatically disabled in production via a `NODE_ENV` check and cannot be triggered on the live site.

## Testing

```bash
npm run test              # run unit tests
npx vitest run --coverage # run with coverage report
```

Current coverage: 4 of 6 components tested (67%), 25 tests passing.

## Known Limitations & Future Improvements

- The AI chat relies on a single provider (Groq); there's no fallback to a second model if that provider is down.
- Chat history isn't persisted between page reloads or sessions.
- Client-side caching of recent city searches would reduce redundant API calls to Open-Meteo.

## License

MIT — see [LICENSE](LICENSE).