import type { Coordinates } from "./types"

export function calculateMidpoint(
  coordinates: Array<Coordinates>
): Coordinates {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 }
  }

  // Convert to radians and cartesian coordinates
  const points = coordinates.map(({ longitude: lng, latitude: lat }) => {
    const latRad = (lat * Math.PI) / 180
    const lngRad = (lng * Math.PI) / 180
    return {
      x: Math.cos(latRad) * Math.cos(lngRad),
      y: Math.cos(latRad) * Math.sin(lngRad),
      z: Math.sin(latRad),
    }
  })

  // Calculate average of cartesian coordinates
  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + point.z,
    }),
    { x: 0, y: 0, z: 0 }
  )

  const avg = {
    x: sum.x / points.length,
    y: sum.y / points.length,
    z: sum.z / points.length,
  }

  // Convert back to longitude/latitude
  const lng = Math.atan2(avg.y, avg.x)
  const hyp = Math.sqrt(avg.x * avg.x + avg.y * avg.y)
  const lat = Math.atan2(avg.z, hyp)

  return {
    latitude: (lat * 180) / Math.PI,
    longitude: (lng * 180) / Math.PI,
  }
}
