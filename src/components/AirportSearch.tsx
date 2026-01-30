"use client"

import { MapPin, Search, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { AirportData } from "../data/airports"
import { searchAirports } from "../data/airports"
import { createPortal } from "react-dom"

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
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const firstResultRef = useRef<HTMLButtonElement>(null)

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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

  // 모바일 모달: 포커스 트랩 및 ESC 닫기
  useEffect(() => {
    if (!open || !isMobile) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        inputRef.current?.blur()
      }
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleFocusTrap)
    // 첫 번째 결과에 포커스 (모바일 모달 열릴 때)
    setTimeout(() => firstResultRef.current?.focus(), 100)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleFocusTrap)
    }
  }, [open, isMobile])

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
      // iOS 키보드 닫기
      if (isMobile && inputRef.current) {
        inputRef.current.blur()
      }
    },
    [onChange, onSelect, isMobile]
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

  const dropdownContent = open && filtered.length > 0 && (
    <>
      <div className="border-b border-slate-600/60 px-3 py-2 text-[11px] font-medium text-slate-500">
        {filtered.length} results
      </div>
      <ul className="py-1" role="listbox">
        {filtered.map((airport, idx) => (
          <li key={airport.id} role="option">
            <button
              ref={idx === 0 ? firstResultRef : undefined}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(airport)}
              className="flex w-full min-h-[44px] items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-700/50 focus-visible:outline-none focus-visible:bg-slate-700/50 focus-visible:ring-2 focus-visible:ring-sky-500/50"
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
    </>
  )

  return (
    <>
      <div ref={containerRef} className={`relative z-10 ${className}`}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => filtered.length > 0 && setOpen(true)}
            onBlur={() => {
              // 모바일 모달에서는 blur 이벤트 지연 처리
              if (!isMobile) {
                setOpen(false)
              } else {
                setTimeout(() => {
                  if (!modalRef.current?.contains(document.activeElement)) {
                    setOpen(false)
                  }
                }, 200)
              }
            }}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={open ? "airport-search-listbox" : undefined}
            className="w-full min-h-[44px] rounded-lg border border-slate-600/60 bg-slate-900/60 py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 min-h-[44px] min-w-[44px] rounded p-1 text-slate-500 hover:bg-slate-700/50 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
              aria-label={ariaLabel ? `${ariaLabel} 지우기` : "입력값 지우기"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* 데스크탑 드롭다운 */}
        {!isMobile && open && filtered.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-72 overflow-auto rounded-lg border border-slate-600 bg-slate-800 shadow-xl"
            role="listbox"
            id="airport-search-listbox"
          >
            {dropdownContent}
          </div>
        )}
      </div>
      {/* 모바일 풀스크린 모달 */}
      {isMobile && open && filtered.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="airport-search-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false)
              inputRef.current?.blur()
            }
          }}
        >
          <div
            ref={modalRef}
            className="flex h-full flex-col bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-700/50 p-4">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  inputRef.current?.blur()
                }}
                className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 id="airport-search-modal-title" className="flex-1 text-sm font-semibold text-slate-200">
                {ariaLabel || "공항 검색"}
              </h2>
            </div>
            <div className="flex-1 overflow-auto" role="listbox" id="airport-search-listbox">
              {dropdownContent}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
