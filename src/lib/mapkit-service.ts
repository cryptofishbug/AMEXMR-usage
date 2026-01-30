/**
 * MapKit JS 로더 (GrayPane flights-tracker 방식 참고)
 * Apple Developer에서 MapKit JS 토큰 발급 후 VITE_MAPKIT_TOKEN 설정 필요
 * @see https://developer.apple.com/maps/web/
 */

declare global {
  interface Window {
    mapkit?: MapKit
  }
}

type MapKitLibrary = "map" | "annotations" | "overlays"

interface MapKitAuthorizationCallback {
  (done: (token: string) => void): void
}

interface MapKit {
  init(options: { authorizationCallback: MapKitAuthorizationCallback }): void
  importLibrary?(name: MapKitLibrary): Promise<unknown>
  Map: new (element: HTMLElement, options?: Record<string, unknown>) => MapKitMap
  Coordinate: new (lat: number, lng: number) => unknown
  CoordinateRegion: new (center: unknown, span: unknown) => unknown
  CoordinateSpan: new (latitudeDelta: number, longitudeDelta: number) => unknown
  MarkerAnnotation: new (coordinate: unknown, options?: Record<string, unknown>) => unknown
  PolylineOverlay: new (coordinates: unknown[], options?: Record<string, unknown>) => unknown
  Padding: new (top: number, right: number, bottom: number, left: number) => unknown
  FeatureVisibility?: { Hidden?: unknown; Adaptive?: unknown }
}

export interface MapKitMap {
  destroy(): void
  addAnnotations(annotations: unknown[]): void
  removeAnnotation(annotation: unknown): void
  addOverlay(overlay: unknown): void
  removeOverlay(overlay: unknown): void
  setRegionAnimated(region: unknown, animated?: boolean): void
  showItems?(items: unknown[], options?: { animate?: boolean; padding?: unknown }): void
  selectedAnnotation: unknown
  addEventListener(type: string, listener: (...args: unknown[]) => void): void
  removeEventListener(type: string, listener: (...args: unknown[]) => void): void
}

const MAPKIT_SCRIPT_URL = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js"
const REQUIRED_LIBRARIES: MapKitLibrary[] = ["map", "annotations", "overlays"]
const SCRIPT_SELECTOR = "script[data-mapkit-loader='true']"

class MapKitLoader {
  private mapkit: MapKit | null = null
  private isInitialized = false
  private initCalled = false
  private librariesLoaded = false
  private loadPromise: Promise<void> | null = null

  async load(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("MapKit can only be loaded in the browser")
    }
    if (this.isInitialized && this.mapkit) return Promise.resolve()
    if (!this.loadPromise) this.loadPromise = this.initialize()
    await this.loadPromise
  }

  getMapKit(): MapKit {
    if (!this.mapkit) throw new Error("MapKit has not been initialized yet")
    return this.mapkit
  }

  isReady(): boolean {
    return this.isInitialized && this.mapkit !== null
  }

  private async initialize(): Promise<void> {
    await this.ensureScriptLoaded()
    const { mapkit } = window
    if (!mapkit) throw new Error("MapKit failed to load")
    this.mapkit = mapkit

    const token = import.meta.env.VITE_MAPKIT_TOKEN as string | undefined
    if (!token) {
      throw new Error("VITE_MAPKIT_TOKEN is not set. Get a token from Apple Developer.")
    }

    if (!this.initCalled) {
      try {
        mapkit.init({
          authorizationCallback: (done) => done(token),
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (!msg.includes("already initialized")) throw err as Error
      }
      this.initCalled = true
    }

    await this.ensureLibraries(mapkit)
    this.isInitialized = true
  }

  private ensureScriptLoaded(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.mapkit) {
        resolve()
        return
      }
      let script = document.querySelector(SCRIPT_SELECTOR) as HTMLScriptElement | null
      const onLoad = () => {
        if (script) script.dataset.mapkitLoaded = "true"
        if (window.mapkit) resolve()
        else {
          queueMicrotask(() => {
            if (window.mapkit) resolve()
            else reject(new Error("MapKit JS loaded but window.mapkit is undefined"))
          })
        }
      }
      if (script) {
        if (script.dataset.mapkitLoaded === "true" || window.mapkit) {
          resolve()
          return
        }
        script.addEventListener("load", onLoad, { once: true })
        script.addEventListener("error", () => reject(new Error("Failed to load MapKit JS")), { once: true })
        return
      }
      script = document.createElement("script")
      script.src = MAPKIT_SCRIPT_URL
      script.crossOrigin = "anonymous"
      script.async = true
      script.dataset.mapkitLoader = "true"
      script.addEventListener("load", onLoad, { once: true })
      script.addEventListener("error", () => reject(new Error("Failed to load MapKit JS")), { once: true })
      document.head.appendChild(script)
    })
  }

  private async ensureLibraries(mapkit: MapKit): Promise<void> {
    if (this.librariesLoaded) return
    if (typeof mapkit.importLibrary === "function") {
      await Promise.all(REQUIRED_LIBRARIES.map((lib) => mapkit.importLibrary!(lib)))
      this.librariesLoaded = true
      return
    }
    await new Promise<void>((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        if (
          typeof mapkit.Map === "function" &&
          typeof (mapkit as { MarkerAnnotation?: unknown }).MarkerAnnotation === "function" &&
          typeof (mapkit as { PolylineOverlay?: unknown }).PolylineOverlay === "function"
        ) {
          this.librariesLoaded = true
          resolve()
          return
        }
        if (Date.now() - start > 10000) reject(new Error("Timed out loading MapKit libraries"))
        else setTimeout(check, 50)
      }
      check()
    })
  }
}

export const mapKitLoader = new MapKitLoader()
