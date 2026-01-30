"use client"

import { MapPin, Search, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { AirportData } from "../data/airports"
import { searchAirports } from "../data/airports"

interface AirportSearchProps {
  airports: AirportData[]
  value: string
  onChange: (value: string) => void
  onSelect: (airport: AirportData | null) => void
  placeholder?: string
  "aria-label"?: string
  className?: string
}

export function AirportSearch({
  airports,
  value,
  onChange,
  onSelect,
  placeholder = "공항명, IATA, 도시, 국가로 검색...",
  "aria-label": ariaLabel,
  className = "",
}: AirportSearchProps) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<AirportData[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const v = value.trim()
    if (!v) {
      setFiltered([])
      setOpen(false)
      return
    }

    const results = searchAirports(v, 10, airports)
    setFiltered(results)

    // Only open the dropdown when the input is actually focused.
    // Otherwise, switching tabs with prefilled values can cause the menu to pop
    // under the cursor and look like items are "hovered"/preselected.
    const isFocused = document.activeElement === inputRef.current
    setOpen(isFocused && results.length > 0)
  }, [value, airports])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (airport: AirportData) => {
      onChange(airport.iata)
      onSelect(airport)
      setOpen(false)
      inputRef.current?.blur()
    },
    [onChange, onSelect]
  )

  const handleClear = useCallback(() => {
    onChange("")
    onSelect(null)
    setOpen(false)
    inputRef.current?.focus()
  }, [onChange, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return
      const code = ((e.currentTarget as HTMLInputElement).value || "").trim().toUpperCase()
      if (code.length !== 3) return
      const match =
        filtered.find((a) => a.iata === code) ?? airports.find((a) => a.iata === code)
      if (match) {
        e.preventDefault()
        handleSelect(match)
      }
    },
    [airports, filtered, handleSelect]
  )

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 shrink-0 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => filtered.length > 0 && setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="w-full rounded-lg border border-slate-600/60 bg-slate-900/60 py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 rounded p-1 text-slate-500 hover:bg-slate-700/50 hover:text-slate-300"
            aria-label="지우기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-600 bg-slate-800 shadow-xl"
          role="listbox"
        >
          <p className="border-b border-slate-600/60 px-3 py-2 text-[11px] font-medium text-slate-500">
            {filtered.length} results
          </p>
          <ul className="py-1">
            {filtered.map((airport) => (
              <li key={airport.id} role="option">
                <button
                  type="button"
                  // Prevent the input from losing focus on mousedown (blur closes the menu)
                  // so clicking an option works reliably.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(airport)}
                  className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-700/50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-200">{airport.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-600/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-300">
                        {airport.iata}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {airport.city} • {airport.country}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
