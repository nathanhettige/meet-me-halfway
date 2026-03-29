import { fetchNearbyCities } from "./fetch-nearby-cities"
import type { Coordinates, SnapResult } from "./types"

function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
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

function interpolate(a: Coordinates, b: Coordinates, t: number): Coordinates {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  }
}

export async function snapMidpointToPopulatedArea(
  centroid: Coordinates,
  inputCoordinates: Array<Coordinates>
): Promise<SnapResult | null> {
  // Phase 1: Search directly around the centroid (50km radius)
  const directResults = await fetchNearbyCities(centroid)
  if (directResults.length > 0) {
    const best = directResults[0]
    const dist = haversineDistanceKm(centroid, best.location)
    console.log(
      `Snap: found city "${best.displayName.text}" ${dist.toFixed(1)}km from centroid`
    )
    return {
      location: best.location,
      snapDistanceKm: dist,
      cityName: best.displayName.text,
    }
  }

  // Phase 2: Search at intermediate points along lines from centroid to each input
  // Try at 25% and 50% of the way from centroid toward each input address
  const searchPoints: Array<Coordinates> = []
  for (const coord of inputCoordinates) {
    searchPoints.push(interpolate(centroid, coord, 0.25))
    searchPoints.push(interpolate(centroid, coord, 0.5))
  }

  const searchResults = await Promise.all(
    searchPoints.map((pt) => fetchNearbyCities(pt))
  )

  const candidates: Array<{
    location: Coordinates
    distFromCentroid: number
    name: string
  }> = []

  for (const results of searchResults) {
    for (const city of results) {
      candidates.push({
        location: city.location,
        distFromCentroid: haversineDistanceKm(centroid, city.location),
        name: city.displayName.text,
      })
    }
  }

  if (candidates.length === 0) {
    console.log(
      "Snap: no populated area found near centroid or intermediate points"
    )
    return null
  }

  // Pick the candidate closest to the original centroid
  candidates.sort((a, b) => a.distFromCentroid - b.distFromCentroid)
  const best = candidates[0]

  console.log(
    `Snap: found city "${best.name}" ${best.distFromCentroid.toFixed(1)}km from centroid (via corridor search)`
  )

  return {
    location: best.location,
    snapDistanceKm: best.distFromCentroid,
    cityName: best.name,
  }
}
