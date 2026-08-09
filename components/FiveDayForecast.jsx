"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Sun, CloudSun, CloudRain, Cloud, Zap, Wind, Droplets,
  Sunrise, Sunset, ThermometerSun,
} from "lucide-react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const ICONS = { sunny: Sun, "partly-cloudy": CloudSun, cloudy: Cloud, rain: CloudRain };

const SAMPLE_DAYS = [
  { label: "Today", date: "Aug 9", condition: "partly-cloudy", tempMax: 34, tempMin: 24, feelsLike: 36, uvIndex: 7, precipitation: 10, windSpeed: 14, humidity: 48, sunrise: "5:52 AM", sunset: "7:08 PM", cloudCover: 40,
    hourly: [{ time: "9AM", temp: 27, condition: "sunny" }, { time: "12PM", temp: 32, condition: "sunny" }, { time: "3PM", temp: 34, condition: "partly-cloudy" }, { time: "6PM", temp: 30, condition: "partly-cloudy" }, { time: "9PM", temp: 26, condition: "cloudy" }] },
  { label: "Mon", date: "Aug 10", condition: "sunny", tempMax: 36, tempMin: 25, feelsLike: 38, uvIndex: 9, precipitation: 0, windSpeed: 9, humidity: 35, sunrise: "5:53 AM", sunset: "7:07 PM", cloudCover: 10,
    hourly: [{ time: "9AM", temp: 28, condition: "sunny" }, { time: "12PM", temp: 34, condition: "sunny" }, { time: "3PM", temp: 36, condition: "sunny" }, { time: "6PM", temp: 32, condition: "sunny" }, { time: "9PM", temp: 27, condition: "sunny" }] },
  { label: "Tue", date: "Aug 11", condition: "rain", tempMax: 29, tempMin: 22, feelsLike: 30, uvIndex: 3, precipitation: 68, windSpeed: 22, humidity: 82, sunrise: "5:54 AM", sunset: "7:05 PM", cloudCover: 90,
    hourly: [{ time: "9AM", temp: 24, condition: "rain" }, { time: "12PM", temp: 27, condition: "rain" }, { time: "3PM", temp: 29, condition: "rain" }, { time: "6PM", temp: 25, condition: "cloudy" }, { time: "9PM", temp: 22, condition: "cloudy" }] },
  { label: "Wed", date: "Aug 12", condition: "cloudy", tempMax: 30, tempMin: 23, feelsLike: 31, uvIndex: 5, precipitation: 20, windSpeed: 17, humidity: 60, sunrise: "5:55 AM", sunset: "7:04 PM", cloudCover: 70,
    hourly: [{ time: "9AM", temp: 25, condition: "cloudy" }, { time: "12PM", temp: 28, condition: "partly-cloudy" }, { time: "3PM", temp: 30, condition: "partly-cloudy" }, { time: "6PM", temp: 27, condition: "cloudy" }, { time: "9PM", temp: 24, condition: "cloudy" }] },
  { label: "Thu", date: "Aug 13", condition: "sunny", tempMax: 33, tempMin: 24, feelsLike: 34, uvIndex: 8, precipitation: 5, windSpeed: 11, humidity: 42, sunrise: "5:56 AM", sunset: "7:02 PM", cloudCover: 15,
    hourly: [{ time: "9AM", temp: 26, condition: "sunny" }, { time: "12PM", temp: 31, condition: "sunny" }, { time: "3PM", temp: 33, condition: "sunny" }, { time: "6PM", temp: 29, condition: "partly-cloudy" }, { time: "9PM", temp: 25, condition: "sunny" }] },
];

function computePowerIndex(day) {
  const solar = Math.max(0, Math.min(100, (day.uvIndex / 11) * 60 + (100 - day.cloudCover) * 0.4));
  const wind = Math.max(0, Math.min(100, (day.windSpeed / 30) * 100));
  return Math.round(solar * 0.65 + wind * 0.35);
}
function powerLabel(score) { if (score >= 70) return "High"; if (score >= 40) return "Moderate"; return "Low"; }
function ConditionIcon({ condition, size = 22, className = "" }) {
  const Icon = ICONS[condition] || Cloud;
  return <Icon size={size} strokeWidth={1.75} className={className} />;
}

