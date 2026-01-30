/** 지역별 전략 (아시아, 유럽, 미국, 중동) */
export type StrategyByRegion = {
  아시아?: string
  유럽?: string
  미국?: string
  중동?: string
}

/** 공식 전환 비율: ratio = MR당 1마일/1포인트로 쓰이는 MR량 (miles = mr / ratio) */
export const PARTNER_DATA = [
  // 항공 파트너
  {
    id: "cathay",
    name: "캐세이 (아시아 마일즈)",
    ratio: 1 / 1,
    category: "항공" as const,
    val: 25,
    strategy: "원월드 멀티캐리어·JAL/캐세이 단거리·미서부·카타르 발권",
    strategyByRegion: { 아시아: "JAL/캐세이 단거리 효율", 유럽: "원월드 멀티캐리어 조합", 미국: "미 서부 노선", 중동: "카타르 파트너 발권" },
  },
  {
    id: "flyingblue",
    name: "플라잉 블루 (Flying Blue Miles)",
    ratio: 1 / 1,
    category: "항공" as const,
    val: 22,
    strategy: "스카이팀·Promo Rewards·대서양 횡단·AF/KLM 경유",
    strategyByRegion: { 아시아: "스카이팀 파트너", 유럽: "Promo Rewards 할인 필수", 미국: "대서양 횡단 노선", 중동: "AF/KLM 경유편" },
  },
  {
    id: "finnair",
    name: "Finnair Plus (Avios)",
    ratio: 1 / 1,
    category: "항공" as const,
    val: 30,
    strategy: "JAL 일본 최저가·헬싱키 허브·원월드·카타르 Qsuite",
    strategyByRegion: { 아시아: "JAL 일본 노선 최저가", 유럽: "헬싱키 허브 직항", 미국: "원월드 파트너 연동", 중동: "카타르 Qsuite 핵심 경로" },
  },
  { id: "airasia", name: "AirAsia rewards (BIG 포인트)", ratio: 1 / 1, category: "항공" as const, val: 12, strategy: "동남아 단거리 노선용" },
  {
    id: "delta",
    name: "델타 스카이마일스®",
    ratio: 1300 / 1000,
    category: "항공" as const,
    val: 15,
    strategy: "유효기간 없는 스카이팀 마일리지 확보",
    strategyByRegion: { 아시아: "대한항공 유증 없는 발권", 유럽: "버진 애틀랜틱 연동", 미국: "델타 직항 및 허브", 중동: "스카이팀 파트너" },
  },
  {
    id: "singapore",
    name: "싱가포르 항공 크리스플라이어",
    ratio: 1300 / 1000,
    category: "항공" as const,
    val: 20,
    strategy: "동남아/미주 프리미엄 캐빈",
    strategyByRegion: { 아시아: "동남아 프리미엄 캐빈", 유럽: "자사 비즈니스석 확보", 미국: "최장거리 노선 독점", 중동: "싱가포르 경유 노선" },
  },
  { id: "vietnam", name: "베트남 항공 로터스마일즈", ratio: 1300 / 1000, category: "항공" as const, val: 15, strategy: "동남아 노선 스카이팀 활용" },
  { id: "koreanair", name: "대한항공 (SKYPASS)", ratio: 1500 / 1000, category: "항공" as const, val: 18, strategy: "국내 거주자에게 가장 범용적이나 차감율 확인 필요" },
  { id: "eva", name: "에바 항공 인피니티 마일리지랜드", ratio: 1500 / 1000, category: "항공" as const, val: 18, strategy: "대만 경유 및 스타얼라이언스 활용" },
  { id: "turkish", name: "터키항공 Miles&Smiles", ratio: 1500 / 1000, category: "항공" as const, val: 20, strategy: "스타얼라이언스 유럽 노선" },
  { id: "etihad", name: "에티하드 게스트", ratio: 1500 / 1000, category: "항공" as const, val: 20, strategy: "중동 경유 유럽/미주" },
  { id: "hainan", name: "하이난 항공 포츈 윙스 클럽", ratio: 1500 / 1000, category: "항공" as const, val: 12, strategy: "중국 노선" },
  { id: "aeroplan", name: "에어로플랜 (에어캐나다)", ratio: 1000 / 500, category: "항공" as const, val: 20, strategy: "스타얼라이언스 효율적 발권" },
  { id: "qatar", name: "카타르항공 프리빌리지 클럽 (Avios)", ratio: 1000 / 500, category: "항공" as const, val: 30, strategy: "핀에어 대비 효율 낮음(핀에어 우선 고려)" },
  { id: "united", name: "유나이티드 마일리지플러스®", ratio: 1000 / 500, category: "항공" as const, val: 18, strategy: "스타얼라이언스 활용" },
  { id: "jal", name: "JAL 마일리지 뱅크", ratio: 1000 / 500, category: "항공" as const, val: 35, strategy: "직전환 시 효율은 낮으나 JAL 좌석 가용성 최고" },

  // 호텔 파트너
  { id: "hilton", name: "Hilton Honors Points", ratio: 1000 / 2000, category: "호텔" as const, val: 7, strategy: "5연박 시 1박 무료 혜택 시 가치 극대화" },
  { id: "marriott", name: "Marriott Bonvoy™", ratio: 1 / 1, category: "호텔" as const, val: 10, strategy: "글로벌 체인 범용성 최고" },
  { id: "ihg", name: "IHG One Rewards", ratio: 1 / 1, category: "호텔" as const, val: 8, strategy: "인터컨티넨탈 등 체인 활용" },
  { id: "all", name: "ALL Loyalty programme (아코르)", ratio: 1050 / 300, category: "호텔" as const, val: 25, strategy: "유럽/동남아 아코르 계열 호텔" },
  { id: "wyndham", name: "Wyndham Rewards", ratio: 1000 / 400, category: "호텔" as const, val: 12, strategy: "저가형 숙소/리조트" },
] as const

