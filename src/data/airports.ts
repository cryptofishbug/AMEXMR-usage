/**
 * 공항 데이터 (자동완성·지도용). GrayPane AirportData 형식과 호환
 */
export interface AirportData {
  id: string
  name: string
  iata: string
  icao: string
  city: string
  country: string
  latitude: number
  longitude: number
}

/** 소량 기본 목록 (즉시 표시·폴백). 전체 목록은 loadFullAirports()로 지연 로드 */
export const AIRPORTS: AirportData[] = [
  { id: "GMP", name: "Gimpo International Airport", iata: "GMP", icao: "RKSS", city: "Seoul", country: "South Korea", latitude: 37.5583, longitude: 126.7906 },
  { id: "ICN", name: "Incheon International Airport", iata: "ICN", icao: "RKSI", city: "Seoul", country: "South Korea", latitude: 37.4602, longitude: 126.4407 },
  { id: "HND", name: "Tokyo Haneda Airport", iata: "HND", icao: "RJTT", city: "Tokyo", country: "Japan", latitude: 35.5494, longitude: 139.7798 },
  { id: "NRT", name: "Narita International Airport", iata: "NRT", icao: "RJAA", city: "Tokyo", country: "Japan", latitude: 35.7720, longitude: 140.3929 },
  { id: "KIX", name: "Kansai International Airport", iata: "KIX", icao: "RJBB", city: "Osaka", country: "Japan", latitude: 34.4347, longitude: 135.2441 },
  { id: "LAX", name: "Los Angeles International Airport", iata: "LAX", icao: "KLAX", city: "Los Angeles", country: "United States", latitude: 33.9425, longitude: -118.4081 },
  { id: "JFK", name: "John F. Kennedy International Airport", iata: "JFK", icao: "KJFK", city: "New York", country: "United States", latitude: 40.6398, longitude: -73.7787 },
  { id: "LHR", name: "London Heathrow Airport", iata: "LHR", icao: "EGLL", city: "London", country: "United Kingdom", latitude: 51.4700, longitude: -0.4543 },
  { id: "CDG", name: "Charles de Gaulle Airport", iata: "CDG", icao: "LFPG", city: "Paris", country: "France", latitude: 49.0097, longitude: 2.5478 },
  { id: "SIN", name: "Singapore Changi Airport", iata: "SIN", icao: "WSSS", city: "Singapore", country: "Singapore", latitude: 1.3644, longitude: 103.9915 },
  { id: "HKG", name: "Hong Kong International Airport", iata: "HKG", icao: "VHHH", city: "Hong Kong", country: "Hong Kong", latitude: 22.3080, longitude: 113.9185 },
  { id: "BKK", name: "Suvarnabhumi Airport", iata: "BKK", icao: "VTBS", city: "Bangkok", country: "Thailand", latitude: 13.6900, longitude: 100.7501 },
  { id: "DXB", name: "Dubai International Airport", iata: "DXB", icao: "OMDB", city: "Dubai", country: "United Arab Emirates", latitude: 25.2532, longitude: 55.3657 },
  { id: "FRA", name: "Frankfurt Airport", iata: "FRA", icao: "EDDF", city: "Frankfurt", country: "Germany", latitude: 50.0379, longitude: 8.5622 },
  { id: "AMS", name: "Amsterdam Airport Schiphol", iata: "AMS", icao: "EHAM", city: "Amsterdam", country: "Netherlands", latitude: 52.3105, longitude: 4.7683 },
  { id: "SFO", name: "San Francisco International Airport", iata: "SFO", icao: "KSFO", city: "San Francisco", country: "United States", latitude: 37.6213, longitude: -122.3790 },
  { id: "ORD", name: "O'Hare International Airport", iata: "ORD", icao: "KORD", city: "Chicago", country: "United States", latitude: 41.9742, longitude: -87.9073 },
  { id: "PVG", name: "Shanghai Pudong International Airport", iata: "PVG", icao: "ZSPD", city: "Shanghai", country: "China", latitude: 31.1434, longitude: 121.8052 },
  { id: "PEK", name: "Beijing Capital International Airport", iata: "PEK", icao: "ZBAA", city: "Beijing", country: "China", latitude: 40.0799, longitude: 116.6031 },
  { id: "SYD", name: "Sydney Kingsford Smith Airport", iata: "SYD", icao: "YSSY", city: "Sydney", country: "Australia", latitude: -33.9399, longitude: 151.1753 },
  { id: "MNL", name: "Ninoy Aquino International Airport", iata: "MNL", icao: "RPLL", city: "Manila", country: "Philippines", latitude: 14.5086, longitude: 121.0194 },
  { id: "SGN", name: "Tan Son Nhat International Airport", iata: "SGN", icao: "VVTS", city: "Ho Chi Minh City", country: "Vietnam", latitude: 10.8188, longitude: 106.6519 },
  { id: "HEL", name: "Helsinki Vantaa Airport", iata: "HEL", icao: "EFHK", city: "Helsinki", country: "Finland", latitude: 60.3172, longitude: 24.9633 },
  { id: "DOH", name: "Hamad International Airport", iata: "DOH", icao: "OTHH", city: "Doha", country: "Qatar", latitude: 25.2731, longitude: 51.6080 },
  { id: "AUH", name: "Abu Dhabi International Airport", iata: "AUH", icao: "OMAA", city: "Abu Dhabi", country: "United Arab Emirates", latitude: 24.4330, longitude: 54.6511 },
  { id: "LGW", name: "London Gatwick Airport", iata: "LGW", icao: "EGKK", city: "London", country: "United Kingdom", latitude: 51.1481, longitude: -0.1903 },
  { id: "MIA", name: "Miami International Airport", iata: "MIA", icao: "KMIA", city: "Miami", country: "United States", latitude: 25.7959, longitude: -80.2870 },
  { id: "SEA", name: "Seattle–Tacoma International Airport", iata: "SEA", icao: "KSEA", city: "Seattle", country: "United States", latitude: 47.4502, longitude: -122.3088 },
  { id: "YVR", name: "Vancouver International Airport", iata: "YVR", icao: "CYVR", city: "Vancouver", country: "Canada", latitude: 49.1967, longitude: -123.1815 },
  { id: "TPE", name: "Taiwan Taoyuan International Airport", iata: "TPE", icao: "RCTP", city: "Taipei", country: "Taiwan", latitude: 25.0797, longitude: 121.2342 },
  { id: "KUL", name: "Kuala Lumpur International Airport", iata: "KUL", icao: "WMKK", city: "Kuala Lumpur", country: "Malaysia", latitude: 2.7456, longitude: 101.7099 },
]

