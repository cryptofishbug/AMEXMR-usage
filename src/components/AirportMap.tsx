"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { mapKitLoader } from "../lib/mapkit-service"
import type { AirportData } from "../data/airports"

const US_CENTER = { latitude: 39.8283, longitude: -98.5795 }
const US_SPAN = { latitudeDelta: 38, longitudeDelta: 70 }
const ROUTE_PADDING = 64

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}
function toDegrees(rad: number) {
  return (rad * 180) / Math.PI
}
type Vec3 = [number, number, number]
function coordToVec(lat: number, lon: number): Vec3 {
  const latR = toRadians(lat)
  const lonR = toRadians(lon)
  const c = Math.cos(latR)
  return [c * Math.cos(lonR), c * Math.sin(lonR), Math.sin(latR)]
}
function vecToCoord([x, y, z]: Vec3): { latitude: number; longitude: number } {
  const lon = Math.atan2(y, x)
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
  return { latitude: toDegrees(lat), longitude: toDegrees(lon) }
}
function greatCirclePath(origin: AirportData, dest: AirportData): { latitude: number; longitude: number }[] {
  const start = coordToVec(origin.latitude, origin.longitude)
  const end = coordToVec(dest.latitude, dest.longitude)
  const dot = Math.max(-1, Math.min(1, start[0] * end[0] + start[1] * end[1] + start[2] * end[2]))
  const omega = Math.acos(dot)
  const segments = Math.max(24, Math.min(120, Math.ceil((omega / Math.PI) * 80)))
  const out: { latitude: number; longitude: number }[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const sinA = Math.sin((1 - t) * omega)
    const sinB = Math.sin(t * omega)
    const sinO = Math.sin(omega) || 1e-6
    const v: Vec3 = [
      (sinA * start[0] + sinB * end[0]) / sinO,
      (sinA * start[1] + sinB * end[1]) / sinO,
      (sinA * start[2] + sinB * end[2]) / sinO,
    ]
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1
    out.push(vecToCoord([v[0] / len, v[1] / len, v[2] / len]))
  }
  return out
}

interface AirportMapProps {
  originAirport: AirportData | null
  destinationAirport: AirportData | null
  className?: string
}

