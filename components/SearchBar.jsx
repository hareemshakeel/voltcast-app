"use client";

import { useEffect, useRef, useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { searchCity } from "../services/weatherApi";

const DEBOUNCE_DELAY = 350;

function formatCityLabel(city) {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

export default function SearchBar({ onSelectCity, onDropdownVisibilityChange }) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const suppressNextSearchRef = useRef(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setCities([]);
      setIsLoading(false);
      setIsOpen(false);
      return undefined;
    }

    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      setIsLoading(false);
      setIsOpen(false);
      return undefined;
    }

    let ignoreResults = false;
    setIsLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchCity(trimmedQuery);
        if (!ignoreResults) {
          setCities(results);
          setIsOpen(true);
        }
      } catch {
        if (!ignoreResults) {
          setCities([]);
          setIsOpen(true);
        }
      } finally {
        if (!ignoreResults) setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      ignoreResults = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  function handleSelectCity(city) {
    suppressNextSearchRef.current = true;
    setQuery(formatCityLabel(city));
    setCities([]);
    setIsOpen(false);
    onSelectCity(city);
  }

  function handleQueryChange(event) {
    setQuery(event.target.value);
  }

  const shouldShowDropdown = isOpen && query.trim();

  useEffect(() => {
    onDropdownVisibilityChange?.(Boolean(shouldShowDropdown));
  }, [onDropdownVisibilityChange, shouldShowDropdown]);

  return (
    <div className="relative w-full max-w-[420px]">
      <label htmlFor="city-search" className="sr-only">
        Search for a city
      </label>

      <div className="group relative">
        <Search
          size={17}
          strokeWidth={2}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9A90B3] transition-colors duration-300 group-focus-within:text-[#FFB627]"
        />

        <input
          id="city-search"
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 150);
          }}
          placeholder="Search for a city…"
          autoComplete="off"
          className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.045] py-2.5 pl-11 pr-10 text-sm text-[#F6F3FC] placeholder-[#9A90B3] outline-none transition-all duration-300 focus:border-[#FFB627]/50 focus:bg-white/[0.07] focus:shadow-[0_0_20px_-6px_rgba(255,182,39,0.5)]"
        />

        {isLoading && (
          <Loader2
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#FFB627]"
          />
        )}
      </div>

      {shouldShowDropdown && (
        <div
          role="listbox"
          aria-label="City suggestions"
          className="vc-dropdown-in absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#150C22] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          {cities.length > 0 ? (
            cities.map((city, i) => (
              <button
                key={city.id}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelectCity(city)}
                className="vc-option-in flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-[#FFB627]/[0.08] focus:bg-[#FFB627]/[0.08] focus:outline-none"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <MapPin size={15} className="shrink-0 text-[#FFB627]" strokeWidth={1.75} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-[#F6F3FC]">
                    {city.name}
                  </span>
                  <span className="truncate text-xs text-[#9A90B3]">
                    {[city.admin1, city.country].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-[#9A90B3]">No cities found</div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes vc-dropdown-in-kf {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .vc-dropdown-in {
          animation: vc-dropdown-in-kf 0.2s ease-out both;
        }
        @keyframes vc-option-in-kf {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .vc-option-in {
          animation: vc-option-in-kf 0.25s ease-out both;
        }
      `}</style>
    </div>
  );
}