function Particles() {
  const particles = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({
      id: i, left: Math.round(Math.random() * 100), size: 2 + Math.random() * 2.5,
      duration: 8 + Math.random() * 12, delay: -Math.random() * 20, drift: (Math.random() - 0.5) * 60,
    })), []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span key={p.id} className="vc-spark absolute rounded-full bg-[#FFB627]/70 shadow-[0_0_6px_1px_rgba(255,182,39,0.5)]"
          style={{ left: `${p.left}%`, bottom: "-10px", width: p.size, height: p.size,
            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, "--drift": `${p.drift}px` }} />
      ))}
    </div>
  );
}

function RainBurst({ triggerKey }) {
  const drops = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      height: 16 + Math.random() * 22,
      duration: 0.55 + Math.random() * 0.45,
      delay: Math.random() * 0.7,
      opacity: 0.3 + Math.random() * 0.45,
    })),
    [triggerKey]
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <div className="vc-rain-flash absolute inset-0 bg-gradient-to-b from-[#3A5A8C]/25 via-transparent to-transparent" />
      {drops.map((d) => (
        <span
          key={d.id}
          className="vc-rain-drop absolute top-[-60px] w-[2px] rounded-full bg-gradient-to-b from-[#8FB8FF]/0 via-[#9CC4FF] to-[#8FB8FF]/0"
          style={{
            left: `${d.left}%`,
            height: d.height,
            opacity: d.opacity,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function SunBurst({ triggerKey }) {
  const orbs = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      id: i,
      size: 30 + Math.random() * 60,
      left: 15 + Math.random() * 70,
      duration: 1.6 + Math.random() * 0.9,
      delay: Math.random() * 0.5,
    })),
    [triggerKey]
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <div className="vc-sun-wash absolute inset-0 bg-gradient-to-b from-[#FFB627]/18 via-[#FFB627]/4 to-transparent" />

      <div
        className="vc-sun-rays absolute left-1/2 top-[-260px] h-[820px] w-[820px] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(255,217,125,0.45) 0deg, transparent 14deg, transparent 26deg, rgba(255,217,125,0.4) 40deg, transparent 54deg, transparent 66deg, rgba(255,217,125,0.45) 80deg, transparent 94deg, transparent 106deg, rgba(255,217,125,0.4) 120deg, transparent 134deg, transparent 146deg, rgba(255,217,125,0.45) 160deg, transparent 174deg, transparent 186deg, rgba(255,217,125,0.4) 200deg, transparent 214deg, transparent 226deg, rgba(255,217,125,0.45) 240deg, transparent 254deg, transparent 266deg, rgba(255,217,125,0.4) 280deg, transparent 294deg, transparent 306deg, rgba(255,217,125,0.45) 320deg, transparent 334deg, transparent 346deg, rgba(255,217,125,0.4) 360deg)",
          filter: "blur(18px)",
        }}
      />

      <div
        className="vc-sun-glow absolute left-1/2 top-[-220px] h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,236,190,0.95) 0%, rgba(255,217,125,0.55) 30%, rgba(255,182,39,0.18) 55%, transparent 72%)",
        }}
      />

      {orbs.map((o) => (
        <span
          key={o.id}
          className="vc-sun-orb absolute rounded-full"
          style={{
            left: `${o.left}%`,
            bottom: "-60px",
            width: o.size,
            height: o.size,
            background: "radial-gradient(circle, rgba(255,225,160,0.5) 0%, rgba(255,182,39,0.14) 60%, transparent 75%)",
            animationDuration: `${o.duration}s`,
            animationDelay: `${o.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function PowerDial({ score }) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = -120 + (clamped / 100) * 240;
  const ticks = Array.from({ length: 9 }, (_, i) => -120 + (i / 8) * 240);
  const [displayAngle, setDisplayAngle] = useState(-120);
  useEffect(() => { const t = requestAnimationFrame(() => setDisplayAngle(angle)); return () => cancelAnimationFrame(t); }, [angle]);

  return (
    <div className="group flex flex-col items-center gap-2 transition-transform duration-500 hover:scale-[1.03]">
      <svg width="188" height="144" viewBox="0 0 168 128">
        <path d="M 20 108 A 64 64 0 1 1 148 108" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
        <path d="M 20 108 A 64 64 0 1 1 148 108" fill="none" stroke="#FFB627" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * 302} 302`} className="opacity-40 transition-[stroke-dasharray] duration-[1200ms] ease-out" />
        {ticks.map((deg, i) => {
          const rad = (deg * Math.PI) / 180; const cx = 84, cy = 84, r1 = 50, r2 = 58;
          const x1 = cx + r1 * Math.sin(rad), y1 = cy - r1 * Math.cos(rad);
          const x2 = cx + r2 * Math.sin(rad), y2 = cy - r2 * Math.cos(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />;
        })}
        <g className="transition-transform duration-[1200ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ transform: `rotate(${displayAngle}deg)`, transformOrigin: "84px 84px" }}>
          <line x1="84" y1="84" x2="84" y2="34" stroke="#FFB627" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="84" cy="84" r="5" fill="#FFB627" className="vc-dial-pulse" />
      </svg>
      <div className="-mt-3 text-center">
        <div className="font-mono text-[26px] leading-none text-[#F6F3FC] tabular-nums">{clamped}</div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-[#C98F1D]">{powerLabel(clamped)} power day</div>
      </div>
    </div>
  );
}

function useCountUp(target, duration = 500) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current, to = target, start = performance.now();
    let raf;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function MetricCard({ icon: Icon, label, value, sub, delay }) {
  return (
    <div className="vc-rise group min-w-0 rounded-[18px] border border-white/[0.09] bg-white/[0.045] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#FFB627]/40 hover:bg-white/[0.07] hover:shadow-[0_8px_24px_-8px_rgba(255,182,39,0.35)]" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-1.5 text-[#9A90B3]">
        <Icon size={14} strokeWidth={1.75} className="transition-colors group-hover:text-[#FFB627]" />
        <span className="text-[11.5px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-mono text-xl text-[#F6F3FC] tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-[11.5px] text-[#9A90B3]">{sub}</div>}
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#150C22] px-3 py-2 text-xs shadow-lg vc-tooltip-in">
      <div className="mb-1 font-semibold text-[#F6F3FC]">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono">{p.value}{p.dataKey === "tempMax" ? "°" : ""}</span>
        </div>
      ))}
    </div>
  );
}

export default function FiveDayForecast({ days = SAMPLE_DAYS }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [burst, setBurst] = useState(null);
  const day = days[activeIdx];
  const power = useMemo(() => computePowerIndex(day), [day]);
  const animatedTempMax = useCountUp(day.tempMax);
  const animatedTempMin = useCountUp(day.tempMin);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 1800);
    return () => clearTimeout(t);
  }, [burst]);

  function handleDaySelect(i, condition) {
    setActiveIdx(i);
    if (condition === "rain" || condition === "sunny" || condition === "partly-cloudy") {
      setBurst({ condition, key: Date.now() });
    }
  }

  const bestPowerIdx = useMemo(() => {
    let best = 0, bestScore = -1;
    days.forEach((d, i) => { const s = computePowerIndex(d); if (s > bestScore) { bestScore = s; best = i; } });
    return best;
  }, [days]);

  const chartData = useMemo(
    () => days.map((d) => ({ label: d.label, tempMax: d.tempMax, tempMin: d.tempMin, power: computePowerIndex(d) })),
    [days]
  );

  return (
    <div className="relative min-h-full overflow-hidden bg-[#0E0817] px-6 pb-14 pt-8 font-[Inter,sans-serif] sm:px-10 lg:px-14 xl:px-20">
      <Particles />
      <div
        className="vc-glow-drift pointer-events-none absolute -top-20 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(circle, #FFB627 0%, #7C5CFF 55%, transparent 70%)" }}
      />

      {burst?.condition === "rain" && <RainBurst key={burst.key} triggerKey={burst.key} />}
      {(burst?.condition === "sunny" || burst?.condition === "partly-cloudy") && (
        <SunBurst key={burst.key} triggerKey={burst.key} />
      )}

      <div className="relative mx-auto max-w-[1440px]">
        <div className={`mb-7 flex items-center gap-3 transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
          <Zap size={24} className="vc-bolt text-[#FFB627]" strokeWidth={2} />
          <div>
            <h1 className="font-[Space_Grotesk,Inter,sans-serif] text-[28px] font-semibold text-[#F6F3FC]">5-day forecast</h1>
            <p className="mt-0.5 text-sm text-[#9A90B3]">Temperature, conditions, and energy outlook through {days[days.length - 1].label.toLowerCase()}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-3 overflow-x-auto pb-1 lg:gap-4">
          {days.map((d, i) => {
            const active = i === activeIdx;
            return (
              <button key={d.label} onClick={() => handleDaySelect(i, d.condition)}
                className={`vc-rise flex min-w-[76px] flex-1 flex-col items-center gap-1.5 rounded-2xl border px-5 py-3.5 transition-all duration-300 active:scale-90 lg:min-w-[96px] lg:py-4 ${
                  active ? "border-[#FFB627] bg-[#FFB627]/10 shadow-[0_0_20px_-4px_rgba(255,182,39,0.55)]" : "border-white/[0.09] bg-white/[0.045] hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.5)]"
                }`}
                style={{ animationDelay: `${i * 70}ms` }}>
                <span className={`text-[13px] font-semibold transition-colors duration-300 ${active ? "text-[#FFB627]" : "text-[#F6F3FC]"}`}>{d.label}</span>
                <ConditionIcon condition={d.condition} size={20} className={`transition-all duration-300 ${active ? "text-[#FFB627] scale-110" : "text-[#9A90B3]"}`} />
                <span className="font-mono text-xs text-[#9A90B3] tabular-nums">{d.tempMax}°</span>
                {i === bestPowerIdx && <span className="vc-pulse text-[9px] uppercase tracking-wide text-[#FFB627]">peak</span>}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] xl:gap-8">
          <div className="flex flex-col gap-6">
            <div key={activeIdx} className="vc-fade-slide flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.08] to-white/[0.04] p-8 shadow-[0_0_40px_-20px_rgba(255,182,39,0.3)]">
              <div>
                <div className="flex items-center gap-2.5">
                  <ConditionIcon condition={day.condition} size={32} className="text-[#FFB627]" />
                  <span className="text-sm text-[#9A90B3]">{day.date}</span>
                </div>
                <div className="mt-2 font-[Space_Grotesk,Inter,sans-serif] text-[64px] font-semibold leading-none text-[#F6F3FC] tabular-nums">
                  {animatedTempMax}°<span className="text-3xl font-medium text-[#9A90B3]"> / {animatedTempMin}°</span>
                </div>
                <div className="mt-2 text-sm text-[#9A90B3]">Feels like {day.feelsLike}°</div>
              </div>
              <div className="border-l border-white/[0.09] pl-6"><PowerDial score={power} /></div>
            </div>

            <div key={`hourly-${activeIdx}`} className="vc-fade-slide grid grid-cols-5 gap-3 sm:gap-4">
              {day.hourly.map((h, i) => (
                <div key={h.time} className="vc-rise flex flex-col items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.045] px-4 py-3.5 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FFB627]/30 hover:shadow-[0_8px_20px_-10px_rgba(255,182,39,0.4)]" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="text-xs text-[#9A90B3]">{h.time}</span>
                  <ConditionIcon condition={h.condition} size={20} className="text-[#FFB627]" />
                  <span className="font-mono text-sm text-[#F6F3FC] tabular-nums">{h.temp}°</span>
                </div>
              ))}
            </div>
          </div>

          <div key={`metrics-${activeIdx}`} className="grid grid-cols-2 gap-4 content-start lg:sticky lg:top-24 lg:self-start">
            <MetricCard icon={ThermometerSun} label="UV index" value={day.uvIndex} sub={day.uvIndex >= 8 ? "Very high" : day.uvIndex >= 6 ? "High" : "Moderate"} delay={0} />
            <MetricCard icon={Wind} label="Wind" value={`${day.windSpeed} mph`} delay={40} />
            <MetricCard icon={Droplets} label="Humidity" value={`${day.humidity}%`} delay={80} />
            <MetricCard icon={CloudRain} label="Precipitation" value={`${day.precipitation}%`} delay={120} />
            <MetricCard icon={Sunrise} label="Sunrise" value={day.sunrise} delay={160} />
            <MetricCard icon={Sunset} label="Sunset" value={day.sunset} delay={200} />
          </div>
        </div>

        <div className="vc-rise mt-6 rounded-[20px] border border-white/[0.09] bg-white/[0.045] px-6 py-5" style={{ animationDelay: "260ms" }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-[#9A90B3]">5-day trend</span>
            <div className="flex items-center gap-3 text-[11px] text-[#9A90B3]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#FFB627]" />High temp</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7C5CFF]" />Power index</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#9A90B3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="power" domain={[0, 100]} hide />
                <YAxis yAxisId="temp" domain={["dataMin - 4", "dataMax + 4"]} hide />
                <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar yAxisId="power" dataKey="power" name="Power index" fill="#7C5CFF" radius={[6, 6, 0, 0]} barSize={44} fillOpacity={0.75}
                  isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={200} />
                <Line yAxisId="temp" dataKey="tempMax" name="High temp" stroke="#FFB627" strokeWidth={2.5} dot={{ r: 4, fill: "#FFB627", strokeWidth: 0 }} activeDot={{ r: 6 }}
                  isAnimationActive animationDuration={1100} animationEasing="ease-out" animationBegin={350} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes vc-float { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translate(var(--drift), -520px); opacity: 0; } }
        .vc-spark { animation-name: vc-float; animation-timing-function: linear; animation-iteration-count: infinite; }

        @keyframes vc-fade-slide-kf { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .vc-fade-slide { animation: vc-fade-slide-kf 0.4s ease-out both; }

        @keyframes vc-rise-kf { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .vc-rise { animation: vc-rise-kf 0.45s ease-out both; }

        @keyframes vc-pulse-kf { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        .vc-pulse { animation: vc-pulse-kf 2s ease-in-out infinite; }

        @keyframes vc-bolt-kf { 0%, 100% { filter: drop-shadow(0 0 0 rgba(255,182,39,0)); } 50% { filter: drop-shadow(0 0 8px rgba(255,182,39,0.8)); } }
        .vc-bolt { animation: vc-bolt-kf 3s ease-in-out infinite; }

        @keyframes vc-glow-drift-kf {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          33% { transform: translate(-46%, 16px) scale(1.06); }
          66% { transform: translate(-54%, -10px) scale(0.96); }
        }
        .vc-glow-drift { animation: vc-glow-drift-kf 14s ease-in-out infinite; }

        @keyframes vc-dial-pulse-kf { 0%, 100% { r: 5; } 50% { r: 6.5; } }
        .vc-dial-pulse { animation: vc-dial-pulse-kf 2.4s ease-in-out infinite; transform-origin: center; }

        @keyframes vc-tooltip-in-kf { from { opacity: 0; transform: translateY(4px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .vc-tooltip-in { animation: vc-tooltip-in-kf 0.15s ease-out both; }

        @keyframes vc-rain-fall-kf {
          from { transform: translateY(-10vh); }
          to { transform: translateY(115vh); }
        }
        .vc-rain-drop { animation-name: vc-rain-fall-kf; animation-timing-function: linear; animation-iteration-count: 3; }

        @keyframes vc-rain-flash-kf {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
        .vc-rain-flash { animation: vc-rain-flash-kf 1.8s ease-out both; }

        @keyframes vc-sun-wash-kf {
          0% { opacity: 0; }
          25% { opacity: 1; }
          100% { opacity: 0; }
        }
        .vc-sun-wash { animation: vc-sun-wash-kf 1.8s ease-out both; }

        @keyframes vc-sun-rays-kf {
          0% { transform: translateX(-50%) rotate(0deg) scale(0.75); opacity: 0; }
          35% { opacity: 0.85; }
          100% { transform: translateX(-50%) rotate(28deg) scale(1.1); opacity: 0; }
        }
        .vc-sun-rays { animation: vc-sun-rays-kf 1.8s ease-out both; }

        @keyframes vc-sun-glow-kf {
          0% { transform: translateX(-50%) scale(0.55); opacity: 0; }
          40% { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1.2); opacity: 0; }
        }
        .vc-sun-glow { animation: vc-sun-glow-kf 1.8s cubic-bezier(0.22, 1, 0.36, 1) both; }

        @keyframes vc-sun-orb-kf {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(-65vh); opacity: 0; }
        }
        .vc-sun-orb { animation-name: vc-sun-orb-kf; animation-timing-function: ease-out; animation-fill-mode: both; }
      `}</style>
    </div>
  );
}