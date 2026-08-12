"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function ForecastToolCard({ part }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {part.state === "input-streaming" && (
        <motion.div
          key="input-streaming"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-sm text-white/70"
        >
          Reading the request…
          <div className="mt-1 truncate text-xs text-white/40">
            {part.input?.location ? `"${part.input.location}"` : "waiting for a location…"}
          </div>
        </motion.div>
      )}

      {part.state === "input-available" && (
        <motion.div
          key="input-available"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-bl-sm border border-amber-400/20 bg-white/10 px-4 py-3 text-sm text-white"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          Fetching forecast for <span className="font-medium">{part.input.location}</span>…
        </motion.div>
      )}

      {part.state === "output-available" && (
        <motion.div
          key="output-available"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[85%] rounded-2xl rounded-bl-sm border border-amber-400/20 bg-white/10 backdrop-blur-md p-4 text-white"
        >
          <ForecastBody data={part.output} />
        </motion.div>
      )}

      {part.state === "output-error" && (
        <motion.div
          key="output-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-[80%] rounded-2xl rounded-bl-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <div className="font-medium">Couldn't get that forecast</div>
          <div className="mt-1 text-xs text-red-300/80">{part.errorText}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ForecastBody({ data }) {
  const { current, location, days, alternates } = data;

  return (
    <div>
      <p className="text-xs text-white/50">
        {location.name}
        {location.country ? `, ${location.country}` : ""}
      </p>
      <p className="mt-1 text-3xl font-semibold">
        {current.tempMax}
        <span className="text-amber-400">°</span>
      </p>
      <p className="text-xs text-white/40">Feels like {current.feelsLike}°</p>

      <div className="mt-3 flex gap-4 text-xs text-white/70">
        <span>💧 {current.humidity}%</span>
        <span>💨 {current.windSpeed} km/h</span>
        {current.uvIndex != null && <span>☀️ UV {current.uvIndex}</span>}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1 border-t border-white/10 pt-3">
        {days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-0.5 text-[11px]">
            <span className="text-white/50">{day.label}</span>
            <span className="font-medium">{day.tempMax}°</span>
            <span className="text-white/40">{day.tempMin}°</span>
            <span className="text-amber-400/80">{day.precipitation}%</span>
          </div>
        ))}
      </div>

      {alternates?.length > 0 && (
        <p className="mt-3 text-[11px] text-white/40">
          Also matched: {alternates.map((a) => `${a.name}, ${a.country}`).join(" · ")}
        </p>
      )}
    </div>
  );
}