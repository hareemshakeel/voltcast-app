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
    timezone: city.timezone,
  }))
}

export async function getForecast(latitude, longitude) {
  const url = new URL(FORECAST_API_URL)
  url.searchParams.set('latitude', latitude)
  url.searchParams.set('longitude', longitude)
  url.searchParams.set(
    'current',
    'temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,wind_speed_10m',
  )
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('forecast_days', '5')
  url.searchParams.set('timezone', 'auto')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to load weather forecast.')
  }

  const data = await response.json()
  const current = data.current ?? null
  const daily = data.daily ?? null

  return {
    location: {
      name: data.timezone ?? '',
      latitude: data.latitude,
      longitude: data.longitude,
    },
    current: current
      ? {
          temperature: current.temperature_2m,
          weatherCode: current.weather_code,
          humidity: current.relative_humidity_2m,
          feelsLike: current.apparent_temperature,
          windSpeed: current.wind_speed_10m,
          time: current.time,
        }
      : null,
    daily: daily
      ? daily.time.map((date, index) => ({
          date,
          weatherCode: daily.weather_code[index],
          temperatureMax: daily.temperature_2m_max[index],
          temperatureMin: daily.temperature_2m_min[index],
          precipitationChance: daily.precipitation_probability_max[index],
        }))
      : [],
  }
}