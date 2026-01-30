"use client"

import { useEffect, useMemo, useRef } from "react"
import L from "leaflet"
import type { AirportData } from "../data/airports"

const US_CENTER: [number, number] = [39.8283, -98.5795]
const US_ZOOM = 4
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

function vecToCoord([x, y, z]: Vec3): { lat: number; lng: number } {
  const lon = Math.atan2(y, x)
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
  return { lat: toDegrees(lat), lng: toDegrees(lon) }
}

function greatCirclePath(origin: AirportData, dest: AirportData): [number, number][] {
  const start = coordToVec(origin.latitude, origin.longitude)
  const end = coordToVec(dest.latitude, dest.longitude)

  const dot = Math.max(-1, Math.min(1, start[0] * end[0] + start[1] * end[1] + start[2] * end[2]))
  const omega = Math.acos(dot)

  // More segments for longer distances, capped to keep render cheap.
  const segments = Math.max(24, Math.min(160, Math.ceil((omega / Math.PI) * 100)))

  const out: [number, number][] = []
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
    const { lat, lng } = vecToCoord([v[0] / len, v[1] / len, v[2] / len])
    out.push([lat, lng])
  }
  return out
}

interface AirportMapProps {
  originAirport: AirportData | null
  destinationAirport: AirportData | null
  className?: string
}

export function AirportMap({ originAirport, destinationAirport, className = "" }: AirportMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)

  const route = useMemo(() => {
    if (!originAirport || !destinationAirport) return null
    return greatCirclePath(originAirport, destinationAirport)
  }, [originAirport, destinationAirport])

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const map = L.map(containerRef.current, {
      center: US_CENTER,
      zoom: US_ZOOM,
      zoomControl: true,
    })

    // Free tiles (OSM). No API key required.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update overlays when airports change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    const pts: [number, number][] = []

    if (originAirport) {
      const p: [number, number] = [originAirport.latitude, originAirport.longitude]
      pts.push(p)
      markersRef.current.push(
        L.marker(p, { title: originAirport.name }).addTo(map)
      )
    }

    if (destinationAirport) {
      const p: [number, number] = [destinationAirport.latitude, destinationAirport.longitude]
      pts.push(p)
      markersRef.current.push(
        L.marker(p, { title: destinationAirport.name }).addTo(map)
      )
    }

    if (route) {
      polylineRef.current = L.polyline(route, {
        color: "#1e3a8a",
        weight: 4,
        opacity: 0.9,
      }).addTo(map)
    }

    if (pts.length > 0) {
      map.fitBounds(pts as any, { padding: [ROUTE_PADDING, ROUTE_PADDING] })
    } else {
      map.setView(US_CENTER, US_ZOOM)
    }
  }, [originAirport, destinationAirport, route])

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-600/60 ${className}`}>
      <div ref={containerRef} style={{ height: 420, width: "100%" }} />
    </div>
  )
}
