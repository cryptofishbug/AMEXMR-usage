import { useState, useMemo, useEffect } from "react"
import { Plane, Hotel, Info, ChevronUp, ChevronDown, ExternalLink, Ticket } from "lucide-react"
import {
  PARTNER_DATA,
  PARTNER_BOOKING_URLS,
  getMilesFromMR,
  getCashValue,
  getGiftValue,
  formatRatio,
  type Partner,
  type CategoryFilter,
  type StrategyByRegion,
} from "./data/mrData"
import type { AirportData } from "./data/airports"
import { AIRPORTS, loadFullAirports, findAirportByIata, getIataForUrl } from "./data/airports"
import { AirportSearch } from "./components/AirportSearch"
import { AirportMap } from "./components/AirportMap"

const GRAYPANE_SITE = "https://www.graypane.com"
/** GrayPane 자체 배포 시 base만 바꾸면 됨 (예: clone 후 Vercel 배포) */
const GRAYPANE_EMBED_BASE = GRAYPANE_SITE

/** GrayPane 검색 URL: origin, destination, selectedDate, dateFrom, dateTo, searchWindowDays (편도 조회) */
function buildGrayPaneSearchUrl(p: SearchParams): string {
  const origin = getIataForUrl(p.from)
  const destination = getIataForUrl(p.to)
  const dateFrom = toValidDateStr(p.dateFrom, DEFAULT_DEPART_DATE)
  const dateTo = toValidDateStr(p.dateTo, (() => {
    const d = new Date(dateFrom)
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })())
  const searchWindowDays = Math.min(30, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (24 * 60 * 60 * 1000)) || 30)
  const params = new URLSearchParams({
    origin,
    destination,
    selectedDate: dateFrom,
    dateFrom,
    dateTo,
    searchWindowDays: String(searchWindowDays),
  })
  return `${GRAYPANE_EMBED_BASE.replace(/\/$/, "")}/search?${params.toString()}`
}
const AWARDHACKER_BASE = "https://www.awardhacker.com"
const POINTSYEAH_AIRLINE =
  "AR%2CAM%2CAC%2CKL%2CAS%2CAA%2CAV%2CDL%2CEK%2CEY%2CAY%2CB6%2CQF%2CSQ%2CTK%2CVS"
const AWARDTOOL_PROGRAMS =
  "AC-AY-AY-CX-CM-CX-DL-EK-EY-G3-IB-B6-KL-LH-QF-SK-NK-QR-SQ-TP-TK-UA-VA-VS-BA-AV-AS-AA-AM"

/** 티켓 조회 툴에 넘기는 공통 검색 조건 (GrayPane 검색 UX와 동일 필드) */
type SearchParams = {
  from: string
  to: string
  dateFrom: string
  dateTo: string
  routeType: "oneway" | "roundtrip"
  cabin: "economy" | "premium" | "business" | "first"
  stops: 0 | 1 | 2
}

/** 기본 출발일(YYYY-MM-DD). 툴별 날짜 파라미터에 사용 */
const DEFAULT_DEPART_DATE = "2026-03-19"

/** 빈 값·Invalid Date 방지용. YYYY-MM-DD만 허용 */
function toValidDateStr(value: string, fallback: string): string {
  const v = (value || "").trim()
  if (!v) return fallback
  const t = new Date(v).getTime()
  if (Number.isNaN(t)) return fallback
  return v.slice(0, 10)
}

/** AwardHacker: f=출발, t=도착, o=편도(0)/왕복(1), c=캐빈, s=경유(0/1/2), p=프로그램, a=mr 고정 */
function buildAwardHackerUrl(p: SearchParams): string {
  const f = getIataForUrl(p.from)
  const t = getIataForUrl(p.to)
  const o = p.routeType === "roundtrip" ? 1 : 0
  const cMap = { economy: "y", premium: "w", business: "c", first: "f" } as const
  const c = cMap[p.cabin]
  return `${AWARDHACKER_BASE}/#f=${f}&t=${t}&o=${o}&c=${c}&s=${p.stops}&p=1&a=mr`
}

