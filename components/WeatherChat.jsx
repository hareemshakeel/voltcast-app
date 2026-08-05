"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";

export default function WeatherChat() {
  const { messages, sendMessage, status, stop, error } = useChat({
    onError: (err) => {
      console.error('Chat error:', err);
    },
  });
  const [input, setInput] = useState("");

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

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px] w-full max-w-md mx-auto rounded-3xl border border-amber-400/20 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg shadow-black/30">
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-400/10 bg-black/10">
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
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 relative"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-amber-500 text-black rounded-br-sm"
                  : "bg-white/10 text-white rounded-bl-sm"
              }`}
            >
              {m.parts?.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-red-300">
              Something went wrong generating a response. This may be a temporary rate limit — please try again in a moment.
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
        className="flex items-center gap-2 border-t border-amber-400/10 p-3"
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