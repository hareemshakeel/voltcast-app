'use client';
import { useState } from 'react'
import SearchBar from './SearchBar'
import WeatherCard from './WeatherCard'
import { getForecast } from '../services/weatherApi'

function App() {
  const [forecast, setForecast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchedCity, setSearchedCity] = useState(false)
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const [hasSearchInput, setHasSearchInput] = useState(false)

  async function handleSelectCity(city) {
    setSearchedCity(true)
    setIsLoading(true)
    setError('')
    setForecast(null)

    try {
      const result = await getForecast(city.latitude, city.longitude)
      setForecast({
        ...result,
        location: {
          ...result.location,
          name: city.name,
          country: city.country,
          admin1: city.admin1,
        },
      })
    } catch (error) {
      console.error(error)
      setError('Unable to load weather for that city.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="weather-app">
      <header className="weather-app__brand" aria-label="Weather app brand">
        <svg className="weather-app__brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M18.2 2 7.5 17h6.7L13 30l11.5-16h-6.8L18.2 2Z" fill="#ffd25f" />
        </svg>
        <h1 className="weather-app__title">
          <span className="weather-app__title-accent">Voltcast</span>
        </h1>
      </header>

      <SearchBar
        onSelectCity={handleSelectCity}
        onDropdownVisibilityChange={setIsSearchDropdownOpen}
        onTypingStateChange={setHasSearchInput}
      />

      {isLoading ? (
        <div className="weather-app__status weather-app__status--loading" aria-live="polite">
          <span className="weather-app__spinner" aria-hidden="true" />
          <span>Loading weather</span>
        </div>
      ) : null}

      {!isLoading && error ? (
        <p className="weather-app__status weather-app__status--error">{error}</p>
      ) : null}

      {!isLoading && !error && forecast ? (
        <WeatherCard location={forecast.location} current={forecast.current} />
      ) : null}

      {!isLoading && !error && !forecast && searchedCity ? (
        <p className="weather-app__status">
          Weather data isn&apos;t available right now — try searching again.
        </p>
      ) : null}

      {!searchedCity && !isLoading && !isSearchDropdownOpen && !hasSearchInput ? (
        <p className="weather-app__status">Search for a city to get started.</p>
      ) : null}
    </main>
  )
}

export default App
