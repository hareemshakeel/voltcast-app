export default function ForecastPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] to-[#10061f] flex flex-col items-center px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-white mb-3">5-Day Forecast</h1>
      <p className="text-gray-400 mb-10">Extended outlook, coming soon</p>
      <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-amber-400/20 rounded-3xl p-10 shadow-lg shadow-black/30">
        <p className="text-6xl mb-4">🌤️</p>
        <p className="text-gray-200 text-lg">Multi-day forecast view is on the way.</p>
      </div>
    </div>
  );
}