/** PointsYeah: tripType(1=편도 2=왕복). 편도=departDate/departDateSec. 왕복=departDate/departDateSec(출발일) + returnDate/returnDateSec(귀환일) */
function buildPointsYeahUrl(p: SearchParams): string {
  const dep = getIataForUrl(p.from)
  const arr = getIataForUrl(p.to)
  const tripType = p.routeType === "roundtrip" ? 2 : 1
  const departDate = toValidDateStr(p.dateFrom, DEFAULT_DEPART_DATE)
  const returnDate = toValidDateStr(p.dateTo, departDate)
  const params = new URLSearchParams({
    cabins: "",
    banks: "Amex",
    airlineProgram: POINTSYEAH_AIRLINE,
    tripType: String(tripType),
    adults: "1",
    children: "0",
    departure: dep,
    arrival: arr,
    departDate,
    departDateSec: departDate,
    multiday: "false",
  })
  if (tripType === 2) {
    params.set("returnDate", returnDate)
    params.set("returnDateSec", returnDate)
  }
  return `https://www.pointsyeah.com/search?${params.toString()}`
}

/** AwardTool: from, to, flightWay=oneway|roundtrip, cabins; 편도=oneWayRange*, 왕복=roundTripDepartureDate/roundTripReturnDate */
function buildAwardToolUrl(p: SearchParams): string {
  const from = getIataForUrl(p.from)
  const to = getIataForUrl(p.to)
  const flightWay = p.routeType === "oneway" ? "oneway" : "roundtrip"
  const cabins = "Economy%26Premium+Economy%26Business%26First"
  const dateFrom = toValidDateStr(p.dateFrom, DEFAULT_DEPART_DATE)
  const dateTo = toValidDateStr(p.dateTo, dateFrom)
  const unixFrom = Math.floor(new Date(dateFrom).getTime() / 1000)
  const unixTo = Math.floor(new Date(dateTo).getTime() / 1000)

  const params = new URLSearchParams({
    flightWay,
    pax: "1",
    children: "0",
    cabins,
    from,
    to,
    programs: AWARDTOOL_PROGRAMS,
    targetId: "",
  })
  if (flightWay === "roundtrip") {
    params.set("range", "false")
    params.set("rangeV2", "false")
    params.set("roundTripDepartureDate", String(unixFrom))
    params.set("roundTripReturnDate", String(unixTo))
  } else {
    params.set("range", "false")
    params.set("rangeV2", "false")
    params.set("oneWayRangeStartDate", String(unixFrom))
    params.set("oneWayRangeEndDate", String(unixTo))
  }
  return `https://www.awardtool.com/flight?${params.toString()}`
}

const ROAME_PROGRAMS = [
  "ANA", "AEROPLAN", "LIFEMILES", "SINGAPORE", "CATHAY", "BRITISH_AIRWAYS", "QATAR", "IBERIA",
  "DELTA", "EMIRATES", "FLYING_BLUE", "JETBLUE", "QANTAS", "VIRGIN_ATLANTIC", "CLUB_PREMIER", "SAS", "ETIHAD",
]

/** Roame: origin, destination, originId/destinationId(GMP=76835 HND=78285), departureDate, searchClass */
function buildRoameUrl(p: SearchParams): string {
  const origin = getIataForUrl(p.from)
  const destination = getIataForUrl(p.to)
  const cabinToClass: Record<SearchParams["cabin"], string> = {
    economy: "ECON",
    premium: "PREMECON",
    business: "BUSINESS",
    first: "FIRST",
  }
  const searchClass = cabinToClass[p.cabin]
  const params = new URLSearchParams()
  params.set("origin", origin)
  params.set("originType", "airport")
  params.set("destination", destination)
  params.set("destinationType", "airport")
  params.set("originId", "76835")
  params.set("destinationId", "78285")
  params.set("departureDate", toValidDateStr(p.dateFrom, DEFAULT_DEPART_DATE))
  params.set("endDepartureDate", toValidDateStr(p.dateTo, p.dateFrom || DEFAULT_DEPART_DATE))
  params.set("pax", "1")
  params.set("searchClass", searchClass)
  params.set("fareClasses", searchClass)
  params.set("isSkyview", "false")
  params.set("flexibleDates", "0")
  params.set("selectedCards", "amex")
  ROAME_PROGRAMS.forEach((pr) => params.append("selectedPrograms", pr))
  params.set("selectedAirlines", "")
  params.set("unselectedAirlines", "")
  params.set("selectedAirports", "")
  params.set("unselectedAirports", "")
  params.set("selectedAircrafts", "")
  params.set("unselectedAircrafts", "")
  params.set("maxStops", String(Math.min(p.stops + 1, 3)))
  params.set("minPremiumPercent", "0")
  params.set("maxPoints", "300000")
  params.set("maxSurcharge", "800")
  params.set("cachebust", String(Date.now()))
  return `https://roame.travel/search?${params.toString()}`
}

