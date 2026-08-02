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
  if ([0, 1].includes(weatherCode)) {
    return (
      <svg viewBox="0 0 48 48" className="weather-card__icon" aria-hidden="true">
        <circle cx="24" cy="24" r="8" />
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
      <svg viewBox="0 0 48 48" className="weather-card__icon" aria-hidden="true">
        <path d="M17 32h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 32Z" />
      </svg>
    )
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return (
      <svg viewBox="0 0 48 48" className="weather-card__icon" aria-hidden="true">
        <path d="M17 26h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 26Z" />
        <path d="M17 33v4" />
        <path d="M25 33v4" />
        <path d="M33 33v4" />
      </svg>
    )
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return (
      <svg viewBox="0 0 48 48" className="weather-card__icon" aria-hidden="true">
        <path d="M17 26h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 26Z" />
        <path d="M18 34h12" />
        <path d="M21 33v5" />
        <path d="M27 33v5" />
      </svg>
    )
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return (
      <svg viewBox="0 0 48 48" className="weather-card__icon" aria-hidden="true">
        <path d="M17 26h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 26Z" />
        <path d="m18 32 4-7 2 5 3-7 3 6 2-3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" className="weather-card__icon" aria-hidden="true">
      <path d="M17 30h16a7 7 0 0 0 0-14 10 10 0 0 0-19.5 2.2A6.5 6.5 0 0 0 17 30Z" />
    </svg>
  )
}

export default function WeatherCard({ location, current }) {
  if (!location || !current) {
    return null
  }

  return (
    <section className="weather-card" aria-label="Current weather">
      <h2 className="weather-card__city">{location.name}</h2>
      <div className="weather-card__hero">
        <WeatherIcon weatherCode={current.weatherCode} />
        <p className="weather-card__temperature">{Math.round(current.temperature)}°</p>
      </div>
      <p className="weather-card__condition">{getWeatherLabel(current.weatherCode)}</p>
      <dl className="weather-card__details">
        <div>
          <dt>Feels like</dt>
          <dd>{Math.round(current.feelsLike)}°</dd>
        </div>
        <div>
          <dt>Humidity</dt>
          <dd>{Math.round(current.humidity)}%</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{Math.round(current.windSpeed)} km/h</dd>
        </div>
      </dl>
    </section>
  )
}
