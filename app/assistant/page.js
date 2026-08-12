import WeatherChat from '@/components/WeatherChat';

export default function AssistantPage() {
  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-[#1a0b2e] to-[#10061f] flex flex-col items-center px-6 py-16 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-20 right-1/3 w-[250px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center w-full">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-amber-400/80 uppercase mb-4">
          <span className="animate-pulse">⚡</span> Weather Assistant
        </span>

        <h1 className="text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
          Ask Voltcast
        </h1>

        <div className="flex items-center gap-3 mb-10">
          <span className="h-px w-8 bg-amber-500/40" />
          <p className="text-gray-400 text-lg">
            Real-time forecasts, straight from the source.
          </p>
          <span className="h-px w-8 bg-amber-500/40" />
        </div>

        <WeatherChat />
      </div>
    </div>
  );
}