type ToolConfig = {
  id: string
  name: string
  description: string
  buildUrl: (p: SearchParams) => string
}

const AWARD_TOOLS: ToolConfig[] = [
  {
    id: "graypane",
    name: "GrayPane",
    description: "seats.aero 연동 어워드 좌석 검색·알림 (위 검색 조건 반영)",
    buildUrl: buildGrayPaneSearchUrl,
  },
  {
    id: "pointsyeah",
    name: "PointsYeah",
    description: "검색 속도 빠름, 무료에서도 MR·다양한 카드/항공 프로그램 한눈에 비교",
    buildUrl: buildPointsYeahUrl,
  },
  {
    id: "awardtool",
    name: "AwardTool",
    description: "마일리지 비교. Panorama 검색으로 유럽·동남아 등 지역 단위, 최대 90일 좌석 한꺼번에",
    buildUrl: buildAwardToolUrl,
  },
  {
    id: "awardhacker",
    name: "AwardHacker",
    description: "경로별 소요 MR/마일 비교, 어워드 최저가 검색",
    buildUrl: buildAwardHackerUrl,
  },
  {
    id: "roame",
    name: "Roame.travel",
    description: "구글 플라이트형 UI, 스카이팀·원월드 강점, SkyView로 지역별 가용성 시각화. 왕복 선택 시에도 편도 결과만 제공됨",
    buildUrl: buildRoameUrl,
  },
]

const DEFAULT_MR = 1_100_000
const BG_NAVY = "#0A0E17"
const TEXT_PRIMARY = "#E2E8F0"

function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n)
}

function formatKRW(n: number): string {
  return `${formatNumber(Math.round(n))}원`
}

type BadgeType = "best" | "versatile" | "qatar_tip" | null

function getBadge(partner: Partner): { label: string; type: BadgeType; tooltip?: string } | null {
  if (partner.id === "finnair" || partner.id === "cathay")
    return { label: "Best", type: "best" }
  if (partner.id === "koreanair")
    return { label: "범용성 좋음", type: "versatile", tooltip: "한국 현대카드만의 1.5:1 직항(대한항공) 활용" }
  if (partner.id === "qatar")
    return { label: "핀에어 우회 권장", type: "qatar_tip", tooltip: "같은 Avios인데 핀에어는 1:1, 카타르는 2:1. JAL/BA 이용 시 무조건 핀에어로 전환하세요." }
  return null
}

type SortKey = "miles" | "cashValue" | null

type TabId = "mr" | "ticket"

