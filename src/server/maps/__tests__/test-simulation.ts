/**
 * SimulatedWorld: A testing infrastructure for the midpoint-finding algorithm.
 *
 * Simulates a world with:
 * - Known origin coordinates (stored by placeId)
 * - Synthetic nearby places generated around any coordinate
 * - Driving time simulation via haversine distance with road factors and barrier penalties
 * - Synthetic route polylines (straight-line approximations)
 * - Predefined real-world-inspired scenarios
 * - Scoring functions for algorithm quality
 */

import type { Coordinates, Place } from "../types"
import type { RouteMatrixResult } from "../fetch-route-matrix"

// --- Barrier types ---

export type Barrier = {
  /** Name for debugging */
  name: string
  /** Function that returns true if a straight line between two points crosses this barrier */
  crosses: (a: Coordinates, b: Coordinates) => boolean
  /** Penalty multiplier applied when crossing (e.g. 1.5 = 50% longer) */
  penaltyMultiplier: number
}

/** Creates a barrier that is a horizontal (latitude) line segment */
export function createRiverBarrier(
  name: string,
  latLine: number,
  lngMin: number,
  lngMax: number,
  penalty = 1.4
): Barrier {
  return {
    name,
    crosses: (a, b) => {
      // Check if the line segment from a to b crosses the latitude line
      if (
        (a.latitude < latLine && b.latitude < latLine) ||
        (a.latitude > latLine && b.latitude > latLine)
      ) {
        return false
      }
      // Find longitude at the crossing point
      const t = (latLine - a.latitude) / (b.latitude - a.latitude)
      const crossLng = a.longitude + t * (b.longitude - a.longitude)
      return crossLng >= lngMin && crossLng <= lngMax
    },
    penaltyMultiplier: penalty,
  }
}

/** Creates a barrier that is a vertical (longitude) line segment */
export function createVerticalBarrier(
  name: string,
  lngLine: number,
  latMin: number,
  latMax: number,
  penalty = 1.4
): Barrier {
  return {
    name,
    crosses: (a, b) => {
      if (
        (a.longitude < lngLine && b.longitude < lngLine) ||
        (a.longitude > lngLine && b.longitude > lngLine)
      ) {
        return false
      }
      const t = (lngLine - a.longitude) / (b.longitude - a.longitude)
      const crossLat = a.latitude + t * (b.latitude - a.latitude)
      return crossLat >= latMin && crossLat <= latMax
    },
    penaltyMultiplier: penalty,
  }
}

// --- Haversine ---

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// --- Polyline encoder (for generating synthetic route polylines) ---

function encodePolyline(points: Array<Coordinates>): string {
  let encoded = ""
  let prevLat = 0
  let prevLng = 0

  for (const point of points) {
    const lat = Math.round(point.latitude * 1e5)
    const lng = Math.round(point.longitude * 1e5)

    encoded += encodeSignedValue(lat - prevLat)
    encoded += encodeSignedValue(lng - prevLng)

    prevLat = lat
    prevLng = lng
  }

  return encoded
}

function encodeSignedValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1
  let encoded = ""
  while (v >= 0x20) {
    encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63)
    v >>= 5
  }
  encoded += String.fromCharCode(v + 63)
  return encoded
}

// --- Place ID counter for unique IDs ---

let placeIdCounter = 0

function generatePlaceId(prefix: string): string {
  return `${prefix}_${++placeIdCounter}`
}

// --- Simulated World ---

export class SimulatedWorld {
  /** Map from placeId -> coordinates (origins and generated places) */
  private placeCoordinates = new Map<string, Coordinates>()

  /** Barriers that affect driving times */
  private barriers: Array<Barrier> = []

  /** Road factor: straight-line distance * roadFactor = simulated road distance */
  private roadFactor: number

  /** Average driving speed in km/h */
  private avgSpeedKmh: number

  constructor(options?: {
    roadFactor?: number
    avgSpeedKmh?: number
    barriers?: Array<Barrier>
  }) {
    this.roadFactor = options?.roadFactor ?? 1.3
    this.avgSpeedKmh = options?.avgSpeedKmh ?? 80
    this.barriers = options?.barriers ?? []
  }

  /** Register a known place (origin) with its coordinates */
  registerPlace(placeId: string, coords: Coordinates): void {
    this.placeCoordinates.set(placeId, coords)
  }

  /** Get coordinates for a placeId */
  getCoordinates(placeId: string): Coordinates | undefined {
    return this.placeCoordinates.get(placeId)
  }

