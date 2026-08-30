# Capturing the chat fixture

The e2e test intercepts the browser's request to `/api/chat` and replays a
real, previously-captured response instead of hitting Groq. This keeps CI
runs free, fast, and deterministic.

Capture it **once**, with your dev server running locally (`npm run dev`):

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"Say a short one-sentence hello."}]}]}' \
  > e2e/fixtures/chat-response.txt
```

Open `e2e/fixtures/chat-response.txt` afterward and note a short, distinctive
phrase from the reply — put that phrase into the assertion in
`e2e/chat.spec.js` (marked with a comment) so the test checks real content,
not just "something rendered."

Commit `chat-response.txt` to the repo — it's just fixture data, not a
secret, and lets CI run without any API key.