const REGIONS: { key: keyof StrategyByRegion; label: string; badgeClass: string }[] = [
  { key: "아시아", label: "아시아", badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { key: "유럽", label: "유럽", badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  { key: "미국", label: "미국", badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { key: "중동", label: "중동", badgeClass: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
]

export default function App() {
  const [mr, setMr] = useState(DEFAULT_MR)
  const [activeTab, setActiveTab] = useState<TabId>("mr")
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("전체")
  const [sortBy, setSortBy] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [hoveredStrategy, setHoveredStrategy] = useState<{ partnerId: string; regionKey: keyof StrategyByRegion } | null>(null)
  const [awardFrom, setAwardFrom] = useState("GMP")
  const [awardTo, setAwardTo] = useState("HND")
  const [dateFrom, setDateFrom] = useState(DEFAULT_DEPART_DATE)
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(DEFAULT_DEPART_DATE)
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [routeType, setRouteType] = useState<SearchParams["routeType"]>("oneway")
  const [cabin, setCabin] = useState<SearchParams["cabin"]>("business")
  const [stops, setStops] = useState<SearchParams["stops"]>(0)
  const [airports, setAirports] = useState<AirportData[]>(AIRPORTS)

  useEffect(() => {
    loadFullAirports().then(setAirports)
  }, [])

  const searchParams: SearchParams = useMemo(
    () => ({
      from: awardFrom,
      to: awardTo,
      dateFrom,
      dateTo,
      routeType,
      cabin,
      stops,
    }),
    [awardFrom, awardTo, dateFrom, dateTo, routeType, cabin, stops]
  )

  const goToTicketTab = (partner: Partner) => {
    setSelectedPartner(partner)
    setActiveTab("ticket")
  }

  const giftValue = useMemo(() => getGiftValue(mr), [mr])

  const filteredPartners = useMemo(() => {
    if (categoryFilter === "전체") return [...PARTNER_DATA]
    return PARTNER_DATA.filter((p) => p.category === categoryFilter)
  }, [categoryFilter])

  const rows = useMemo(() => {
    const list = filteredPartners.map((p) => {
      const miles = getMilesFromMR(mr, p.ratio)
      const cashValue = getCashValue(miles, p.val)
      const badge = getBadge(p)
      return { partner: p, miles, cashValue, badge }
    })
    if (!sortBy) return list
    return [...list].sort((a, b) => {
      const va = sortBy === "miles" ? a.miles : a.cashValue
      const vb = sortBy === "miles" ? b.miles : b.cashValue
      return sortDir === "desc" ? vb - va : va - vb
    })
  }, [mr, filteredPartners, sortBy, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    else {
      setSortBy(key)
      setSortDir("desc")
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_NAVY }}>
      {/* 헤더 + MR 입력 (고급 스타일) */}
      <header className="sticky top-0 z-20 border-b border-slate-700/40" style={{ backgroundColor: BG_NAVY }}>
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xs font-medium uppercase tracking-widest text-slate-500">
                현대카드 아멕스 플래티넘
              </h1>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight" style={{ color: TEXT_PRIMARY }}>
                MR 파트너사별 전환 효율
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-500">보유 MR</label>
              <input
                type="text"
                inputMode="numeric"
                value={mr === 0 ? "" : formatNumber(mr)}
                placeholder="1,100,000"
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "")
                  if (raw === "") setMr(0)
                  else {
                    const n = parseInt(raw, 10)
                    if (!isNaN(n) && n >= 0) setMr(n)
                  }
                }}
                className="w-44 rounded-xl border border-slate-600/80 bg-slate-800/60 px-4 py-3 text-right text-lg font-semibold tabular-nums shadow-inner transition-all placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                style={{ color: TEXT_PRIMARY }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 탭: MR 전환 효율 | 티켓 조회 */}
      <section className="border-b border-slate-700/30 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-4 py-2">
          <div className="flex gap-1 rounded-lg border border-slate-600/60 bg-slate-800/40 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("mr")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "mr"
                  ? "bg-slate-600 text-white"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
              }`}
            >
              MR 전환 효율
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ticket")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "ticket"
                  ? "bg-slate-600 text-white"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
              }`}
            >
              <Ticket className="h-4 w-4" />
              티켓 조회
            </button>
          </div>
        </div>
      </section>

      {activeTab === "mr" && (
        <>
      {/* 필터 */}
      <section className="border-b border-slate-700/30 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">카테고리</span>
            <div className="flex overflow-hidden rounded-lg border border-slate-600/60 bg-slate-800/50">
              {(["전체", "항공", "호텔"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-slate-600 text-white"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                  }`}
                >
                  {cat === "항공" && <Plane className="h-3.5 w-3.5" />}
                  {cat === "호텔" && <Hotel className="h-3.5 w-3.5" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 테이블 */}
      <main className="mx-auto max-w-5xl px-4 py-4">
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/30">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-800/95 text-left text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                  <th className="w-12 py-4 pl-4 pr-2 align-middle"></th>
                  <th className="min-w-[180px] py-4 pl-2 pr-4 align-middle">파트너</th>
                  <th className="shrink-0 min-w-[4.5rem] py-4 px-3 align-middle whitespace-nowrap">카테고리</th>
                  <th className="whitespace-nowrap py-4 px-3 text-right align-middle">전환비율</th>
                  <th
                    className="cursor-pointer whitespace-nowrap py-4 px-3 text-right align-middle transition-colors hover:text-sky-300"
                    onClick={() => handleSort("miles")}
                  >
                    <span className="inline-flex items-center gap-1">
                      전환 마일/pts
                      {sortBy === "miles" && (sortDir === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
                    </span>
                  </th>
                  <th
                    className="cursor-pointer whitespace-nowrap py-4 px-3 text-right align-middle transition-colors hover:text-sky-300"
                    onClick={() => handleSort("cashValue")}
                  >
                    <span className="inline-flex items-center gap-1">
                      예상 현금가치
                      {sortBy === "cashValue" && (sortDir === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
                    </span>
                  </th>
                  <th className="py-4 pl-3 pr-4 align-middle">비고</th>
                  <th className="min-w-[140px] py-4 pl-4 pr-4 align-middle">전략</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ partner, miles, cashValue, badge }) => {
                  const isAboveGift = cashValue > giftValue
                  return (
                    <tr
                      key={partner.id}
                      className="border-b border-slate-700/30 transition-colors hover:bg-sky-500/5"
                      style={{ borderBottomColor: "rgba(148, 163, 184, 0.08)" }}
                    >
                      <td className="align-middle py-4 pl-4 pr-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-700/50 text-slate-400">
                          {partner.category === "호텔" ? (
                            <Hotel className="h-5 w-5" />
                          ) : (
                            <Plane className="h-5 w-5" />
                          )}
                        </div>
                      </td>
                      <td
                        className="cursor-pointer align-middle py-4 pl-2 pr-4 transition-colors hover:bg-sky-500/10"
                        onClick={() => goToTicketTab(partner)}
                        role="gridcell"
                      >
                        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0">
                          {partner.name.includes(" (") ? (
                            <>
                              <span className="text-xs font-medium" style={{ color: TEXT_PRIMARY }}>
                                {partner.name.split(" (")[0]}
                              </span>
                              <span className="shrink-0 whitespace-nowrap text-[10px] text-slate-500">
                                ({partner.name.split(" (")[1].replace(/\)$/, "")})
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-medium" style={{ color: TEXT_PRIMARY }}>
                              {partner.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="shrink-0 align-middle py-4 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            partner.category === "항공"
                              ? "bg-sky-500/20 text-sky-300"
                              : "bg-violet-500/20 text-violet-300"
                          }`}
                        >
                          {partner.category}
                        </span>
                      </td>
                      <td className="align-middle py-4 px-3 text-right tabular-nums text-slate-300">
                        {formatRatio(partner.ratio)}
                      </td>
                      <td className="whitespace-nowrap py-4 px-3 text-right tabular-nums text-[11px] text-slate-300">
                        <span className="animate-value-change">
                          {partner.category === "호텔"
                            ? `${formatNumber(miles)} pts`
                            : `${formatNumber(miles)} 마일`}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-3 text-right tabular-nums text-[11px]">
                        <span
                          className={`animate-value-change font-bold ${
                            isAboveGift ? "text-emerald-400" : "text-slate-200"
                          }`}
                        >
                          {formatKRW(cashValue)}
                        </span>
                      </td>
                      <td className="align-middle py-4 pl-3 pr-4">
                        {badge ? (
                          <span
                            title={badge.tooltip}
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                              badge.type === "best"
                                ? "bg-emerald-500/25 text-emerald-400"
                                : badge.type === "versatile"
                                  ? "bg-sky-500/20 text-sky-400"
                                  : badge.type === "qatar_tip"
                                    ? "bg-amber-500/25 text-amber-400"
                                    : ""
                            }`}
                          >
                            {badge.label}
                            {badge.tooltip && (
                              <Info className="h-3.5 w-3.5 shrink-0 cursor-help opacity-80" />
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="relative align-middle py-4 pl-4 pr-4">
                        {"strategyByRegion" in partner && partner.strategyByRegion ? (
                          <div className="flex flex-wrap gap-1.5">
                            {REGIONS.filter((r) => partner.strategyByRegion?.[r.key]).map((r, idx, arr) => {
                              const isHovered = hoveredStrategy?.partnerId === partner.id && hoveredStrategy?.regionKey === r.key
                              const isLastBadge = idx === arr.length - 1
                              return (
                                <span
                                  key={r.key}
                                  className={`relative inline-flex shrink-0 cursor-default rounded border px-2 py-0.5 text-[10px] font-medium ${r.badgeClass}`}
                                  onMouseEnter={() => setHoveredStrategy({ partnerId: partner.id, regionKey: r.key })}
                                  onMouseLeave={() => setHoveredStrategy(null)}
                                >
                                  {r.label}
                                  {isHovered && (
                                    <div
                                      className={`absolute top-full z-50 mt-1 w-max max-w-[240px] rounded border border-slate-600 bg-slate-800 px-2 py-1 shadow-lg ${isLastBadge ? "right-0" : "left-0"}`}
                                      role="tooltip"
                                    >
                                      <span className="text-[11px] leading-snug text-slate-300">
                                        {partner.strategyByRegion![r.key]}
                                      </span>
                                    </div>
                                  )}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="max-w-[280px]">
                            <p className="min-h-0 break-keep text-[11px] leading-relaxed text-slate-500">
                              {partner.strategy}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          전환비율은 MR당 마일/포인트 산출 기준입니다. 헤더 클릭 시 정렬됩니다. 파트너 이름 클릭 시 티켓 조회 탭으로 이동합니다. 지역별 전략(아시아·유럽·미국·중동) 뱃지는 호버 시 상세 내용을 표시합니다.
        </p>
      </main>
        </>
      )}

      {activeTab === "ticket" && (
        <main className="mx-auto max-w-5xl px-4 py-6">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
            티켓 · 예약 조회
          </h2>

          {selectedPartner && (
            <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
              <p className="mb-2 text-xs text-slate-500">선택한 파트너</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium" style={{ color: TEXT_PRIMARY }}>
                  {selectedPartner.name}
                </p>
                {PARTNER_BOOKING_URLS[selectedPartner.id] && (
                  <a
                    href={PARTNER_BOOKING_URLS[selectedPartner.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-slate-600"
                  >
                    예약/조회 페이지
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 검색 조건: Apple 지도 + 공항 자동완성 (GrayPane 참고) */}
          <div className="mb-6 rounded-xl border border-slate-600/60 bg-slate-800/50 p-5 shadow-inner">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
              검색 조건 · 아래 툴 링크에 반영
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">Origin</label>
                <AirportSearch
                  airports={airports}
                  value={awardFrom}
                  onChange={setAwardFrom}
                  onSelect={(a) => setAwardFrom(a?.iata ?? "")}
                  placeholder="GMP 또는 공항명 검색"
                  aria-label="출발 공항"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">Destination</label>
                <AirportSearch
                  airports={airports}
                  value={awardTo}
                  onChange={setAwardTo}
                  onSelect={(a) => setAwardTo(a?.iata ?? "")}
                  placeholder="HND 또는 공항명 검색"
                  aria-label="도착 공항"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">Date from</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">Date to</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Stops</span>
                {([0, 1, 2] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStops(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      stops === s
                        ? "border-sky-500/50 bg-sky-500/20 text-sky-300"
                        : "border-slate-600/60 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                    }`}
                  >
                    {s === 0 ? "직항" : `${s}경유`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Route</span>
                {(["oneway", "roundtrip"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRouteType(r)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      routeType === r
                        ? "border-sky-500/50 bg-sky-500/20 text-sky-300"
                        : "border-slate-600/60 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                    }`}
                  >
                    {r === "oneway" ? "편도" : "왕복"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Cabin</span>
                {(
                  [
                    { v: "economy" as const, label: "Economy" },
                    { v: "premium" as const, label: "Premium Economy" },
                    { v: "business" as const, label: "Business" },
                    { v: "first" as const, label: "First" },
                  ] as const
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCabin(v)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      cabin === v
                        ? "border-sky-500/50 bg-sky-500/20 text-sky-300"
                        : "border-slate-600/60 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Apple 지도: 출발/도착 선택 시 노선 표시 (GrayPane airport-map 참고) */}
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-medium text-slate-500">지도</p>
              <AirportMap
                originAirport={findAirportByIata(awardFrom, airports) ?? null}
                destinationAirport={findAirportByIata(awardTo, airports) ?? null}
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
              <Ticket className="h-4 w-4 text-slate-400" />
              기타 툴 (바로가기)
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              위 검색 조건이 각 툴 링크에 반영됩니다.
            </p>
            <div className="space-y-2">
              {AWARD_TOOLS.map((tool) => (
                <div
                  key={tool.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{tool.name}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{tool.description}</p>
                  </div>
                  <a
                    href={tool.buildUrl(searchParams)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-600/80 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-600"
                  >
                    바로 열기
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/40 bg-slate-900/30">
            <p className="border-b border-slate-700/40 px-4 py-3 text-xs font-medium text-slate-500">
              파트너별 예약/조회 페이지
            </p>
            <ul className="divide-y divide-slate-700/30">
              {PARTNER_DATA.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm" style={{ color: TEXT_PRIMARY }}>
                    {p.name}
                  </span>
                  {PARTNER_BOOKING_URLS[p.id] ? (
                    <a
                      href={PARTNER_BOOKING_URLS[p.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:underline"
                    >
                      열기
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </main>
      )}

      <footer className="border-t border-slate-700/30 py-3 text-center text-xs text-slate-500">
        MR 파트너사별 전환 효율 대시보드 · 현대카드 아멕스 플래티넘
      </footer>
    </div>
  )
}
