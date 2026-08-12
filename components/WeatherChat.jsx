"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import ForecastToolCard from "./ForecastToolCard";

const EXAMPLE_PROMPTS = [
  "What's the forecast for tomorrow?",
  "Is it a good day for a run?",
  "How's the air quality right now?",
];

export default function WeatherChat() {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });
  const [input, setInput] = useState("");
  const [retrying, setRetrying] = useState(false);

  const scrollRef = useRef(null);
  const [pinnedToBottom, setPinnedToBottom] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setPinnedToBottom(distanceFromBottom < 40);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pinnedToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pinnedToBottom]);

  useEffect(() => {
    if (status !== "streaming" && status !== "submitted") {
      setRetrying(false);
    }
  }, [status]);

  const jumpToLatest = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setPinnedToBottom(true);
    }
  };

  const isStreaming = status === "streaming" || status === "submitted";

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const onRetry = () => {
    if (retrying || isStreaming) return;
    setRetrying(true);
    regenerate();
  };

  const fillExample = (text) => {
    setInput(text);
  };

  const isEmpty = messages.length === 0 && !error;

  return (
    <div className="flex flex-col h-[70dvh] max-h-[600px] w-full max-w-md mx-auto rounded-3xl border border-amber-400/20 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg shadow-black/30">
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-400/10 bg-black/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">
            Assistant online
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">Voltcast</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 relative"
      >
        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
            <p className="text-white/50 text-sm">
              Ask me anything about the forecast, air quality, or planning
              your day around the weather.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => fillExample(prompt)}
                  className="text-left text-xs text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 rounded-xl px-3 py-2 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="space-y-2">
            {m.parts?.map((part, i) => {
              if (part.type === "tool-getForecast") {
                return (
                  <div key={i} className="flex justify-start">
                    <ForecastToolCard part={part} />
                  </div>
                );
              }

              if (part.type !== "text") return null;

              return (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-amber-500 text-black rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm"
                    }`}
                  >
                    {part.text}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-red-500/10 border border-red-500/30 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-red-300 space-y-2">
              <p>
                Something went wrong generating a response. This may be a
                temporary rate limit — please try again.
              </p>
              <button
                onClick={onRetry}
                disabled={retrying || isStreaming}
                className="text-xs font-medium bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 rounded-full px-3 py-1.5 transition-colors"
              >
                {retrying ? "Retrying…" : "Retry last message"}
              </button>
            </div>
          </div>
        )}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300/60 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {!pinnedToBottom && (
          <button
            onClick={jumpToLatest}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/60 text-white px-3 py-1 rounded-full"
          >
            ↓ Jump to latest
          </button>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-amber-400/10 p-3 shrink-0"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the forecast…"
          disabled={isStreaming}
          className="flex-1 min-w-0 rounded-full bg-white/10 text-white placeholder-white/40 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={stop}
            className="shrink-0 rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 rounded-full bg-amber-500 text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}