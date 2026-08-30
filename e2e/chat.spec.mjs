import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "chat-response.txt");

test("user can ask the assistant a question and see a reply", async ({
  page,
}) => {
  const fixtureBody = fs.readFileSync(fixturePath, "utf-8");

  // Intercept before it ever reaches your server route — the real Groq API
  // is never called during this test.
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: fixtureBody,
    });
  });

  await page.goto("/assistant");

  const input = page.getByPlaceholder("Ask about the forecast…");
  await input.fill("Is it a good day for a run?");
  await page.getByRole("button", { name: "Send" }).click();

  // The user's own message should render immediately.
  await expect(
    page.getByText("Is it a good day for a run?")
  ).toBeVisible();

  // Real reply captured from the assistant, via e2e/fixtures/README.md.
  await expect(
    page.getByText(/how can i help you with the weather today/i)
  ).toBeVisible({ timeout: 10_000 });
});