export function AirportMap({
  originAirport,
  destinationAirport,
  className = "",
}: AirportMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<{
    addAnnotations: (a: unknown[]) => void
    removeAnnotation: (a: unknown) => void
    addOverlay: (o: unknown) => void
    removeOverlay: (o: unknown) => void
    showItems?: (items: unknown[], opts: { animate: boolean; padding: unknown }) => void
    setRegionAnimated: (r: unknown, animate: boolean) => void
    selectedAnnotation: unknown
    destroy: () => void
  } | null>(null)
  const originAnnRef = useRef<unknown>(null)
  const destAnnRef = useRef<unknown>(null)
  const routeOverlaysRef = useRef<unknown[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearOverlays = useCallback((map: { removeOverlay: (o: unknown) => void } | null) => {
    if (!map) return
    routeOverlaysRef.current.forEach((o) => {
      try {
        map.removeOverlay(o)
      } catch {
        // ignore
      }
    })
    routeOverlaysRef.current = []
  }, [])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      if (!containerRef.current) return
      try {
        await mapKitLoader.load()
        const mapkit = mapKitLoader.getMapKit()
        if (!containerRef.current || !mounted) return
        const map = new mapkit.Map(containerRef.current, {
          region: new mapkit.CoordinateRegion(
            new mapkit.Coordinate(US_CENTER.latitude, US_CENTER.longitude),
            new mapkit.CoordinateSpan(US_SPAN.latitudeDelta, US_SPAN.longitudeDelta)
          ),
          showsMapTypeControl: false,
          showsZoomControl: true,
          showsUserLocationControl: false,
          isRotationEnabled: false,
        })
        if (!mounted) {
          map.destroy()
          return
        }
        mapRef.current = map as typeof mapRef.current
        setIsReady(true)
        setError(null)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load map")
        }
      }
    }
    init()
    return () => {
      mounted = false
      const map = mapRef.current
      if (map) {
        try {
          if (originAnnRef.current) map.removeAnnotation(originAnnRef.current)
          if (destAnnRef.current) map.removeAnnotation(destAnnRef.current)
          clearOverlays(map)
          map.destroy()
        } catch {
          // ignore
        }
      }
      mapRef.current = null
    }
  }, [clearOverlays])

  useEffect(() => {
    if (!isReady || !mapRef.current) return
    const map = mapRef.current as {
      addAnnotations: (a: unknown[]) => void
      removeAnnotation: (a: unknown) => void
      addOverlay: (o: unknown) => void
      removeOverlay: (o: unknown) => void
      showItems?: (items: unknown[], opts: { animate: boolean; padding: unknown }) => void
      setRegionAnimated: (r: unknown, animate: boolean) => void
      selectedAnnotation: unknown
    }
    const mapkit = mapKitLoader.getMapKit()

    if (originAnnRef.current) {
      try {
        map.removeAnnotation(originAnnRef.current)
      } catch {
        // ignore
      }
      originAnnRef.current = null
    }
    if (destAnnRef.current) {
      try {
        map.removeAnnotation(destAnnRef.current)
      } catch {
        // ignore
      }
      destAnnRef.current = null
    }
    clearOverlays(map)

    const items: unknown[] = []

    if (originAirport) {
      const coord = new mapkit.Coordinate(originAirport.latitude, originAirport.longitude)
      const ann = new mapkit.MarkerAnnotation(coord, {
        title: originAirport.name,
        subtitle: `${originAirport.iata} • ${originAirport.city}, ${originAirport.country}`,
        glyphText: originAirport.iata.slice(0, 3),
        color: "#ef4444",
        animates: false,
      })
      map.addAnnotations([ann])
      originAnnRef.current = ann
      items.push(ann)
    }
    if (destinationAirport) {
      const coord = new mapkit.Coordinate(destinationAirport.latitude, destinationAirport.longitude)
      const ann = new mapkit.MarkerAnnotation(coord, {
        title: destinationAirport.name,
        subtitle: `${destinationAirport.iata} • ${destinationAirport.city}, ${destinationAirport.country}`,
        glyphText: destinationAirport.iata.slice(0, 3),
        color: "#22c55e",
        animates: false,
      })
      map.addAnnotations([ann])
      destAnnRef.current = ann
      items.push(ann)
    }

    if (originAirport && destinationAirport) {
      const path = greatCirclePath(originAirport, destinationAirport)
      const coords = path.map((p) => new mapkit.Coordinate(p.latitude, p.longitude))
      const overlay = new mapkit.PolylineOverlay(coords, {
        lineWidth: 4,
        strokeColor: "rgba(30,58,138,0.9)",
      })
      map.addOverlay(overlay)
      routeOverlaysRef.current = [overlay]
      if (map.showItems && items.length) {
        try {
          map.showItems(items, {
            animate: true,
            padding: new mapkit.Padding(ROUTE_PADDING, ROUTE_PADDING, ROUTE_PADDING, ROUTE_PADDING),
          })
        } catch {
          // ignore
        }
      }
      map.selectedAnnotation = destAnnRef.current
    } else if (items.length === 1 && map.showItems) {
      try {
        map.showItems(items, {
          animate: true,
          padding: new mapkit.Padding(80, 80, 80, 80),
        })
      } catch {
        // ignore
      }
      map.selectedAnnotation = items[0]
    } else {
      try {
        const region = new mapkit.CoordinateRegion(
          new mapkit.Coordinate(US_CENTER.latitude, US_CENTER.longitude),
          new mapkit.CoordinateSpan(US_SPAN.latitudeDelta, US_SPAN.longitudeDelta)
        )
        map.setRegionAnimated(region, false)
      } catch {
        // ignore
      }
      map.selectedAnnotation = null
    }
  }, [isReady, originAirport, destinationAirport, clearOverlays])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-slate-600/60 bg-slate-900/50 p-8 text-sm text-slate-400 ${className}`}
      >
        <div className="text-center">
          <p className="font-medium text-amber-400/90">지도를 불러올 수 없습니다</p>
          <p className="mt-1 text-xs">{error}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            Apple Developer에서 MapKit JS 토큰을 발급한 뒤 <code className="rounded bg-slate-700/60 px-1">VITE_MAPKIT_TOKEN</code> 환경 변수로 설정하세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-slate-600/60 bg-slate-900/50 ${className}`}>
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 text-sm text-slate-400">
          Loading map...
        </div>
      )}
      <div ref={containerRef} className="h-[360px] w-full" />
    </div>
  )
}
