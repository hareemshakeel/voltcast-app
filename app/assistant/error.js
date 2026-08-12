'use client';

import { useEffect } from 'react';

export default function AssistantError({ error, reset }) {
  useEffect(() => {
    console.error('Assistant route error:', error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#1a0b2e] to-[#10061f] flex flex-col items-center justify-center px-6 text-center gap-4">
      <span className="text-4xl">⚡</span>
      <h1 className="text-xl font-semibold text-white">
        The assistant hit a snag
      </h1>
      <p className="text-sm text-gray-400 max-w-xs">
        Something went wrong loading the chat. This is on our end, not yours.
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-amber-500 text-black px-5 py-2 text-sm font-medium hover:bg-amber-400 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}