  /** Compute simulated driving time in seconds between two coordinates */
  computeDrivingTime(from: Coordinates, to: Coordinates): number {
    const distKm = haversineKm(from, to)
    let roadDistKm = distKm * this.roadFactor

    // Apply barrier penalties
    for (const barrier of this.barriers) {
      if (barrier.crosses(from, to)) {
        roadDistKm *= barrier.penaltyMultiplier
      }
    }

    return (roadDistKm / this.avgSpeedKmh) * 3600
  }

  /** Generate a synthetic straight-line polyline between two coordinates */
  generatePolyline(from: Coordinates, to: Coordinates): string {
    // Generate ~10 intermediate points along the straight line
    const numPoints = 10
    const points: Array<Coordinates> = []
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints
      points.push({
        latitude: from.latitude + (to.latitude - from.latitude) * t,
        longitude: from.longitude + (to.longitude - from.longitude) * t,
      })
    }
    return encodePolyline(points)
  }

  // --- Mock implementations for the API functions ---

  /** Mock for fetchPlaceDetails */
  mockFetchPlaceDetails = (placeId: string) => {
    const coords = this.placeCoordinates.get(placeId)
    if (!coords) {
      throw new Error(`SimulatedWorld: unknown placeId "${placeId}"`)
    }
    return Promise.resolve({
      location: coords,
      displayName: { text: placeId },
    })
  }

  /** Mock for fetchNearbyActivities */
  mockFetchNearbyActivities = (
    coordinates: Coordinates,
    maxResults = 20
  ): Promise<Array<Place>> => {
    const places: Array<Place> = []
    const numPlaces = Math.min(maxResults, 8)

    // Generate places in a circle around the coordinates
    for (let i = 0; i < numPlaces; i++) {
      const angle = (2 * Math.PI * i) / numPlaces
      // Spread places ~2-15km from center
      const radiusKm = 2 + (i * 13) / numPlaces
      const latOffset = (radiusKm / 111) * Math.cos(angle)
      const lngOffset =
        (radiusKm / (111 * Math.cos((coordinates.latitude * Math.PI) / 180))) *
        Math.sin(angle)

      const placeCoords: Coordinates = {
        latitude: coordinates.latitude + latOffset,
        longitude: coordinates.longitude + lngOffset,
      }

      const placeId = generatePlaceId("sim_place")
      this.placeCoordinates.set(placeId, placeCoords)

      places.push({
        id: placeId,
        displayName: { text: `simulated venue ${placeId}` },
        formattedAddress: `${placeCoords.latitude.toFixed(4)}, ${placeCoords.longitude.toFixed(4)}`,
        location: placeCoords,
        rating: 4.0 + Math.random(),
        googleMapsUri: `https://maps.google.com/?q=${placeCoords.latitude},${placeCoords.longitude}`,
        websiteUri: "",
        types: ["restaurant"],
      })
    }

    return Promise.resolve(places)
  }

  /** Mock for fetchNearbyCities */
  mockFetchNearbyCities = (coordinates: Coordinates, _radiusMeters = 50000) => {
    // Return the center point itself as a "city"
    return Promise.resolve([
      {
        displayName: { text: "simulated city" },
        formattedAddress: `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
        types: ["locality"],
        location: { ...coordinates },
      },
    ])
  }

  /** Mock for fetchRouteMatrix */
  mockFetchRouteMatrix = (
    originPlaceIds: Array<string>,
    destinationPlaceIds: Array<string>
  ): Promise<Array<RouteMatrixResult>> => {
    const results: Array<RouteMatrixResult> = []

    for (let o = 0; o < originPlaceIds.length; o++) {
      const originCoords = this.placeCoordinates.get(originPlaceIds[o])
      if (!originCoords) {
        // If we don't know this origin, create a failed route
        for (let d = 0; d < destinationPlaceIds.length; d++) {
          results.push({
            originIndex: o,
            destinationIndex: d,
            condition: "ROUTE_NOT_FOUND",
            status: {},
          })
        }
        continue
      }

      for (let d = 0; d < destinationPlaceIds.length; d++) {
        const destCoords = this.placeCoordinates.get(destinationPlaceIds[d])
        if (!destCoords) {
          results.push({
            originIndex: o,
            destinationIndex: d,
            condition: "ROUTE_NOT_FOUND",
            status: {},
          })
          continue
        }

        const drivingTimeSeconds = this.computeDrivingTime(
          originCoords,
          destCoords
        )
        const distMeters = haversineKm(originCoords, destCoords) * 1000

        results.push({
          originIndex: o,
          destinationIndex: d,
          duration: `${Math.round(drivingTimeSeconds)}s`,
          distanceMeters: Math.round(distMeters),
          condition: "ROUTE_EXISTS",
          status: {},
        })
      }
    }

    return Promise.resolve(results)
  }

  /** Mock for fetchRoute */
  mockFetchRoute = (
    originPlaceId: string,
    destination: Coordinates
  ): Promise<{
    encodedPolyline: string
    durationSeconds: number
    distanceMeters: number
  }> => {
    const originCoords = this.placeCoordinates.get(originPlaceId)
    if (!originCoords) {
      throw new Error(
        `SimulatedWorld: unknown origin placeId "${originPlaceId}"`
      )
    }

    const durationSeconds = this.computeDrivingTime(originCoords, destination)
    const distanceMeters = haversineKm(originCoords, destination) * 1000
    const encodedPolyline = this.generatePolyline(originCoords, destination)

    return Promise.resolve({
      encodedPolyline,
      durationSeconds: Math.round(durationSeconds),
      distanceMeters: Math.round(distanceMeters),
    })
  }

  /** Mock for snapMidpointToPopulatedArea */
  mockSnapMidpointToPopulatedArea = (
    centroid: Coordinates,
    _inputCoordinates: Array<Coordinates>
  ) => {
    // Just return the centroid as-is (no actual snapping in simulation)
    return Promise.resolve({
      location: { ...centroid },
      snapDistanceKm: 0,
      cityName: "simulated midpoint city",
    })
  }
}

// --- Scoring ---

export type ScoreResult = {
  /** 0-100: How fair is the result? 100 = all travel times identical */
  fairnessScore: number
  /** 0-100: How efficient is the route? 100 = no wasted travel time */
  efficiencyScore: number
  /** Weighted combination: 70% fairness, 30% efficiency */
  overallScore: number
  /** Raw metrics */
  metrics: {
    timeDifferenceSeconds: number
    percentageDiff: number
    avgTravelTimeSeconds: number
    maxTravelTimeSeconds: number
    minTravelTimeSeconds: number
    iterationsUsed: number
    converged: boolean
  }
}

/**
 * Score a search result for quality.
 *
 * Uses coefficient of variation (CV = stddev / mean * 100) as the fairness
 * metric instead of max/min percentage diff. CV is less harsh for multi-person
 * scenarios where one person is inherently closer due to geometric constraints.
 *
 * For 2 people, CV = percentageDiff / 2, so it's equivalent but on a different
 * scale. The decay constant is adjusted accordingly.
 *
 * @param travelTimes - Array of travel times in seconds (one per person)
 * @param iterationsUsed - Number of iterations the algorithm ran
 * @param maxIterations - Maximum iterations allowed
 * @param straightLineAvgTimeSeconds - Estimated avg travel time for ideal placement
 *   (used to judge efficiency; if not provided, uses mean of actual times)
 */
export function scoreResult(
  travelTimes: Array<number>,
  iterationsUsed: number,
  maxIterations: number,
  straightLineAvgTimeSeconds?: number
): ScoreResult {
  const maxTime = Math.max(...travelTimes)
  const minTime = Math.min(...travelTimes)
  const timeDifference = maxTime - minTime
  const avgTime = travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length
  const percentageDiff = minTime > 0 ? (timeDifference / minTime) * 100 : 100

  // Coefficient of variation: stddev / mean * 100
  const variance =
    travelTimes.reduce((sum, t) => sum + (t - avgTime) ** 2, 0) /
    travelTimes.length
  const cv = avgTime > 0 ? (Math.sqrt(variance) / avgTime) * 100 : 100

  // Fairness: 100 when CV = 0%, decays as CV grows
  // At CV 5% -> score ~85, at CV 15% -> score ~55, at CV 30% -> score ~22
  // CV is roughly half the max/min % diff for 2 people, so we use a larger
  // decay constant (20 vs the old 30) to get similar 2-person scores
  const fairnessScore = Math.max(0, 100 * Math.exp(-cv / 20))

  // Efficiency: how close is avgTime to the ideal straight-line time?
  // If not provided, efficiency is judged by whether all times are close to average
  const idealTime = straightLineAvgTimeSeconds ?? avgTime
  const efficiencyRatio = idealTime > 0 ? avgTime / idealTime : 1
  // Score 100 when ratio = 1, decays as ratio grows (more wasted time)
  const efficiencyScore = Math.max(
    0,
    100 * Math.exp(-Math.max(0, efficiencyRatio - 1) * 3)
  )

  const converged = iterationsUsed < maxIterations

  return {
    fairnessScore: Math.round(fairnessScore * 10) / 10,
    efficiencyScore: Math.round(efficiencyScore * 10) / 10,
    overallScore:
      Math.round((0.7 * fairnessScore + 0.3 * efficiencyScore) * 10) / 10,
    metrics: {
      timeDifferenceSeconds: timeDifference,
      percentageDiff: Math.round(percentageDiff * 10) / 10,
      avgTravelTimeSeconds: Math.round(avgTime),
      maxTravelTimeSeconds: maxTime,
      minTravelTimeSeconds: minTime,
      iterationsUsed,
      converged,
    },
  }
}

// --- Predefined Scenarios ---

export type Scenario = {
  name: string
  description: string
  origins: Array<{ placeId: string; coordinates: Coordinates }>
  barriers?: Array<Barrier>
  roadFactor?: number
  avgSpeedKmh?: number
  /** Expected minimum fairness score to pass */
  minFairnessScore: number
  /** Expected minimum overall score to pass */
  minOverallScore: number
}

export const SCENARIOS: Record<string, Scenario> = {
  // --- 2-Person Urban ---
  nycBoston: {
    name: "NYC to Boston",
    description:
      "~215 mi corridor along I-95, expect midpoint near Hartford CT area",
    origins: [
      {
        placeId: "place_nyc",
        coordinates: { latitude: 40.7128, longitude: -74.006 },
      },
      {
        placeId: "place_boston",
        coordinates: { latitude: 42.3601, longitude: -71.0589 },
      },
    ],
    minFairnessScore: 60,
    minOverallScore: 55,
  },

  laSanDiego: {
    name: "LA to San Diego",
    description: "~120 mi along I-5, straightforward corridor",
    origins: [
      {
        placeId: "place_la",
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
      },
      {
        placeId: "place_sd",
        coordinates: { latitude: 32.7157, longitude: -117.1611 },
      },
    ],
    minFairnessScore: 65,
    minOverallScore: 60,
  },

  chicagoDetroit: {
    name: "Chicago to Detroit",
    description: "~280 mi via I-94, midpoint near Kalamazoo MI area",
    origins: [
      {
        placeId: "place_chicago",
        coordinates: { latitude: 41.8781, longitude: -87.6298 },
      },
      {
        placeId: "place_detroit",
        coordinates: { latitude: 42.3314, longitude: -83.0458 },
      },
    ],
    minFairnessScore: 60,
    minOverallScore: 55,
  },

  dcPhiladelphia: {
    name: "DC to Philadelphia",
    description: "~140 mi along I-95, short corridor",
    origins: [
      {
        placeId: "place_dc",
        coordinates: { latitude: 38.9072, longitude: -77.0369 },
      },
      {
        placeId: "place_philly",
        coordinates: { latitude: 39.9526, longitude: -75.1652 },
      },
    ],
    minFairnessScore: 65,
    minOverallScore: 60,
  },

  sfSacramento: {
    name: "SF to Sacramento",
    description: "~90 mi via I-80, expect midpoint near Fairfield/Vacaville",
    origins: [
      {
        placeId: "place_sf",
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
      {
        placeId: "place_sacramento",
        coordinates: { latitude: 38.5816, longitude: -121.4944 },
      },
    ],
    minFairnessScore: 65,
    minOverallScore: 60,
  },

  // --- Geographic Barrier Scenarios ---
  sfOaklandBridge: {
    name: "SF to Oakland (bridge)",
    description:
      "Short distance but Bay Bridge crossing creates time asymmetry",
    origins: [
      {
        placeId: "place_sf_dt",
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
      {
        placeId: "place_oakland",
        coordinates: { latitude: 37.8044, longitude: -122.2712 },
      },
    ],
    barriers: [
      createVerticalBarrier(
        "Bay Bridge",
        -122.35,
        37.75,
        37.85,
        1.5 // 50% penalty crossing the bay
      ),
    ],
    minFairnessScore: 55,
    minOverallScore: 50,
  },

  manhattanBrooklyn: {
    name: "Manhattan to Brooklyn",
    description:
      "Very short distance, East River crossing via bridge adds time",
    origins: [
      {
        placeId: "place_manhattan",
        coordinates: { latitude: 40.7831, longitude: -73.9712 },
      },
      {
        placeId: "place_brooklyn",
        coordinates: { latitude: 40.6782, longitude: -73.9442 },
      },
    ],
    barriers: [
      createRiverBarrier(
        "East River",
        40.72,
        -74.02,
        -73.92,
        1.6 // 60% penalty for river crossing
      ),
    ],
    avgSpeedKmh: 30, // Urban speed
    roadFactor: 1.6, // Dense grid
    minFairnessScore: 50,
    minOverallScore: 45,
  },

  // --- Short Trip ---
  shortTrip: {
    name: "Short urban trip (~15 min)",
    description:
      "Two points 10 km apart in a dense area, algorithm should converge quickly",
    origins: [
      {
        placeId: "place_short_a",
        coordinates: { latitude: 40.758, longitude: -73.9855 },
      },
      {
        placeId: "place_short_b",
        coordinates: { latitude: 40.699, longitude: -73.9857 },
      },
    ],
    avgSpeedKmh: 30,
    roadFactor: 1.5,
    minFairnessScore: 55,
    minOverallScore: 50,
  },

  // --- 3-Person ---
  threePersonTriangle: {
    name: "NYC - Philly - Hartford triangle",
    description:
      "3 cities forming a triangle, algorithm must balance 3 travel times",
    origins: [
      {
        placeId: "place_nyc_3",
        coordinates: { latitude: 40.7128, longitude: -74.006 },
      },
      {
        placeId: "place_philly_3",
        coordinates: { latitude: 39.9526, longitude: -75.1652 },
      },
      {
        placeId: "place_hartford",
        coordinates: { latitude: 41.7658, longitude: -72.6734 },
      },
    ],
    minFairnessScore: 45,
    minOverallScore: 40,
  },

  threePersonLine: {
    name: "Boston - NYC - DC line",
    description:
      "3 cities in a line along I-95, middle person should have shortest time",
    origins: [
      {
        placeId: "place_boston_3",
        coordinates: { latitude: 42.3601, longitude: -71.0589 },
      },
      {
        placeId: "place_nyc_3l",
        coordinates: { latitude: 40.7128, longitude: -74.006 },
      },
      {
        placeId: "place_dc_3",
        coordinates: { latitude: 38.9072, longitude: -77.0369 },
      },
    ],
    minFairnessScore: 40,
    minOverallScore: 35,
  },

  // --- 4-Person ---
  fourPersonSquare: {
    name: "4-person square: NYC - Philly - Hartford - Trenton",
    description: "4 cities forming a rough square in the northeast",
    origins: [
      {
        placeId: "place_nyc_4",
        coordinates: { latitude: 40.7128, longitude: -74.006 },
      },
      {
        placeId: "place_philly_4",
        coordinates: { latitude: 39.9526, longitude: -75.1652 },
      },
      {
        placeId: "place_hartford_4",
        coordinates: { latitude: 41.7658, longitude: -72.6734 },
      },
      {
        placeId: "place_trenton",
        coordinates: { latitude: 40.2206, longitude: -74.7699 },
      },
    ],
    minFairnessScore: 40,
    minOverallScore: 35,
  },

  // --- European ---
  londonBirmingham: {
    name: "London to Birmingham",
    description: "~120 mi via M40, typical UK intercity trip",
    origins: [
      {
        placeId: "place_london",
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
      },
      {
        placeId: "place_birmingham",
        coordinates: { latitude: 52.4862, longitude: -1.8904 },
      },
    ],
    minFairnessScore: 60,
    minOverallScore: 55,
  },

  parisBrussels: {
    name: "Paris to Brussels",
    description: "~300 km via A1, cross-border European trip",
    origins: [
      {
        placeId: "place_paris",
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
      },
      {
        placeId: "place_brussels",
        coordinates: { latitude: 50.8503, longitude: 4.3517 },
      },
    ],
    minFairnessScore: 60,
    minOverallScore: 55,
  },
}

/** Set up a SimulatedWorld from a scenario */
export function createWorldFromScenario(scenario: Scenario): SimulatedWorld {
  const world = new SimulatedWorld({
    roadFactor: scenario.roadFactor,
    avgSpeedKmh: scenario.avgSpeedKmh,
    barriers: scenario.barriers,
  })

  for (const origin of scenario.origins) {
    world.registerPlace(origin.placeId, origin.coordinates)
  }

  return world
}
