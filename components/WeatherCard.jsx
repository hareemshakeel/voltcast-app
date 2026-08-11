'use client';

function getWeatherLabel(weatherCode) {
  const weatherMap = {
    0: 'Clear',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Cloudy',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with hail',
  }

  return weatherMap[weatherCode] ?? 'Unknown'
}

function WeatherIcon({ weatherCode }) {
  const common = { viewBox: '0 0 48 48', className: 'h-16 w-16 sm:h-20 sm:w-20', 'aria-hidden': true }
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' }

  if ([0, 1].includes(weatherCode)) {
    return (
      <svg {...common} {...stroke}>
        <circle cx="24" cy="24" r="8" fill="currentColor" stroke="none" />
        <g strokeLinecap="round">
          <path d="M24 4v6" />
          <path d="M24 38v6" />
          <path d="M4 24h6" />
          <path d="M38 24h6" />
          <path d="m10.2 10.2 4.2 4.2" />
          <path d="m33.6 33.6 4.2 4.2" />
          <path d="m37.8 10.2-4.2 4.2" />
          <path d="m14.4 33.6-4.2 4.2" />
        </g>
      </svg>
    )
  }

  if ([2, 3, 45, 48].includes(weatherCode)) {
    return (
      <svg {...common} {...stroke}>
        <path d="M17 32h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 32Z" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return (
      <svg {...common} {...stroke}>
        <path d="M17 26h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 26Z" fill="currentColor" stroke="none" />
        <g strokeLinecap="round">
          <path d="M17 33v4" />
          <path d="M25 33v4" />
          <path d="M33 33v4" />
        </g>
      </svg>
    )
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return (
      <svg {...common} {...stroke}>
        <path d="M17 26h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 26Z" fill="currentColor" stroke="none" />
        <g strokeLinecap="round">
          <path d="M18 34h12" />
          <path d="M21 33v5" />
          <path d="M27 33v5" />
        </g>
      </svg>
    )
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return (
      <svg {...common} {...stroke}>
        <path d="M17 26h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 26Z" fill="currentColor" stroke="none" />
        <path d="m18 32 4-7 2 5 3-7 3 6 2-3" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg {...common} {...stroke}>
      <path d="M17 30h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 30Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="wc-chip flex flex-1 flex-col items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFB627]/25 hover:bg-white/[0.06]">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#9A90B3]">{label}</p>
      <p className="font-[Space_Grotesk] text-lg font-bold text-[#F6F3FC]">{value}</p>
    </div>
  )
}

export default function WeatherCard({ location, current }) {
  if (!location || !current) {
    return null
  }

  const locationSubtitle = [location.admin1, location.country].filter(Boolean).join(', ')

  return (
    <section
      aria-label="Current weather"
      className="wc-card relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] px-7 py-8 text-center backdrop-blur-md sm:px-9 sm:py-10"
    >
      <div className="wc-glow pointer-events-none absolute inset-0" />

      <div className="relative">
        <p className="font-[Space_Grotesk] text-2xl font-bold text-[#F6F3FC] sm:text-3xl">
          {location.name}
        </p>
        {locationSubtitle && (
          <p className="mt-1 text-xs text-[#9A90B3] sm:text-sm">{locationSubtitle}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-5">
          <div className="wc-icon-glow text-[#FFB627]">
            <WeatherIcon weatherCode={current.weatherCode} />
          </div>
          <p className="wc-shimmer font-[Space_Grotesk] text-7xl font-bold leading-none sm:text-8xl">
            {Math.round(current.temperature)}°
          </p>
        </div>

        <p className="mt-3 text-sm font-medium tracking-wide text-[#9A90B3] sm:text-base">
          {getWeatherLabel(current.weatherCode)}
          {typeof current.tempMax === 'number' && typeof current.tempMin === 'number' && (
            <span className="ml-2 text-[#F6F3FC]/70">
              H:{current.tempMax}° L:{current.tempMin}°
            </span>
          )}
        </p>

        <div className="mt-7 flex gap-3">
          <StatChip label="Feels like" value={`${Math.round(current.feelsLike)}°`} />
          <StatChip label="Humidity" value={`${Math.round(current.humidity)}%`} />
          <StatChip label="Wind" value={`${Math.round(current.windSpeed)} km/h`} />
        </div>

        {(typeof current.uvIndex === 'number' || current.sunrise || current.sunset) && (
          <div className="mt-3 flex gap-3">
            {typeof current.uvIndex === 'number' && (
              <StatChip label="UV index" value={current.uvIndex} />
            )}
            {current.sunrise && <StatChip label="Sunrise" value={current.sunrise} />}
            {current.sunset && <StatChip label="Sunset" value={current.sunset} />}
          </div>
        )}
      </div>

      <style jsx>{`
        .wc-card {
          animation: wc-card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.55);
        }
        @keyframes wc-card-in {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        .wc-glow {
          background: radial-gradient(circle at 50% 0%, rgba(255, 182, 39, 0.1), transparent 60%);
        }

        .wc-icon-glow svg {
          filter: drop-shadow(0 0 16px rgba(255, 182, 39, 0.45));
          animation: wc-icon-float 4s ease-in-out infinite;
        }
        @keyframes wc-icon-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .wc-shimmer {
          background: linear-gradient(90deg, #ffb627 0%, #ffd97d 30%, #f6f3fc 55%, #ffd97d 80%, #ffb627 100%);
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: wc-shimmer-move 6s linear infinite;
        }
        @keyframes wc-shimmer-move {
          to {
            background-position: 200% center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wc-card,
          .wc-icon-glow svg,
          .wc-shimmer {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}