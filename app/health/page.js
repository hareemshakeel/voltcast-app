"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ────────────────────────────────────────────────────────────────
   Voltcast · Health — v4

   Two changes from v3:

   1. City search is now live. CITY_DATA below still ships five
      seeded cities (used instantly, no network call), but typing
      anything else queries Open-Meteo's free geocoding API, and
      picking a result pulls real AQI / UV / sunrise-sunset / pollen
      data from Open-Meteo's air-quality + forecast APIs (no key
      required — same provider your weather chatbot already uses).
      Fetched cities are cached in memory for the session so
      switching back to one doesn't re-fetch.

   2. Motion pass: panels now have a subtle hover-lift, the whole
      dashboard re-cascades in on city switch (remount via `key`),
      a loading spinner covers the gap while a live city is being
      fetched, and the UV number animates in the same way AQI does.

   Fonts (add once to app/globals.css):
     @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500&display=swap');
   ──────────────────────────────────────────────────────────────── */

// ---------- animation helper ----------
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function useAnimatedNumber(target, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    const timeout = setTimeout(() => {
      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setValue(target * easeOutCubic(p));
        if (p < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

// ---------- seeded city data ----------
const CITY_DATA = {
  islamabad: {
    name: "Islamabad", country: "Pakistan", live: false,
    aqi: 96, uv: 9, sunrise: 5.6, sunset: 19.1, nowIdx: 14,
    pollutants: [
      { name: "PM2.5", value: 34, unit: "µg/m³", pct: 68, note: "Fine particulate matter — the main driver of today's reading. Reaches deep into the lungs." },
      { name: "PM10", value: 58, unit: "µg/m³", pct: 48, note: "Coarse dust, common in Islamabad's drier spells." },
      { name: "O₃", value: 41, unit: "ppb", pct: 34, note: "Ground-level ozone, typically peaks mid-afternoon in strong sun." },
      { name: "NO₂", value: 18, unit: "ppb", pct: 22, note: "Traffic-related gas, highest near major roads at rush hour." },
    ],
    pollen: [
      { type: "Grass", level: "Moderate", pct: 55, color: "#FBBF24" },
      { type: "Tree", level: "Low", pct: 20, color: "#4ADE80" },
      { type: "Ragweed", level: "Low", pct: 15, color: "#4ADE80" },
    ],
    hourly: [58, 54, 51, 49, 47, 50, 58, 66, 74, 81, 88, 92, 95, 94, 96, 93, 89, 84, 78, 71, 66, 62, 59, 56],
  },
  lahore: {
    name: "Lahore", country: "Pakistan", live: false,
    aqi: 168, uv: 9, sunrise: 5.7, sunset: 19.2, nowIdx: 14,
    pollutants: [
      { name: "PM2.5", value: 89, unit: "µg/m³", pct: 92, note: "Heavy fine particulate load — the dominant factor today, well above the healthy threshold." },
      { name: "PM10", value: 121, unit: "µg/m³", pct: 80, note: "Elevated coarse dust, typical for the season." },
      { name: "O₃", value: 38, unit: "ppb", pct: 30, note: "Ground-level ozone, moderate today." },
      { name: "NO₂", value: 31, unit: "ppb", pct: 38, note: "Traffic emissions, elevated through the urban core." },
    ],
    pollen: [
      { type: "Grass", level: "High", pct: 78, color: "#FB923C" },
      { type: "Tree", level: "Moderate", pct: 45, color: "#FBBF24" },
      { type: "Ragweed", level: "Low", pct: 18, color: "#4ADE80" },
    ],
    hourly: [120, 112, 105, 100, 98, 104, 118, 132, 145, 156, 163, 168, 171, 169, 168, 162, 154, 145, 136, 128, 122, 118, 115, 112],
  },
  karachi: {
    name: "Karachi", country: "Pakistan", live: false,
    aqi: 110, uv: 10, sunrise: 6.1, sunset: 19.3, nowIdx: 14,
    pollutants: [
      { name: "PM2.5", value: 42, unit: "µg/m³", pct: 55, note: "Coastal humidity is keeping fine particulates from settling as much as inland cities." },
      { name: "PM10", value: 95, unit: "µg/m³", pct: 68, note: "Dominant pollutant today — coastal dust and construction activity." },
      { name: "O₃", value: 33, unit: "ppb", pct: 26, note: "Ground-level ozone, low-moderate." },
      { name: "NO₂", value: 24, unit: "ppb", pct: 30, note: "Port and traffic corridor emissions." },
    ],
    pollen: [
      { type: "Grass", level: "Low", pct: 22, color: "#4ADE80" },
      { type: "Tree", level: "Low", pct: 12, color: "#4ADE80" },
      { type: "Ragweed", level: "Low", pct: 10, color: "#4ADE80" },
    ],
    hourly: [80, 76, 72, 70, 71, 78, 88, 96, 102, 107, 110, 112, 113, 111, 110, 106, 101, 95, 90, 86, 83, 81, 79, 77],
  },
  dubai: {
    name: "Dubai", country: "UAE", live: false,
    aqi: 65, uv: 11, sunrise: 5.9, sunset: 19.0, nowIdx: 14,
    pollutants: [
      { name: "PM2.5", value: 22, unit: "µg/m³", pct: 40, note: "Mostly windblown fine dust today, not combustion-driven." },
      { name: "PM10", value: 71, unit: "µg/m³", pct: 58, note: "Dominant pollutant — desert dust carried in on afternoon wind." },
      { name: "O₃", value: 29, unit: "ppb", pct: 22, note: "Ground-level ozone, low." },
      { name: "NO₂", value: 15, unit: "ppb", pct: 18, note: "Light, mostly from highway corridors." },
    ],
    pollen: [
      { type: "Grass", level: "Low", pct: 10, color: "#4ADE80" },
      { type: "Tree", level: "Low", pct: 8, color: "#4ADE80" },
      { type: "Ragweed", level: "Low", pct: 5, color: "#4ADE80" },
    ],
    hourly: [40, 38, 36, 35, 36, 42, 50, 56, 60, 63, 65, 66, 67, 66, 65, 62, 58, 54, 50, 47, 44, 42, 41, 40],
  },
  london: {
    name: "London", country: "UK", live: false,
    aqi: 32, uv: 6, sunrise: 5.5, sunset: 20.4, nowIdx: 14,
    pollutants: [
      { name: "PM2.5", value: 9, unit: "µg/m³", pct: 18, note: "Low fine particulate levels today." },
      { name: "PM10", value: 14, unit: "µg/m³", pct: 14, note: "Low coarse dust." },
      { name: "O₃", value: 22, unit: "ppb", pct: 20, note: "Dominant pollutant, still well within a comfortable range." },
      { name: "NO₂", value: 12, unit: "ppb", pct: 16, note: "Light traffic emissions." },
    ],
    pollen: [
      { type: "Grass", level: "Moderate", pct: 48, color: "#FBBF24" },
      { type: "Tree", level: "Low", pct: 15, color: "#4ADE80" },
      { type: "Ragweed", level: "Low", pct: 8, color: "#4ADE80" },
    ],
    hourly: [20, 18, 17, 17, 18, 21, 25, 28, 30, 31, 32, 33, 33, 32, 32, 31, 29, 27, 25, 23, 22, 21, 20, 19],
  },
};

function getAQIInfo(aqi) {
  if (aqi <= 50) return { label: "Good", color: "#4ADE80", note: "Air quality is satisfactory — a good day to be outside." };
  if (aqi <= 100) return { label: "Moderate", color: "#FBBF24", note: "Acceptable overall, with some risk for unusually sensitive people." };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "#FB923C", note: "Sensitive groups may start to feel effects; most people are unaffected." };
  if (aqi <= 200) return { label: "Unhealthy", color: "#F87171", note: "Everyone may begin to notice effects today." };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#C084FC", note: "Health alert — serious risk for the whole population." };
  return { label: "Hazardous", color: "#7F1D1D", note: "Emergency conditions. Stay indoors where possible." };
}
function getUVInfo(uv) {
  if (uv <= 2) return { label: "Low", color: "#4ADE80" };
  if (uv <= 5) return { label: "Moderate", color: "#FBBF24" };
  if (uv <= 7) return { label: "High", color: "#FB923C" };
  if (uv <= 10) return { label: "Very High", color: "#F87171" };
  return { label: "Extreme", color: "#C084FC" };
}
function formatHour(h) {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${min.toString().padStart(2, "0")} ${period}`;
}

const guidance = [
  { group: "General public", tip: "No precautions needed for typical outdoor activity today.", icon: "M12 2a5 5 0 015 5v3a5 5 0 01-10 0V7a5 5 0 015-5zM5 21a7 7 0 0114 0" },
  { group: "Sensitive groups", tip: "Asthma, respiratory or heart conditions: keep a rescue inhaler on hand if you're out past midday.", icon: "M12 21s-7-4.35-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.65-9.5 9-9.5 9z" },
  { group: "Outdoor exercise", tip: "Best window is before 9 AM, before ozone and UV both climb.", icon: "M13 2L3 14h7l-1 8 11-12h-7l0-8z" },
  { group: "Kids & older adults", tip: "Fine for short outdoor stretches; cap continuous exposure near midday.", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" },
];

// ---------- live data: Open-Meteo (free, no API key) ----------

// Geocoding — turns a typed city name into candidate lat/lon matches.
async function geocodeCity(query) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
  );
  if (!res.ok) throw new Error("Geocoding request failed");
  const json = await res.json();
  return json.results || [];
}

// Rough 0-100 severity scale per pollutant so the bars in the pollutant
// grid stay visually consistent with the seeded demo cities. These are
// deliberately approximate — good enough for a bar's fill width, not a
// clinical reference.
function pctFor(name, value) {
  const ceilings = { "PM2.5": 150, PM10: 250, "O₃": 180, "NO₂": 100 };
  const ceiling = ceilings[name] || 100;
  return Math.max(4, Math.min(100, Math.round((value / ceiling) * 100)));
}
function noteFor(name, pct) {
  const intensity = pct > 70 ? "the dominant factor in today's reading" : pct > 35 ? "a moderate contributor today" : "low today, not a concern";
  const labels = {
    "PM2.5": `Fine particulate matter — ${intensity}.`,
    PM10: `Coarse dust and larger particles — ${intensity}.`,
    "O₃": `Ground-level ozone, typically peaks mid-afternoon in strong sun — ${intensity}.`,
    "NO₂": `Traffic-related gas, highest near major roads at rush hour — ${intensity}.`,
  };
  return labels[name] || "";
}
function pollenLevel(v) {
  if (v == null) return null;
  if (v < 10) return { level: "Low", color: "#4ADE80" };
  if (v < 30) return { level: "Moderate", color: "#FBBF24" };
  return { level: "High", color: "#FB923C" };
}

// Pulls AQI/pollutant/UV/pollen hourlies + today's sunrise-sunset for a
// coordinate, and shapes it into the same object CITY_DATA cities use.
async function fetchLiveCityData(result) {
  const { latitude, longitude, name, country, timezone } = result;

  const [airRes, forecastRes] = await Promise.all([
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,uv_index,grass_pollen,alder_pollen,birch_pollen,ragweed_pollen` +
        `&timezone=auto`
    ),
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset&timezone=auto`),
  ]);
  if (!airRes.ok || !forecastRes.ok) throw new Error("Live data request failed");
  const air = await airRes.json();
  const forecast = await forecastRes.json();

  const times = air.hourly.time;
  const nowIso = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
  let nowIdx = times.findIndex((t) => t.slice(0, 13) === nowIso);
  if (nowIdx === -1) nowIdx = Math.min(new Date().getHours(), times.length - 1);

  // 24-hour window starting at local midnight for that index's day
  const dayStart = nowIdx - (nowIdx % 24);
  const dayHourly = air.hourly.us_aqi.slice(dayStart, dayStart + 24).map((v) => Math.round(v ?? 0));
  const relIdx = nowIdx - dayStart;

  const aqi = Math.round(air.hourly.us_aqi[nowIdx] ?? dayHourly[relIdx] ?? 0);
  const uv = Math.round((air.hourly.uv_index[nowIdx] ?? 0) * 10) / 10;

  const raw = [
    { name: "PM2.5", value: air.hourly.pm2_5[nowIdx], unit: "µg/m³" },
    { name: "PM10", value: air.hourly.pm10[nowIdx], unit: "µg/m³" },
    { name: "O₃", value: air.hourly.ozone[nowIdx], unit: "µg/m³" },
    { name: "NO₂", value: air.hourly.nitrogen_dioxide[nowIdx], unit: "µg/m³" },
  ].filter((p) => p.value != null);
  const pollutants = raw.map((p) => {
    const value = Math.round(p.value);
    const pct = pctFor(p.name, value);
    return { name: p.name, value, unit: p.unit, pct, note: noteFor(p.name, pct) };
  });

  // Pollen coverage is Europe-only on Open-Meteo's free tier — many cities
  // will come back null. Show that honestly instead of faking a value.
  const pollenSources = [
    { type: "Grass", raw: air.hourly.grass_pollen?.[nowIdx] },
    { type: "Tree", raw: air.hourly.birch_pollen?.[nowIdx] ?? air.hourly.alder_pollen?.[nowIdx] },
    { type: "Ragweed", raw: air.hourly.ragweed_pollen?.[nowIdx] },
  ];
  const pollen = pollenSources
    .map((p) => {
      const parsed = pollenLevel(p.raw);
      if (!parsed) return null;
      return { type: p.type, level: parsed.level, pct: Math.min(100, Math.round((p.raw / 40) * 100)), color: parsed.color };
    })
    .filter(Boolean);

  const sunriseIso = forecast.daily.sunrise[0];
  const sunsetIso = forecast.daily.sunset[0];
  const toDecimalHour = (iso) => {
    const d = new Date(iso);
    return d.getHours() + d.getMinutes() / 60;
  };

  return {
    name,
    country,
    live: true,
    aqi,
    uv,
    sunrise: toDecimalHour(sunriseIso),
    sunset: toDecimalHour(sunsetIso),
    nowIdx: relIdx,
    pollutants: pollutants.length ? pollutants : null,
    pollen,
    hourly: dayHourly.length === 24 ? dayHourly : Array(24).fill(aqi),
  };
}

// ---------- shared bits ----------
function SectionLabel({ children }) {
  return <p className="font-[IBM_Plex_Mono] text-[11px] tracking-[0.18em] text-[#9A90B3] uppercase">{children}</p>;
}
function Panel({ className = "", style, children }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-[#131226] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-white/[0.1] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
function Spinner({ size = 14, color = "#F5C518" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-[voltcastSpin_0.7s_linear_infinite]">
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------- city switcher ----------
// The dropdown is rendered through a portal straight into document.body,
// positioned with `position: fixed` from the button's real screen
// coordinates (getBoundingClientRect) — see the top-of-file note on why.
// It now also does two more things: (1) falls back to a live Open-Meteo
// geocoding search when the typed query has no local match, and (2)
// fetches full air-quality/UV/pollen data for whichever live result gets
// picked, showing a small inline spinner while that fetch is in flight.
function CitySwitcher({ cityMap, cityId, onSelectCity, onAddLiveCity }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const [liveResults, setLiveResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolvingKey, setResolvingKey] = useState(null); // lat,lon of the result currently being fetched
  const [searchError, setSearchError] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const city = cityMap[cityId];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onClick(e) {
      const clickedButton = buttonRef.current && buttonRef.current.contains(e.target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedButton && !clickedDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const place = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const localResults = Object.entries(cityMap).filter(([, c]) =>
    `${c.name} ${c.country}`.toLowerCase().includes(query.toLowerCase())
  );

  // Debounced live search — only fires once the local (seeded + already
  // fetched) list comes up empty, so a search for "London" never hits
  // the network.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    setSearchError(false);
    if (query.trim().length < 2 || localResults.length > 0) {
      setLiveResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await geocodeCity(query.trim());
        setLiveResults(results);
      } catch {
        setSearchError(true);
        setLiveResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handlePickLive(result) {
    const key = `${result.latitude},${result.longitude}`;
    setResolvingKey(key);
    try {
      const cityData = await fetchLiveCityData(result);
      const id = `live-${key}`;
      onAddLiveCity(id, cityData);
      setOpen(false);
      setQuery("");
      setLiveResults([]);
    } catch {
      setSearchError(true);
    } finally {
      setResolvingKey(null);
    }
  }

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-2 pl-3.5 pr-3 text-sm text-[#F6F3FC] transition-colors hover:bg-white/[0.06]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="2">
          <path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.65-9.5 9-9.5 9z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
        {city.name}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A90B3" strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {mounted && open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[999] w-72 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-[#181731] shadow-2xl animate-[voltcastPopIn_0.16s_cubic-bezier(.16,1,.3,1)_both]"
          style={{ top: coords.top, right: coords.right }}
        >
          <div className="border-b border-white/10 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 focus-within:border-[#F5C518]/40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A90B3" strokeWidth="2" className="shrink-0">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any city…"
                className="w-full bg-transparent text-sm text-[#F6F3FC] outline-none placeholder:text-[#9A90B3]"
              />
              {searching && <Spinner size={13} />}
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {localResults.map(([id, c]) => (
              <button
                key={id}
                onClick={() => {
                  onSelectCity(id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  id === cityId ? "bg-[#F5C518]/10 text-[#F5C518]" : "text-[#F6F3FC] hover:bg-white/[0.06]"
                }`}
              >
                <span>{c.name}</span>
                <span className="text-xs text-[#9A90B3]">{c.country}</span>
              </button>
            ))}

            {localResults.length === 0 && !searching && liveResults.length === 0 && query.trim().length >= 2 && !searchError && (
              <p className="px-3 py-2 text-xs text-[#9A90B3]">No matches.</p>
            )}
            {searchError && <p className="px-3 py-2 text-xs text-[#F87171]">Couldn&apos;t reach live search — check your connection.</p>}

            {liveResults.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 font-[IBM_Plex_Mono] text-[10px] uppercase tracking-[0.14em] text-[#9A90B3]">Live search</p>
                {liveResults.map((r) => {
                  const key = `${r.latitude},${r.longitude}`;
                  const busy = resolvingKey === key;
                  return (
                    <button
                      key={key}
                      disabled={busy}
                      onClick={() => handlePickLive(r)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[#F6F3FC] transition-colors hover:bg-white/[0.06] disabled:opacity-60"
                    >
                      <span>
                        {r.name}
                        {r.admin1 ? `, ${r.admin1}` : ""}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[#9A90B3]">
                        {busy && <Spinner size={11} />}
                        {r.country}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ---------- AQI horizontal scale ----------
const AQI_SCALE_MAX = 300;
const AQI_BANDS = [
  { from: 0, to: 50, color: "#4ADE80" },
  { from: 50, to: 100, color: "#FBBF24" },
  { from: 100, to: 150, color: "#FB923C" },
  { from: 150, to: 200, color: "#F87171" },
  { from: 200, to: 300, color: "#C084FC" },
];

function AQIScale({ value, color }) {
  const animated = useAnimatedNumber(value, 1100, 200);
  const pct = Math.min(animated / AQI_SCALE_MAX, 1) * 100;

  return (
    <div>
      <div className="relative pt-6">
        <div className="absolute -top-0.5 flex -translate-x-1/2 flex-col items-center transition-none" style={{ left: `${pct}%` }}>
          <span className="font-[IBM_Plex_Mono] text-[10px] text-[#F6F3FC]">now</span>
          <svg width="10" height="7" viewBox="0 0 10 7" style={{ color }}>
            <path d="M5 7L0 0h10z" fill="currentColor" />
          </svg>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          {AQI_BANDS.map((b) => (
            <div key={b.from} className="h-full" style={{ width: `${((b.to - b.from) / AQI_SCALE_MAX) * 100}%`, backgroundColor: b.color, opacity: 0.85 }} />
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-[#9A90B3]">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200</span>
        <span>300+</span>
      </div>
    </div>
  );
}

// ---------- sun / UV arc ----------
function SunArc({ sunrise, sunset, nowIdx, color }) {
  const w = 420, h = 210, cx = w / 2, cy = 172, r = 138;
  const tNow = Math.max(0, Math.min((nowIdx - sunrise) / (sunset - sunrise), 1));

  const arcProgress = useAnimatedNumber(1, 1200, 250);
  const sunProgress = useAnimatedNumber(tNow, 1100, 550);

  const pt = (t) => {
    const angle = Math.PI * (1 - t);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };
  const sunPos = pt(sunProgress);
  const sunVisible = sunProgress > 0.005 ? 1 : 0;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[420px]">
      <defs>
        <linearGradient id="uvArcGradient" gradientUnits="userSpaceOnUse" x1={cx - r} x2={cx + r} y1={cy} y2={cy}>
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="22%" stopColor="#FBBF24" />
          <stop offset="42%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F87171" />
          <stop offset="58%" stopColor="#FB923C" />
          <stop offset="78%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
      </defs>
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="rgba(246,243,252,0.07)" strokeWidth="10" strokeLinecap="round" />
      <path
        d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke="url(#uvArcGradient)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${Math.PI * r}`}
        strokeDashoffset={`${Math.PI * r * (1 - arcProgress)}`}
      />
      <g opacity={sunVisible} style={{ transition: "opacity 0.3s ease" }}>
        <text x={sunPos.x} y={sunPos.y - 18} fontSize="10" fill="#F6F3FC" textAnchor="middle" fontFamily="IBM Plex Mono">
          now
        </text>
        <circle cx={sunPos.x} cy={sunPos.y} r="9" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color}aa)` }} />
        <circle cx={sunPos.x} cy={sunPos.y} r="3.5" fill="#0B0A1A" />
      </g>

      <text x={cx - r} y={cy + 22} fontSize="11" fill="#9A90B3" textAnchor="start" fontFamily="IBM Plex Mono">
        {formatHour(sunrise)}
      </text>
      <text x={cx + r} y={cy + 22} fontSize="11" fill="#9A90B3" textAnchor="end" fontFamily="IBM Plex Mono">
        {formatHour(sunset)}
      </text>
    </svg>
  );
}

// ---------- pollen ----------
function PollenBar({ type, level, pct, color, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-[#F6F3FC]">{type}</span>
        <span className="font-[IBM_Plex_Mono] text-xs" style={{ color }}>{level}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-[900ms] ease-out" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ---------- hourly sparkline ----------
function HourlyTrend({ data, nowIdx, color }) {
  const pathRef = useRef(null);
  const [drawn, setDrawn] = useState(false);
  const [pathLength, setPathLength] = useState(0);
  const w = 640, h = 72, pad = 6;
  const max = Math.max(...data), min = Math.min(...data);
  const stepX = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => ({ x: pad + i * stepX, y: h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;
  const clampedNowIdx = Math.max(0, Math.min(nowIdx, points.length - 1));
  const nowPt = points[clampedNowIdx];

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLength(len);
      const t = setTimeout(() => setDrawn(true), 300);
      return () => clearTimeout(t);
    }
  }, [data]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendFill)" opacity={drawn ? 1 : 0} style={{ transition: "opacity 0.8s ease 0.5s" }} />
      <path ref={pathRef} d={linePath} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: pathLength, strokeDashoffset: drawn ? 0 : pathLength, transition: "stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)" }} />
      <line x1={nowPt.x} y1={0} x2={nowPt.x} y2={h} stroke="rgba(246,243,252,0.12)" strokeDasharray="2 3" />
      <circle cx={nowPt.x} cy={nowPt.y} r={drawn ? 3.5 : 0} fill="#0B0A1A" stroke={color} strokeWidth="2" style={{ transition: "r 0.3s ease 1.1s" }} />
    </svg>
  );
}

// ---------- page ----------
export default function HealthPage() {
  const [cityId, setCityId] = useState("islamabad");
  const [customCities, setCustomCities] = useState({});
  const [activePollutant, setActivePollutant] = useState(0);

  const cityMap = { ...CITY_DATA, ...customCities };
  const data = cityMap[cityId];
  const aqiInfo = getAQIInfo(data.aqi);
  const uvInfo = getUVInfo(data.uv);
  const animatedUv = useAnimatedNumber(data.uv, 900, 300);
  const hazeOpacity = Math.min(0.5, Math.max(0.05, data.aqi / 280));
  const pollutants = data.pollutants;
  const hasPollen = data.pollen && data.pollen.length > 0;

  useEffect(() => setActivePollutant(0), [cityId]);

  function handleAddLiveCity(id, cityData) {
    setCustomCities((prev) => ({ ...prev, [id]: cityData }));
    setCityId(id);
  }

  return (
    <div className="min-h-screen bg-[#0B0A1A] px-5 pb-24 pt-10 sm:px-8 lg:px-12">
      <style>{`
        @keyframes voltcastFadeUp { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:none;} }
        .vc-in { animation: voltcastFadeUp 0.6s cubic-bezier(.16,1,.3,1) both; }
        @keyframes voltcastDot { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        .vc-live { animation: voltcastDot 2s ease-in-out infinite; }
        @keyframes voltcastPopIn { from { opacity:0; transform:scale(0.96) translateY(-4px);} to { opacity:1; transform:none;} }
        @keyframes voltcastSpin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .vc-in, .vc-live { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* header — stays put across city switches so the switcher itself never remounts */}
        <div className="vc-in mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Health</SectionLabel>
            <h1 className="mt-1 font-[Space_Grotesk] text-3xl font-semibold text-[#F6F3FC] sm:text-4xl">
              Today&apos;s air, sun &amp; pollen
            </h1>
            <p className="mt-1.5 flex items-center gap-2 font-[IBM_Plex_Mono] text-xs text-[#9A90B3]">
              <span className="vc-live h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
              {data.live ? "Live · Open-Meteo" : "Updated 14 min ago"}
            </p>
          </div>
          <CitySwitcher cityMap={cityMap} cityId={cityId} onSelectCity={setCityId} onAddLiveCity={handleAddLiveCity} />
        </div>

        {/* everything below re-mounts (and re-plays its entrance animation) on every city change */}
        <div key={cityId}>
          {/* at-a-glance strip */}
          <div className="vc-in mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" style={{ animationDelay: "60ms" }}>
            {[
              { label: "Air quality", value: aqiInfo.label, color: aqiInfo.color },
              { label: "UV index", value: uvInfo.label, color: uvInfo.color },
              { label: "Pollen", value: hasPollen ? `${data.pollen[0].level} (${data.pollen[0].type.toLowerCase()})` : "No data here", color: hasPollen ? data.pollen[0].color : "#9A90B3" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#131226] px-4 py-3 transition-colors duration-300 hover:border-white/[0.12]">
                <span className="text-xs text-[#9A90B3]">{s.label}</span>
                <span className="text-sm font-medium" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Air quality panel */}
          <Panel className="vc-in relative mb-6 overflow-hidden p-6" style={{ animationDelay: "120ms" }}>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: hazeOpacity }}>
              <filter id="haze">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
                <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#haze)" />
            </svg>

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <SectionLabel>Air Quality</SectionLabel>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-[IBM_Plex_Mono] text-5xl font-semibold text-[#F6F3FC]">{data.aqi}</span>
                  <span className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ color: aqiInfo.color, backgroundColor: `${aqiInfo.color}1A`, borderColor: `${aqiInfo.color}33` }}>
                    {aqiInfo.label}
                  </span>
                </div>
                <p className="mt-2 max-w-md text-sm text-[#9A90B3]">{aqiInfo.note}</p>
              </div>
              <div className="w-full sm:max-w-xs">
                <AQIScale value={data.aqi} color={aqiInfo.color} />
              </div>
            </div>

            {pollutants ? (
              <>
                <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {pollutants.map((p, i) => (
                    <button
                      key={p.name}
                      onClick={() => setActivePollutant(i)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 ${
                        activePollutant === i ? "border-[#F5C518]/40 bg-white/[0.05]" : "border-transparent bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <p className="font-[IBM_Plex_Mono] text-sm font-semibold text-[#F6F3FC]">{p.value}</p>
                      <p className="text-[11px] text-[#9A90B3]">{p.name} · {p.unit}</p>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-[#F5C518] transition-all duration-700 ease-out" style={{ width: `${p.pct}%`, opacity: activePollutant === i ? 1 : 0.5 }} />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="relative mt-3 text-xs text-[#9A90B3]">{pollutants[activePollutant]?.note}</p>
              </>
            ) : (
              <p className="relative mt-6 text-xs text-[#9A90B3]">Pollutant breakdown isn&apos;t available for this location yet.</p>
            )}

            <div className="relative mt-6 border-t border-white/[0.06] pt-5">
              <SectionLabel>Through today</SectionLabel>
              <div className="mt-3"><HourlyTrend data={data.hourly} nowIdx={data.nowIdx} color={aqiInfo.color} /></div>
            </div>
          </Panel>

          {/* UV + Pollen */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Panel className="vc-in p-6" style={{ animationDelay: "180ms" }}>
              <div className="flex items-start justify-between">
                <div>
                  <SectionLabel>UV Exposure</SectionLabel>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-[IBM_Plex_Mono] text-4xl font-semibold text-[#F6F3FC]">{animatedUv.toFixed(1).replace(/\.0$/, "")}</span>
                    <span className="text-sm font-medium" style={{ color: uvInfo.color }}>{uvInfo.label}</span>
                  </div>
                </div>
                <p className="max-w-[9rem] text-right text-xs text-[#9A90B3]">
                  SPF 30+ and shade recommended through midday.
                </p>
              </div>
              <div className="mt-3 flex justify-center">
                <SunArc sunrise={data.sunrise} sunset={data.sunset} nowIdx={data.nowIdx} color={uvInfo.color} />
              </div>
            </Panel>

            <Panel className="vc-in p-6" style={{ animationDelay: "220ms" }}>
              <SectionLabel>Pollen &amp; Allergy</SectionLabel>
              {hasPollen ? (
                <>
                  <div className="mt-4 space-y-4">
                    {data.pollen.map((p, i) => <PollenBar key={p.type} {...p} delay={300 + i * 110} />)}
                  </div>
                  <p className="mt-5 text-xs text-[#9A90B3]">
                    {data.pollen[0].type} is the season&apos;s main driver right now — antihistamines help most taken
                    in the early morning, before counts build through the day.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-xs text-[#9A90B3]">
                  Pollen tracking currently covers Europe only on this data source — no reading is available for {data.name} yet.
                </p>
              )}
            </Panel>
          </div>

          {/* guidance */}
          <div className="vc-in" style={{ animationDelay: "280ms" }}>
            <SectionLabel>Guidance for you</SectionLabel>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {guidance.map((g) => (
                <div key={g.group} className="rounded-xl border-l-2 border-[#F5C518]/50 bg-white/[0.02] px-4 py-3.5 transition-colors duration-300 hover:bg-white/[0.04]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="1.6">
                    <path d={g.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2.5 font-[Space_Grotesk] text-sm font-medium text-[#F6F3FC]">{g.group}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#9A90B3]">{g.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}