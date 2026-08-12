const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast'

export async function searchCity(query) {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  const url = new URL(GEOCODING_API_URL)
  url.searchParams.set('name', trimmedQuery)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to search for cities.')
  }

  const data = await response.json()
  const results = data.results ?? []

  return results.map((city) => ({
    id: `${city.latitude}-${city.longitude}-${city.name}`,
    name: city.name,
    country: city.country,
    admin1: city.admin1,
    latitude: city.latitude,
    longitude: city.longitude,
  }))
}

// Current-conditions call for the homepage. Separate from getForecast below
// (which returns the 5-day array used by the forecast page).
export async function getCurrentWeather(latitude, longitude) {
  const url = new URL(FORECAST_API_URL)
  url.searchParams.set('latitude', latitude)
  url.searchParams.set('longitude', longitude)
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'cloud_cover',
    ].join(',')
  )
  url.searchParams.set(
    'daily',
    ['temperature_2m_max', 'temperature_2m_min', 'uv_index_max', 'sunrise', 'sunset'].join(',')
  )
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '1')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch current weather.')
  }

  const data = await response.json()
  return mapToCurrentWeather(data)
}

export async function getForecast(latitude, longitude) {
  const url = new URL(FORECAST_API_URL)
  url.searchParams.set('latitude', latitude)
  url.searchParams.set('longitude', longitude)
  url.searchParams.set(
    'daily',
    [
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'weather_code',
      'uv_index_max',
      'precipitation_probability_max',
      'windspeed_10m_max',
      'relative_humidity_2m_mean',
      'cloudcover_mean',
      'sunrise',
      'sunset',
    ].join(',')
  )
  url.searchParams.set('hourly', 'temperature_2m,weather_code')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '5')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch forecast.')
  }

  const data = await response.json()
  return mapToForecastDays(data)
}

const WEATHERCODE_MAP = {
  0: 'sunny',
  1: 'sunny',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'cloudy',
  48: 'cloudy',
  51: 'rain',
  53: 'rain',
  55: 'rain',
  56: 'rain',
  57: 'rain',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'rain',
  73: 'rain',
  75: 'rain',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  95: 'rain',
  96: 'rain',
  99: 'rain',
}

function toCondition(code) {
  return WEATHERCODE_MAP[code] ?? 'cloudy'
}

function formatClockTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatHourLabel(iso) {
  return new Date(iso)
    .toLocaleTimeString('en-US', { hour: 'numeric' })
    .replace(' ', '')
}

function formatDayLabel(iso, index) {
  if (index === 0) return 'Today'
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })
}

function formatDateLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Shapes the /forecast response (with `current` + 1-day `daily`) into the
// flat object WeatherCard.jsx expects: `temperature` and `weatherCode`
// (raw numeric code — WeatherCard does its own icon/label mapping).
function mapToCurrentWeather(data) {
  const { current, daily } = data

  return {
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    weatherCode: current.weather_code,
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    cloudCover: Math.round(current.cloud_cover),
    tempMax: Math.round(daily.temperature_2m_max[0]),
    tempMin: Math.round(daily.temperature_2m_min[0]),
    uvIndex: Math.round(daily.uv_index_max[0]),
    sunrise: formatClockTime(daily.sunrise[0]),
    sunset: formatClockTime(daily.sunset[0]),
  }
}

function mapToForecastDays(data) {
  const { daily, hourly } = data

  return daily.time.map((dateStr, i) => {
    const dayHours = hourly.time
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => t.startsWith(dateStr))
      .filter((_, idx) => idx % 3 === 0)
      .slice(0, 5)

    return {
      label: formatDayLabel(dateStr, i),
      date: formatDateLabel(dateStr),
      condition: toCondition(daily.weather_code[i]),
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      feelsLike: Math.round(daily.apparent_temperature_max[i]),
      uvIndex: Math.round(daily.uv_index_max[i]),
      precipitation: Math.round(daily.precipitation_probability_max[i]),
      windSpeed: Math.round(daily.windspeed_10m_max[i]),
      humidity: Math.round(daily.relative_humidity_2m_mean[i]),
      cloudCover: Math.round(daily.cloudcover_mean[i]),
      sunrise: formatClockTime(daily.sunrise[i]),
      sunset: formatClockTime(daily.sunset[i]),
      hourly: dayHours.map(({ t, idx }) => ({
        time: formatHourLabel(t),
        temp: Math.round(hourly.temperature_2m[idx]),
        condition: toCondition(hourly.weather_code[idx]),
      })),
    }
  })
}