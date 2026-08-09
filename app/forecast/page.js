"use client";

import { useEffect, useState } from "react";
import SearchBar from "../../components/SearchBar";
import FiveDayForecast from "../../components/FiveDayForecast";
import { getForecast } from "../../services/weatherApi";

const DEFAULT_CITY = {
  name: "Rawalpindi",
  admin1: "Punjab",
  country: "Pakistan",
  latitude: 33.6007,
  longitude: 73.0679,
};

function ForecastSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8 sm:px-10 lg:px-14 xl:px-20">
      <div className="mb-6 flex gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="vc-skeleton h-[92px] w-[76px] flex-none rounded-2xl border border-white/[0.09] bg-white/[0.045]"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="vc-skeleton h-[220px] rounded-3xl border border-white/[0.09] bg-white/[0.045]" />
        <div className="grid grid-cols-2 gap-3 content-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="vc-skeleton h-[84px] rounded-[18px] border border-white/[0.09] bg-white/[0.045]"
              style={{ animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes vc-skeleton-kf {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .vc-skeleton { animation: vc-skeleton-kf 1.3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function ForecastPage() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [days, setDays] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerMounted, setHeaderMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeaderMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadForecast() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getForecast(city.latitude, city.longitude);
        if (!ignore) setDays(result);
      } catch (err) {
        if (!ignore) setError("Couldn't load the forecast. Please try again.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadForecast();
    return () => {
      ignore = true;
    };
  }, [city]);

  return (
    <div className="min-h-screen bg-[#0E0817]">
      <div
        className={`relative z-30 border-b border-white/[0.06] bg-[#0E0817]/80 backdrop-blur-sm transition-all duration-700 ease-out ${
          headerMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-4 sm:px-10 lg:px-14 xl:px-20">
          <SearchBar onSelectCity={setCity} />
        </div>
      </div>

      {error && (
        <p className="vc-fade-in mx-auto max-w-[1440px] px-6 pt-4 text-sm text-red-400 sm:px-10 lg:px-14 xl:px-20">
          {error}
        </p>
      )}

      <div className="vc-fade-in" key={isLoading ? "loading" : city.id ?? city.name}>
        {isLoading || !days ? <ForecastSkeleton /> : <FiveDayForecast days={days} />}
      </div>

      <style jsx global>{`
        @keyframes vc-fade-in-kf {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .vc-fade-in { animation: vc-fade-in-kf 0.35s ease-out both; }
      `}</style>
    </div>
  );
}