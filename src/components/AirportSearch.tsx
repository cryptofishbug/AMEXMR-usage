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
  const modalInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

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
      // 모바일 바텀시트가 열려있는 동안에는 닫지 않음 (빈 value일 때만 닫음)
      if (!isMobile || !open) {
        setOpen(false)
      }
      return
    }

    const results = searchAirports(v, 10, airports)
    setFiltered(results)

    // Only open the dropdown when the input is actually focused.
    // Otherwise, switching tabs with prefilled values can cause the menu to pop
    // under the cursor and look like items are "hovered"/preselected.
    // 모바일에서는 modalInputRef도 포커스된 요소로 인정
    const isFocused =
      document.activeElement === inputRef.current ||
      document.activeElement === modalInputRef.current

    // 모바일 바텀시트가 이미 열려있는 경우 유지 (value 변경 시에도 닫히지 않음)
    const shouldKeepOpen = (open && isMobile) || isFocused
    setOpen(shouldKeepOpen && results.length > 0)
  }, [value, airports, isMobile, open])

  // 모바일 모달: 포커스 트랩, ESC 닫기, body 스크롤 잠금, 배경 inert 처리
  useEffect(() => {
    if (!open || !isMobile) return

    // iOS Safari 스크롤 락: position:fixed 대신 CSS 클래스 토글 (레이아웃 점프 방지)
    const scrollY = window.scrollY
    document.documentElement.classList.add("scroll-locked")
    // modal-open 클래스 추가: #app에 pointer-events:none 적용 (CSS에서)
    document.documentElement.classList.add("modal-open")

    // #app에 inert 속성 추가 (배경 터치/포커스 차단)
    const appRoot = document.getElementById("app")
    if (appRoot) {
      appRoot.setAttribute("inert", "")
      appRoot.setAttribute("aria-hidden", "true")
    }

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

    // iOS Safari: 바텀시트 밖 터치 스크롤 방지
    const handleTouchMove = (e: TouchEvent) => {
      // 모달 내부 스크롤 영역이면 허용
      const target = e.target as HTMLElement
      const scrollableArea = modalRef.current?.querySelector(".bottom-sheet-scroll")
      if (scrollableArea?.contains(target)) {
        return // 내부 스크롤 허용
      }
      e.preventDefault()
    }

    // iOS Safari: 배경 date input 캘린더 튐 방지 - capture 단계에서 차단
    const handleBackgroundInteraction = (e: Event) => {
      // 모달 내부 이벤트는 허용
      if (modalRef.current?.contains(e.target as Node)) {
        return
      }
      // 배경 이벤트 완전 차단
      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleFocusTrap)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    // capture 단계에서 touchstart/mousedown 차단 (캘린더 튐 방지)
    document.addEventListener("touchstart", handleBackgroundInteraction, { capture: true, passive: false })
    document.addEventListener("mousedown", handleBackgroundInteraction, { capture: true })
    // 모달 내부 검색 input에 포커스 (키보드 유지)
    setTimeout(() => modalInputRef.current?.focus(), 50)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleFocusTrap)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchstart", handleBackgroundInteraction, { capture: true })
      document.removeEventListener("mousedown", handleBackgroundInteraction, { capture: true })

      // CSS 클래스 기반 스크롤 락 해제
      document.documentElement.classList.remove("scroll-locked")
      document.documentElement.classList.remove("modal-open")
      // 원래 스크롤 위치로 복원 (점프 없이)
      window.scrollTo(0, scrollY)

      // inert 속성 제거
      if (appRoot) {
        appRoot.removeAttribute("inert")
        appRoot.removeAttribute("aria-hidden")
      }
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
        {filtered.map((airport) => (
          <li key={airport.id} role="option">
            <button
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
      <div ref={containerRef} className={`relative z-10 no-zoom ${className}`}>
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
            className="w-full min-h-[44px] rounded-lg border border-slate-600/60 bg-slate-900/60 py-2.5 pl-10 pr-10 text-base sm:text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
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
      {/* 모바일 바텀시트 */}
      {isMobile && open && filtered.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          className="bottom-sheet-overlay z-[100] bg-black/60 backdrop-blur-sm"
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
            className="bottom-sheet-container fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-600" aria-hidden="true" />
            </div>
            {/* 헤더: 타이틀 + 닫기 */}
            <div className="flex items-center justify-between px-4 pb-2">
              <h2 id="airport-search-modal-title" className="text-base font-semibold text-slate-200">
                공항 검색
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  inputRef.current?.blur()
                }}
                className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* 검색 input */}
            <div className="px-4 pb-3 no-zoom">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  ref={modalInputRef}
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    // 바텀시트가 열려있는 상태에서 포커스 유지
                    if (filtered.length > 0) {
                      setOpen(true)
                    }
                  }}
                  onBlur={() => {
                    // 모달 내 다른 요소(버튼 등)로 포커스가 이동하는 경우 닫지 않음
                    setTimeout(() => {
                      if (!modalRef.current?.contains(document.activeElement)) {
                        setOpen(false)
                      }
                    }, 200)
                  }}
                  placeholder={placeholder}
                  aria-label={ariaLabel || "공항 검색"}
                  className="w-full min-h-[44px] rounded-lg border border-slate-600/60 bg-slate-800/80 py-2.5 pl-10 pr-10 text-base text-slate-200 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                />
                {value && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] rounded p-1 text-slate-500 hover:bg-slate-700/50 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
                    aria-label="입력값 지우기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {/* 결과 리스트 (스크롤 가능) */}
            <div className="bottom-sheet-scroll flex-1 border-t border-slate-700/50" role="listbox" id="airport-search-listbox">
              {dropdownContent}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
