'use client';
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CloudSun, CalendarDays, HeartPulse, ArrowRight, Cloud, Sun, CloudRain, Wind, Droplets, Gauge } from 'lucide-react'
import SearchBar from './SearchBar'
import WeatherCard from './WeatherCard'
import { getCurrentWeather } from '../services/weatherApi'

const highlights = [
  {
    href: '/',
    icon: CloudSun,
    title: 'Live conditions',
    desc: 'Temperature, feels-like, humidity and wind — updated the moment you search.',
  },
  {
    href: '/forecast',
    icon: CalendarDays,
    title: '5-day forecast',
    desc: 'See how the week is shaping up before you plan around it.',
  },
  {
    href: '/health',
    icon: HeartPulse,
    title: 'Air quality & UV',
    desc: 'AQI, UV exposure and pollen — the stuff that actually affects your day.',
  },
]

const floaters = [
  { Icon: Sun, top: '10%', left: '6%', size: 24, delay: '0s', duration: '9s' },
  { Icon: Cloud, top: '80%', left: '8%', size: 22, delay: '2.4s', duration: '10s' },
]

const orbCities = [
  { name: 'Tokyo', temp: 24, condition: 'Partly cloudy', Icon: CloudSun, humidity: 62, wind: 14 },
  { name: 'Reykjavik', temp: 8, condition: 'Windy', Icon: Wind, humidity: 71, wind: 32 },
  { name: 'Dubai', temp: 38, condition: 'Clear sky', Icon: Sun, humidity: 24, wind: 9 },
  { name: 'London', temp: 15, condition: 'Light rain', Icon: CloudRain, humidity: 80, wind: 18 },
]

const trustStats = [
  { value: '190+', label: 'countries covered' },
  { value: '10 min', label: 'refresh interval' },
  { value: '99.9', label: 'percent uptime', suffix: '%' },
]

function CursorSpotlight() {
  const [pos, setPos] = useState({ x: 50, y: 25 })
  useEffect(() => {
    function handle(e) {
      const el = document.getElementById('vc-hero')
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    }
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 transition-[background] duration-500 ease-out"
      style={{
        background: `radial-gradient(560px circle at ${pos.x}% ${pos.y}%, rgba(255,182,39,0.07), transparent 42%)`,
      }}
    />
  )
}

function AnimatedStat({ value, suffix = '', label, delay = 0 }) {
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const match = String(value).match(/^([\d.]+)(.*)$/)
    if (!match) {
      setDisplay(value)
      return
    }
    const target = parseFloat(match[1])
    const trailing = match[2]
    const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0
    let start = null
    const duration = 1100

    function step(ts) {
      if (start === null) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(`${(target * eased).toFixed(decimals)}${trailing}${suffix}`)
      if (progress < 1) requestAnimationFrame(step)
    }

    const timeout = setTimeout(() => requestAnimationFrame(step), delay)
    return () => clearTimeout(timeout)
  }, [value, suffix, delay])

  return (
    <div className="text-left">
      <p className="font-[Space_Grotesk] text-base font-bold tabular-nums text-[#F6F3FC]">{display}</p>
      <p className="text-[10px] leading-tight text-[#9A90B3]">{label}</p>
    </div>
  )
}

// Decorative animations (blurred blobs, rotating borders, pulsing icons) are
// expensive to composite. Starting them immediately competes with hydration
// and first paint, which is fine on a fast desktop CPU but shows up as heavy
// main-thread work / TBT on throttled mobile devices. Deferring them by one
// idle tick lets the page paint first, then lets the decoration kick in.
function useDeferredMotion() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
    const cancelIdle = window.cancelIdleCallback || clearTimeout
    const id = idle(() => setReady(true))
    return () => cancelIdle(id)
  }, [])
  return ready
}

function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, inView]
}

