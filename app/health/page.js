async function getHealthData() {
  const res = await fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=33.6844&longitude=73.0479&current_weather=true',
    { cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error('Weather API request failed');
  }
  return res.json();
}

export default async function HealthPage() {
  let data;
  let error = null;

  try {
    data = await getHealthData();
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] to-[#10061f] flex flex-col items-center px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-white mb-3">Health Check</h1>
      <p className="text-gray-400 mb-10">Live status of the weather API connection</p>

      {error ? (
        <div className="max-w-md w-full bg-red-950/40 border border-red-400/30 rounded-3xl p-8">
          <p className="text-red-400 font-medium">API check failed: {error}</p>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-amber-400/20 rounded-3xl p-8 shadow-lg shadow-black/30">
          <p className="text-green-400 font-medium mb-6 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            API is reachable
          </p>
          <pre className="bg-black/30 rounded-2xl p-6 text-left text-sm text-gray-200 overflow-x-auto">
            {JSON.stringify(data.current_weather, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}