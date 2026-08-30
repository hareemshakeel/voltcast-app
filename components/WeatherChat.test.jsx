import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI SDK hook entirely — the component never touches the network
// in these tests, and we never call the real API.
vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(),
}));

import { useChat } from "@ai-sdk/react";
import WeatherChat from "@/components/WeatherChat";

const mockSendMessage = vi.fn();
const mockStop = vi.fn();
const mockRegenerate = vi.fn();

function setupChat(overrides = {}) {
  useChat.mockReturnValue({
    messages: [],
    sendMessage: mockSendMessage,
    status: "ready",
    stop: mockStop,
    error: undefined,
    regenerate: mockRegenerate,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WeatherChat", () => {
  it("shows example prompts when there are no messages yet", () => {
    setupChat();
    render(<WeatherChat />);
    expect(
      screen.getByText(/what's the forecast for tomorrow/i)
    ).toBeInTheDocument();
  });

  it("lets the user type and submit a message", async () => {
    setupChat();
    render(<WeatherChat />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/ask about the forecast/i);
    await user.type(input, "Will it rain today?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(mockSendMessage).toHaveBeenCalledWith({
      text: "Will it rain today?",
    });
  });

  it("disables the send button when the input is empty", () => {
    setupChat();
    render(<WeatherChat />);
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("renders user and assistant text messages", () => {
    setupChat({
      messages: [
        { id: "1", role: "user", parts: [{ type: "text", text: "Hi there" }] },
        {
          id: "2",
          role: "assistant",
          parts: [{ type: "text", text: "Hello! How can I help?" }],
        },
      ],
    });
    render(<WeatherChat />);
    expect(screen.getByText("Hi there")).toBeInTheDocument();
    expect(screen.getByText("Hello! How can I help?")).toBeInTheDocument();
  });

  it("shows a pending state (Stop button, no reply yet) while submitted", () => {
    setupChat({ status: "submitted" });
    render(<WeatherChat />);
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("disables the input and shows Stop while streaming", () => {
    setupChat({ status: "streaming" });
    render(<WeatherChat />);
    expect(
      screen.getByPlaceholderText(/ask about the forecast/i)
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("calls stop() when Stop is clicked mid-stream", async () => {
    setupChat({ status: "streaming" });
    render(<WeatherChat />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /stop/i }));
    expect(mockStop).toHaveBeenCalled();
  });

  it("shows an error state with a retry action", async () => {
    setupChat({ error: new Error("boom") });
    render(<WeatherChat />);

    expect(
      screen.getByText(/something went wrong generating a response/i)
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry last message/i }));
    expect(mockRegenerate).toHaveBeenCalled();
  });

  it("renders a tool-getForecast part via ForecastToolCard", () => {
    setupChat({
      messages: [
        {
          id: "1",
          role: "assistant",
          parts: [
            {
              type: "tool-getForecast",
              state: "output-available",
              output: {
                location: { name: "Lahore", country: "Pakistan" },
                current: {
                  tempMax: 37,
                  feelsLike: 39,
                  humidity: 20,
                  windSpeed: 10,
                },
                days: [],
              },
            },
          ],
        },
      ],
    });
    render(<WeatherChat />);
    expect(screen.getByText("Lahore, Pakistan")).toBeInTheDocument();
  });
});