function SkeletonCard() {
  return (
    <div className="vc-in w-full max-w-sm rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
      <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-white/[0.08]" />
      <div className="mx-auto mt-5 h-16 w-16 animate-pulse rounded-full bg-white/[0.08]" />
      <div className="mx-auto mt-4 h-10 w-20 animate-pulse rounded-full bg-white/[0.08]" />
      <div className="mx-auto mt-3 h-3 w-24 animate-pulse rounded-full bg-white/[0.06]" />
      <div className="mt-6 flex justify-center gap-6">
        <div className="h-8 w-14 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-8 w-14 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-8 w-14 animate-pulse rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  )
}

function WeatherOrb() {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const capsuleRef = useRef(null)
  const motionReady = useDeferredMotion()

  useEffect(() => {
    if (!motionReady) return
    const id = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % orbCities.length)
        setFade(true)
      }, 350)
    }, 3800)
    return () => clearInterval(id)
  }, [motionReady])

  function handleMouseMove(e) {
    const rect = capsuleRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -6, y: px * 6 })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
  }

  const city = orbCities[index]
  const CityIcon = city.Icon

  return (
    <div className="vc-capsule-wrap relative mx-auto w-full max-w-[320px]" style={{ perspective: '1000px' }}>
      <div className="vc-mesh absolute -inset-10 -z-10" />

      <div
        ref={capsuleRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="vc-capsule relative overflow-hidden rounded-[28px] px-7 py-8 transition-transform duration-200 ease-out"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div
          className="vc-capsule-border absolute inset-0 rounded-[28px]"
          style={{ animationPlayState: motionReady ? 'running' : 'paused' }}
        />
        <div className="vc-capsule-sheen pointer-events-none absolute inset-0" />

        <div
          className={`relative flex items-center gap-5 transition-all duration-400 ${
            fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
          }`}
        >
          <div
            className="vc-capsule-icon flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl"
            style={{ animationPlayState: motionReady ? 'running' : 'paused' }}
          >
            <CityIcon size={34} strokeWidth={1.3} className="text-[#FFD97D]" />
          </div>
          <div className="min-w-0 text-left">
            <p className="font-[Space_Grotesk] text-5xl font-bold leading-none text-[#F6F3FC]">
              {city.temp}°
            </p>
            <p className="mt-2 truncate text-sm font-medium text-[#C9C0DE]">{city.condition}</p>
            <p className="truncate font-[Space_Grotesk] text-base font-semibold text-[#F6F3FC]">
              {city.name}
            </p>
          </div>
        </div>

        <div
          className={`relative mt-5 flex items-center gap-5 border-t border-white/[0.08] pt-4 text-xs text-[#9A90B3] transition-all duration-400 delay-75 ${
            fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Droplets size={13} /> {city.humidity}% humidity
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge size={13} /> {city.wind} km/h
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {orbCities.map((c, i) => (
          <span
            key={c.name}
            className={`vc-pill vc-pill-in rounded-full px-3 py-1 text-[10px] font-medium tracking-wide transition-all duration-300 ${
              i === index
                ? 'scale-110 border border-[#FFB627]/40 bg-[#FFB627]/[0.14] text-[#FFD97D]'
                : 'scale-100 border border-white/[0.06] bg-white/[0.02] text-[#7E7594]'
            }`}
            style={{ animationDelay: `${400 + i * 90}ms` }}
          >
            {c.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function HighlightCard({ h, i }) {
  const Icon = h.icon
  const [ref, inView] = useInView(0.25)
  return (
    <Link
      ref={ref}
      href={h.href}
      className={`vc-card group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-left backdrop-blur-sm transition-all duration-500 hover:-translate-y-[4px] hover:border-[#FFB627]/30 hover:bg-white/[0.045] ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: inView ? `${i * 90}ms` : '0ms' }}
    >
      <span className="vc-card-sheen pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#FFB627]/[0.12] text-[#FFB627] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
        <Icon size={17} strokeWidth={1.9} />
      </div>
      <p className="relative mt-3 font-[Space_Grotesk] text-sm font-semibold text-[#F6F3FC]">{h.title}</p>
      <p className="relative mt-1 text-xs leading-relaxed text-[#9A90B3]">{h.desc}</p>
    </Link>
  )
}

function App() {
  const [forecast, setForecast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchedCity, setSearchedCity] = useState(false)
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const [hasSearchInput, setHasSearchInput] = useState(false)
  const motionReady = useDeferredMotion()

  async function handleSelectCity(city) {
    setSearchedCity(true)
    setIsLoading(true)
    setError('')
    setForecast(null)

    try {
      const current = await getCurrentWeather(city.latitude, city.longitude)
      setForecast({
        current,
        location: {
          name: city.name,
          country: city.country,
          admin1: city.admin1,
          latitude: city.latitude,
          longitude: city.longitude,
        },
      })
    } catch (error) {
      console.error(error)
      setError('Unable to load weather for that city.')
    } finally {
      setIsLoading(false)
    }
  }

  const showIntro = !searchedCity && !isLoading

  return (
    <main
      id="vc-hero"
      className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#0B0A1A] px-5 pb-24 pt-14 sm:px-8 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="vc-blob vc-blob--amber absolute -top-24 left-[8%] h-[420px] w-[420px] rounded-full"
          style={{ animationPlayState: motionReady ? 'running' : 'paused' }}
        />
        <div
          className="vc-blob vc-blob--violet absolute top-[10%] right-[4%] h-[360px] w-[360px] rounded-full"
          style={{ animationPlayState: motionReady ? 'running' : 'paused' }}
        />
        <div
          className="vc-blob vc-blob--blue absolute bottom-[-10%] left-[30%] h-[460px] w-[460px] rounded-full"
          style={{ animationPlayState: motionReady ? 'running' : 'paused' }}
        />

        <svg className="absolute inset-0 h-full w-full opacity-[0.05]">
          <filter id="vc-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#vc-grain)" />
        </svg>

        {floaters.map((f, i) => (
          <f.Icon
            key={i}
            className="vc-float absolute text-[#F6F3FC]/[0.07]"
            style={{ top: f.top, left: f.left, animationDelay: f.delay, animationDuration: f.duration }}
            size={f.size}
            strokeWidth={1.4}
          />
        ))}
      </div>

      <CursorSpotlight />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
            <div className="vc-in group flex items-center gap-2.5">
              <svg
                className="vc-bolt h-9 w-9 transition-transform duration-500 group-hover:rotate-[10deg] sm:h-10 sm:w-10"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <path d="M18.2 2 7.5 17h6.7L13 30l11.5-16h-6.8L18.2 2Z" fill="#FFB627" />
              </svg>
              <h1 className="vc-shimmer font-[Space_Grotesk] text-4xl font-bold tracking-tight sm:text-5xl">
                Voltcast
              </h1>
            </div>

            <p
              className="vc-in mt-3 flex items-center gap-2 text-sm text-[#9A90B3] sm:text-base"
              style={{ animationDelay: '80ms' }}
            >
              <span className="vc-live h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
              Real-time weather, air quality, and UV insight for any city on Earth.
            </p>

            <div className="vc-in relative z-30 mt-9 flex w-full justify-center lg:justify-start" style={{ animationDelay: '140ms' }}>
              <div className="vc-glow relative w-full max-w-sm">
                <SearchBar
                  onSelectCity={handleSelectCity}
                  onDropdownVisibilityChange={setIsSearchDropdownOpen}
                  onTypingStateChange={setHasSearchInput}
                />
              </div>
            </div>

            {showIntro && (
              <div
                className="vc-in mt-9 flex w-full max-w-sm items-center justify-center gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-3.5 lg:justify-start"
                style={{ animationDelay: '190ms' }}
              >
                {trustStats.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-5">
                    {i > 0 && <span className="h-6 w-px bg-white/10" />}
                    <AnimatedStat value={s.value} suffix={s.suffix} label={s.label} delay={300 + i * 200} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {showIntro && (
            <div className="vc-in flex items-center justify-center" style={{ animationDelay: '160ms' }}>
              <WeatherOrb />
            </div>
          )}
        </div>

        <div className={`relative z-0 flex w-full flex-col items-center ${showIntro ? 'mt-12' : 'mt-8'}`}>
          {isLoading && <SkeletonCard />}

          {!isLoading && error && (
            <div
              className="vc-in flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[#F87171]/25 bg-[#F87171]/[0.08] px-4 py-3 text-left text-sm text-[#F87171]"
              role="alert"
            >
              {error}
            </div>
          )}

          {!isLoading && !error && forecast && (
            <div className="vc-in flex w-full flex-col items-center">
              <WeatherCard location={forecast.location} current={forecast.current} />
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/forecast" className="vc-btn group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#F6F3FC]">
                  See 5-day forecast
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link href="/health" className="vc-btn group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#F6F3FC]">
                  Check air quality & UV
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          )}

          {!isLoading && !error && !forecast && searchedCity && (
            <p className="vc-in text-sm text-[#9A90B3]">
              Weather data isn&apos;t available right now — try searching again.
            </p>
          )}

          {showIntro && (
            <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              {highlights.map((h, i) => (
                <HighlightCard key={h.title} h={h} i={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes vc-home-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        .vc-in { animation: vc-home-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes vc-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .vc-live { animation: vc-dot 2s ease-in-out infinite; }

        .vc-shimmer {
          background: linear-gradient(90deg, #FFB627 0%, #FFD97D 25%, #F6F3FC 50%, #FFD97D 75%, #FFB627 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: vc-shimmer-move 5s linear infinite;
        }
        @keyframes vc-shimmer-move { to { background-position: 200% center; } }

        .vc-bolt { animation: vc-bolt-glow 3s ease-in-out infinite; }
        @keyframes vc-bolt-glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(255,182,39,0.3)); }
          50% { filter: drop-shadow(0 0 10px rgba(255,182,39,0.7)); }
        }

        .vc-glow::before {
          content: '';
          position: absolute;
          inset: -14px;
          border-radius: 24px;
          background: radial-gradient(closest-side, rgba(255,182,39,0.14), transparent 75%);
          animation: vc-glow-pulse 3.5s ease-in-out infinite;
          z-index: -1;
        }
        @keyframes vc-glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.97); }
          50% { opacity: 1; transform: scale(1.03); }
        }

        .vc-blob { filter: blur(60px); opacity: 0.35; animation: vc-blob-drift 16s ease-in-out infinite; animation-play-state: paused; }
        .vc-blob--amber { background: radial-gradient(circle, #FFB627, transparent 70%); animation-delay: 0s; }
        .vc-blob--violet { background: radial-gradient(circle, #7C3AED, transparent 70%); animation-delay: -5s; }
        .vc-blob--blue { background: radial-gradient(circle, #3B82F6, transparent 70%); animation-delay: -10s; }
        @keyframes vc-blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.08); }
          66% { transform: translate(-25px, 25px) scale(0.95); }
        }

        .vc-float { animation: vc-float-move ease-in-out infinite; }
        @keyframes vc-float-move {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }

        .vc-card-sheen {
          background: linear-gradient(115deg, transparent 20%, rgba(255,182,39,0.08) 45%, transparent 70%);
        }

        .vc-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
        }
        .vc-btn:hover { transform: translateY(-2px); border-color: rgba(255,182,39,0.4); background-color: rgba(255,182,39,0.08); }
        .vc-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg);
          transition: left 0.6s ease;
        }
        .vc-btn:hover::before { left: 130%; }

        .vc-mesh {
          background:
            radial-gradient(circle at 20% 20%, rgba(255,182,39,0.35), transparent 45%),
            radial-gradient(circle at 80% 30%, rgba(124,58,237,0.35), transparent 45%),
            radial-gradient(circle at 50% 85%, rgba(59,130,246,0.3), transparent 50%);
          filter: blur(50px);
          animation: vc-mesh-shift 10s ease-in-out infinite;
        }
        @keyframes vc-mesh-shift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, -4%) scale(1.08); }
          66% { transform: translate(-3%, 3%) scale(0.96); }
        }

        .vc-capsule {
          background: linear-gradient(160deg, rgba(40,30,64,0.85) 0%, rgba(18,13,32,0.92) 100%);
          backdrop-filter: blur(20px);
          box-shadow: 0 30px 60px -25px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06);
          animation: vc-capsule-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes vc-capsule-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }

        /* rotating conic gradient border, replaces the flat static border */
        .vc-capsule-border {
          padding: 1.5px;
          background: conic-gradient(from 0deg, rgba(255,182,39,0.6), rgba(124,58,237,0.35) 30%, rgba(255,255,255,0.05) 55%, rgba(59,130,246,0.35) 75%, rgba(255,182,39,0.6));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: vc-border-spin 8s linear infinite;
          animation-play-state: paused;
        }
        @keyframes vc-border-spin { to { transform: rotate(360deg); } }

        .vc-capsule-sheen {
          background: linear-gradient(120deg, rgba(255,255,255,0.05) 0%, transparent 30%, transparent 70%, rgba(255,182,39,0.04) 100%);
        }

        .vc-capsule-icon {
          background: radial-gradient(circle at 35% 30%, rgba(255,182,39,0.22), rgba(255,182,39,0.04) 70%);
          box-shadow: inset 0 0 0 1px rgba(255,182,39,0.22);
          animation: vc-icon-float 4s ease-in-out infinite, vc-icon-pulse 3.8s ease-in-out infinite;
          animation-play-state: paused;
        }
        @keyframes vc-icon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes vc-icon-pulse {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(255,182,39,0.22), 0 0 0 0 rgba(255,182,39,0.25); }
          50% { box-shadow: inset 0 0 0 1px rgba(255,182,39,0.35), 0 0 22px 4px rgba(255,182,39,0.2); }
        }

        .vc-pill {
          cursor: default;
        }
        .vc-pill-in {
          animation: vc-pill-in-kf 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes vc-pill-in-kf {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .vc-in, .vc-live, .vc-shimmer, .vc-bolt, .vc-glow::before, .vc-blob, .vc-float,
          .vc-mesh, .vc-capsule, .vc-capsule-border, .vc-capsule-icon, .vc-pill-in, .vc-btn::before {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}

export default App