/** 전체 공항 목록 지연 로드 (airports.json → 별도 청크, 초기 번들에 미포함) */
let fullAirportsCache: AirportData[] | null = null

export function loadFullAirports(): Promise<AirportData[]> {
  if (fullAirportsCache) return Promise.resolve(fullAirportsCache)
  return import("./airports.json").then((mod: { default: Array<{ id: string; name: string; city: string; country: string; iata: string; icao: string; latitude: number; longitude: number }> }) => {
    const raw = mod.default
    const list: AirportData[] = raw
      .filter((a) => a.iata && a.iata !== "\\N")
      .map((a) => ({
        id: a.iata,
        name: a.name,
        iata: a.iata,
        icao: a.icao || "",
        city: a.city || "",
        country: a.country || "",
        latitude: Number(a.latitude),
        longitude: Number(a.longitude),
      }))
    fullAirportsCache = list
    return list
  })
}

export function findAirportByIata(iata: string, list?: AirportData[]): AirportData | undefined {
  const code = (iata || "").toUpperCase().trim()
  return (list ?? AIRPORTS).find((a) => a.iata === code)
}

export function searchAirports(query: string, limit = 10, list?: AirportData[]): AirportData[] {
  const q = (query || "").toLowerCase().trim()
  if (!q) return []
  const src = list ?? AIRPORTS
  return src.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.iata.toLowerCase().includes(q) ||
      (a.icao && a.icao.toLowerCase().includes(q)) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  ).slice(0, limit)
}

/** URL/API용 IATA 코드로 변환 (검색어·이름·IATA 모두 허용) */
export function getIataForUrl(value: string): string {
  const v = (value || "").trim()
  const byCode = findAirportByIata(v)
  if (byCode) return byCode.iata
  const first = searchAirports(v, 1)[0]
  if (first) return first.iata
  if (/^[A-Za-z]{3}$/.test(v)) return v.toUpperCase()
  return "GMP"
}