export type Partner = (typeof PARTNER_DATA)[number]
export type CategoryFilter = "전체" | "항공" | "호텔"

/** 파트너별 마일리지/포인트 예약·조회 페이지 */
export const PARTNER_BOOKING_URLS: Record<string, string> = {
  cathay: "https://www.asiamiles.com/",
  flyingblue: "https://www.flyingblue.com/",
  finnair: "https://www.finnair.com/",
  airasia: "https://www.airasia.com/",
  delta: "https://www.delta.com/",
  singapore: "https://www.singaporeair.com/",
  vietnam: "https://www.vietnamairlines.com/",
  koreanair: "https://www.koreanair.com/",
  eva: "https://www.evaair.com/",
  turkish: "https://www.turkishairlines.com/",
  etihad: "https://www.etihadguest.com/",
  hainan: "https://www.hainanairlines.com/",
  aeroplan: "https://www.aircanada.com/aeroplan/",
  qatar: "https://www.qatarairways.com/",
  united: "https://www.united.com/",
  jal: "https://www.jal.co.jp/",
  hilton: "https://www.hilton.com/",
  marriott: "https://www.marriott.com/",
  ihg: "https://www.ihg.com/",
  all: "https://all.accor.com/",
  wyndham: "https://www.wyndhamrewards.com/",
}

/** 상품권 기준 KRW/MR (110만 MR = 770만원) */
export const GIFT_KRW_PER_MR = 7

export function getMilesFromMR(mr: number, ratio: number): number {
  return mr / ratio
}

export function getCashValue(miles: number, valuation: number): number {
  return miles * valuation
}

export function getGiftValue(mr: number): number {
  return mr * GIFT_KRW_PER_MR
}

/** 전환비율 표시용 (예: 1:1, 1.5:1, 1:1.3) */
export function formatRatio(ratio: number): string {
  if (Math.abs(ratio - 1) < 0.01) return "1:1"
  if (ratio >= 1) return `${ratio}:1`
  const inv = 1 / ratio
  return inv === Math.round(inv) ? `1:${inv}` : `1:${inv.toFixed(2)}`
}
