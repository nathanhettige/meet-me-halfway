import { createServerFn } from "@tanstack/react-start"
import { calculateMidpoint } from "./calculate-midpoint"
import { fetchNearbyActivities } from "./fetch-nearby-activities"
import { fetchNearbyCities } from "./fetch-nearby-cities"
import { fetchPlaceDetails } from "./fetch-place-details"
import { fetchRouteMatrix } from "./fetch-route-matrix"
import { snapMidpointToPopulatedArea } from "./snap-midpoint"
import type { RouteMatrixResult } from "./fetch-route-matrix"
import type {
  ConvergenceThresholds,
  Coordinates,
  IterationResult,
  SearchResult,
  SnapResult,
} from "./types"

// --- Constants ---

const CANDIDATES_PER_ITERATION = 5
const OSCILLATION_THRESHOLD = 0.005 // ~500m in lat/lng degrees

const DEFAULT_THRESHOLDS: ConvergenceThresholds = {
  maxTimeDiffSeconds: 30,
  maxPercentageDiff: 5,
  maxIterations: 5,
  averageTravelTime: 0,
}

// Haversine distance in km (for initial midpoint calculation)
function haversineKm(a: Coordinates, b: Coordinates): number {
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

// --- Helper functions ---

/**
 * Compute dynamic convergence thresholds based on trip length.
 * - Time threshold: 2% of avg travel time, clamped to [60s, 600s]
 * - Percentage threshold: inversely scaled, clamped to [5%, 10%]
 * - Max iterations: scales with trip length, clamped to [3, 5]
 */
export function computeConvergenceThresholds(
  travelTimes: Array<number>
): ConvergenceThresholds {
  const averageTravelTime =
    travelTimes.reduce((sum, t) => sum + t, 0) / travelTimes.length

  const maxTimeDiffSeconds = Math.min(
    600,
    Math.max(60, averageTravelTime * 0.02)
  )

  const maxPercentageDiff = Math.min(
    10,
    Math.max(5, (1800 / Math.max(averageTravelTime, 1)) * 5)
  )

  const maxIterations = Math.min(
    5,
    Math.max(3, Math.ceil(averageTravelTime / 1800) + 2)
  )

  return {
    maxTimeDiffSeconds,
    maxPercentageDiff,
    maxIterations,
    averageTravelTime,
  }
}

/**
 * Drive-time-weighted centroid: each person's coordinates are weighted
 * by their travel time so people with longer drives pull the midpoint
 * more toward them.
 */
export function computeWeightedCentroid(
  coordinates: Array<Coordinates>,
  travelTimes: Array<number>
): Coordinates {
  const minTime = Math.max(Math.min(...travelTimes), 1)
  const weights = travelTimes.map((t) => t / minTime)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  const weightedLat = coordinates.reduce(
    (sum, coord, i) => sum + weights[i] * coord.latitude,
    0
  )
  const weightedLng = coordinates.reduce(
    (sum, coord, i) => sum + weights[i] * coord.longitude,
    0
  )

  return {
    latitude: weightedLat / totalWeight,
    longitude: weightedLng / totalWeight,
  }
}

/**
 * Compute the midpoint of the two farthest-apart origins.
 *
 * For multi-person scenarios, the geometric centroid often falls near
 * one person's origin (especially for collinear or clustered arrangements).
 * Starting at the midpoint of the two farthest people ensures we begin
 * at a point that minimizes the maximum distance to at least two people,
 * which is a much better starting position for equalization.
 */
function computeFarthestPairMidpoint(
  coordinates: Array<Coordinates>
): Coordinates {
  if (coordinates.length <= 2) {
    return {
      latitude:
        coordinates.reduce((sum, c) => sum + c.latitude, 0) /
        coordinates.length,
      longitude:
        coordinates.reduce((sum, c) => sum + c.longitude, 0) /
        coordinates.length,
    }
  }

  // Find the two farthest-apart origins by haversine distance
  let maxDist = 0
  let farA = 0
  let farB = 1
  for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
      const dist = haversineKm(coordinates[i], coordinates[j])
      if (dist > maxDist) {
        maxDist = dist
        farA = i
        farB = j
      }
    }
  }

  // Simple midpoint of the two farthest origins
  return {
    latitude: (coordinates[farA].latitude + coordinates[farB].latitude) / 2,
    longitude: (coordinates[farA].longitude + coordinates[farB].longitude) / 2,
  }
}

/**
 * Compute a gradient-based shift target for N people.
 *
 * Each person exerts a force proportional to how much their travel time
 * exceeds the mean. People below the mean push away (they're too close),
 * people above the mean pull toward (they're too far).
 *
 * When the gradient magnitude is small relative to the imbalance (meaning
 * the forces from far-away people cancel each other out), falls back to
 * shifting directly away from the closest person.
 */
function computeGradientTarget(
  currentMidpoint: Coordinates,
  coordinates: Array<Coordinates>,
  travelTimes: Array<number>
): Coordinates {
  const meanTime =
    travelTimes.reduce((sum, t) => sum + t, 0) / travelTimes.length
  const maxTime = Math.max(...travelTimes)
  const minTime = Math.min(...travelTimes)

  // If all times are equal, no shift needed
  if (maxTime - minTime < 1) {
    return currentMidpoint
  }

  // Each person applies a force: (theirTime - meanTime) / meanTime
  let shiftLat = 0
  let shiftLng = 0
  let totalWeight = 0

  for (let i = 0; i < coordinates.length; i++) {
    const weight = (travelTimes[i] - meanTime) / Math.max(meanTime, 1)
    const dLat = coordinates[i].latitude - currentMidpoint.latitude
    const dLng = coordinates[i].longitude - currentMidpoint.longitude

    shiftLat += weight * dLat
    shiftLng += weight * dLng
    totalWeight += Math.abs(weight)
  }

  if (totalWeight > 0) {
    shiftLat /= totalWeight
    shiftLng /= totalWeight
  }

  const shiftMagnitude = Math.sqrt(shiftLat ** 2 + shiftLng ** 2)

  // Measure the expected shift magnitude: how far the nearest person is
  const minTimeIndex = travelTimes.indexOf(minTime)
  const nearestDist = coordDistance(currentMidpoint, coordinates[minTimeIndex])

  // If the gradient is small relative to the nearest person distance,
  // the far-away people are canceling each other out. In this case,
  // shift directly away from the nearest person.
  const percentageDiff = ((maxTime - minTime) / Math.max(minTime, 1)) * 100
  if (shiftMagnitude < nearestDist * 0.1 && percentageDiff > 30) {
    const nearest = coordinates[minTimeIndex]
    return {
      latitude:
        currentMidpoint.latitude +
        (currentMidpoint.latitude - nearest.latitude),
      longitude:
        currentMidpoint.longitude +
        (currentMidpoint.longitude - nearest.longitude),
    }
  }

  return {
    latitude: currentMidpoint.latitude + shiftLat,
    longitude: currentMidpoint.longitude + shiftLng,
  }
}

/**
 * Simple coordinate distance for oscillation detection.
 */
export function coordDistance(a: Coordinates, b: Coordinates): number {
  const dLat = a.latitude - b.latitude
  const dLng = a.longitude - b.longitude
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

/**
 * Score multiple candidate venues by drive-time fairness.
 * Returns candidates sorted by timeDifference ASC, then avgTravelTime ASC.
 */
function scoreCandidates(
  routes: Array<RouteMatrixResult>,
  numOrigins: number,
  numCandidates: number
): Array<{
  candidateIndex: number
  travelTimes: Array<number>
  timeDifference: number
  percentageDiff: number
  avgTravelTime: number
}> {
  const scores: Array<{
    candidateIndex: number
    travelTimes: Array<number>
    timeDifference: number
    percentageDiff: number
    avgTravelTime: number
  }> = []

  for (let d = 0; d < numCandidates; d++) {
    const candidateRoutes = routes.filter((r) => r.destinationIndex === d)
    const allRoutesFound =
      candidateRoutes.length === numOrigins &&
      candidateRoutes.every(
        (r) => r.condition === "ROUTE_EXISTS" && r.duration != null
      )

    if (!allRoutesFound) continue

    const travelTimes: Array<number> = []
    for (let o = 0; o < numOrigins; o++) {
      const route = candidateRoutes.find((r) => r.originIndex === o)
      travelTimes.push(parseInt(route!.duration!.replace("s", "")))
    }

    const maxTime = Math.max(...travelTimes)
    const minTime = Math.min(...travelTimes)
    const timeDifference = maxTime - minTime
    const percentageDiff =
      minTime > 0 ? ((maxTime - minTime) / minTime) * 100 : 0
    const avgTravelTime =
      travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length

    scores.push({
      candidateIndex: d,
      travelTimes,
      timeDifference,
      percentageDiff,
      avgTravelTime,
    })
  }

  scores.sort((a, b) => {
    if (a.timeDifference !== b.timeDifference)
      return a.timeDifference - b.timeDifference
    return a.avgTravelTime - b.avgTravelTime
  })

  return scores
}

// --- Main search function ---

export async function searchHandler(data: {
  placeIds: Array<string>
}): Promise<SearchResult> {
  const iterations: Array<IterationResult> = []
  let bestIterationIndex = 0
  let thresholds: ConvergenceThresholds = { ...DEFAULT_THRESHOLDS }
  let minConvergenceScore = Infinity

  // Fetch all place details in parallel
  const details = await Promise.all(
    data.placeIds.map((placeId) => fetchPlaceDetails(placeId))
  )
  const coordinates: Array<Coordinates> = details.map((d) => ({
    latitude: d.location.latitude,
    longitude: d.location.longitude,
  }))

  // Phase 1: Compute initial midpoint
  // For 2 people: geometric centroid (midpoint of the line)
  // For 3+ people: farthest-pair midpoint (minimizes max distance to the two
  // most widely-separated people)
  const geometricCentroid = calculateMidpoint(coordinates)
  const isMultiPersonInit = data.placeIds.length > 2
  const initialCenter = isMultiPersonInit
    ? computeFarthestPairMidpoint(coordinates)
    : geometricCentroid
  let currentMidpoint = initialCenter

  // Phase 3: Snap centroid to nearest populated area
  let snapResult: SnapResult | null = null
  try {
    snapResult = await snapMidpointToPopulatedArea(initialCenter, coordinates)
    if (snapResult) {
      currentMidpoint = snapResult.location
      console.log(
        `Snapped midpoint from (${initialCenter.latitude.toFixed(4)}, ${initialCenter.longitude.toFixed(4)}) ` +
          `to "${snapResult.cityName}" (${snapResult.location.latitude.toFixed(4)}, ${snapResult.location.longitude.toFixed(4)}), ` +
          `${snapResult.snapDistanceKm.toFixed(1)}km away`
      )
    }
  } catch (err) {
    console.log(`Snap failed, using initial center: ${err}`)
  }

  let bestMidpoint = currentMidpoint
  const midpointHistory: Array<Coordinates> = []
  const isMultiPerson = data.placeIds.length > 2
  let extraIterationsGranted = 0
  const MAX_EXTRA_ITERATIONS = 2
  let oscillationDetected = false

  // For multi-person: on the first iteration, also explore all pairwise
  // midpoints to find the best starting position. This avoids getting stuck
  // when the centroid/farthest-pair midpoint is near one origin.
  let explorationPoints: Array<Coordinates> = []
  if (isMultiPerson) {
    const seen = new Set<string>()
    seen.add(
      `${currentMidpoint.latitude.toFixed(4)},${currentMidpoint.longitude.toFixed(4)}`
    )

    for (let a = 0; a < coordinates.length; a++) {
      for (let b = a + 1; b < coordinates.length; b++) {
        const mid = {
          latitude: (coordinates[a].latitude + coordinates[b].latitude) / 2,
          longitude: (coordinates[a].longitude + coordinates[b].longitude) / 2,
        }
        const key = `${mid.latitude.toFixed(4)},${mid.longitude.toFixed(4)}`
        if (!seen.has(key)) {
          seen.add(key)
          explorationPoints.push(mid)
        }
      }
    }
    // Also add the geometric centroid if different from farthest-pair midpoint
    const centroidKey = `${geometricCentroid.latitude.toFixed(4)},${geometricCentroid.longitude.toFixed(4)}`
    if (!seen.has(centroidKey)) {
      explorationPoints.push(geometricCentroid)
    }
  }

  let isFirstIteration = true
  const testedPlaceIds = new Set<string>()

  // Loop bound uses thresholds.maxIterations, which updates after first
  // successful route matrix call. This is intentional: the default (5)
  // applies until we know the trip scale.
  for (let i = 0; i < thresholds.maxIterations; i++) {
    // Find candidate venues near current midpoint
    // After oscillation: use more candidates and wider radius to escape barrier
    const iterCandidateCount = oscillationDetected ? 8 : CANDIDATES_PER_ITERATION
    const iterSearchRadius = oscillationDetected ? 35000 : undefined
    // For multi-person first iteration: also search around all pairwise midpoints
    const allPlaces = await fetchNearbyActivities(
      currentMidpoint,
      iterCandidateCount,
      true,
      iterSearchRadius
    )

    // Track which search center each candidate came from
    const candidateOrigins: Array<Coordinates> = allPlaces.map(
      () => currentMidpoint
    )

    if (isMultiPerson && explorationPoints.length > 0) {
      // On first iteration, explore all pairwise midpoints
      const explorationResults = await Promise.all(
        explorationPoints.map((point) => fetchNearbyActivities(point, 4, true))
      )
      for (let e = 0; e < explorationResults.length; e++) {
        for (const place of explorationResults[e]) {
          allPlaces.push(place)
          candidateOrigins.push(explorationPoints[e])
        }
      }
      console.log(
        `Iteration ${i + 1}: Exploring ${explorationResults.length + 1} search areas, ${allPlaces.length} total candidates`
      )
      // Clear exploration points — only explore on the first pass
      explorationPoints = []
    }

    const places = allPlaces

    if (places.length === 0) {
      console.log(`Iteration ${i + 1}: No places found near midpoint`)

      const cities = await fetchNearbyCities(currentMidpoint)
      if (cities.length > 0) {
        console.log(
          `Iteration ${i + 1}: Adjusted to nearby city - ${cities[0].displayName.text}`
        )
        currentMidpoint = cities[0].location
      } else if (snapResult) {
        console.log(
          `Iteration ${i + 1}: No cities found, retreating to snap point "${snapResult.cityName}"`
        )
        currentMidpoint = snapResult.location
      }

      iterations.push({
        midpoint: { ...currentMidpoint },
        timeDifference: 0,
        percentageDiff: 0,
        isBest: false,
        iteration: i + 1,
        candidatesTested: 0,
        travelTimes: [],
      })
      continue
    }

    // Phase 2: Batch candidate testing — test multiple venues in one call
    // On exploration iterations (multi-person first pass), test all candidates
    const maxCandidates =
      isFirstIteration && isMultiPerson
        ? places.length
        : iterCandidateCount
    // Deduplicate: skip candidates already tested in previous iterations
    const candidates = places
      .filter((p) => !testedPlaceIds.has(p.id))
      .slice(0, maxCandidates)
    const candidatePlaceIds = candidates.map((p) => p.id)

    if (candidatePlaceIds.length === 0) {
      console.log(
        `Iteration ${i + 1}: All candidates already tested, stopping search`
      )
      iterations.push({
        midpoint: { ...currentMidpoint },
        timeDifference: 0,
        percentageDiff: 0,
        isBest: false,
        iteration: i + 1,
        candidatesTested: 0,
        travelTimes: [],
      })
      break
    }

    // Track tested place IDs
    for (const id of candidatePlaceIds) {
      testedPlaceIds.add(id)
    }

    const routes = await fetchRouteMatrix(data.placeIds, candidatePlaceIds)
    const scores = scoreCandidates(
      routes,
      data.placeIds.length,
      candidates.length
    )

    if (scores.length === 0) {
      console.log(
        `Iteration ${i + 1}: No routable candidates found among ${candidates.length} places`
      )
      iterations.push({
        midpoint: { ...currentMidpoint },
        timeDifference: 0,
        percentageDiff: 0,
        isBest: false,
        iteration: i + 1,
        candidatesTested: candidates.length,
        travelTimes: [],
      })
      continue
    }

    const best = scores[0]
    const travelTimes = best.travelTimes

    // If the best candidate came from an exploration point (different area),
    // jump the midpoint to that area
    if (best.candidateIndex < candidateOrigins.length) {
      const bestOrigin = candidateOrigins[best.candidateIndex]
      if (coordDistance(bestOrigin, currentMidpoint) > 0.01) {
        console.log(
          `Iteration ${i + 1}: Best candidate from exploration area ` +
            `(${bestOrigin.latitude.toFixed(4)}, ${bestOrigin.longitude.toFixed(4)}), ` +
            `jumping midpoint`
        )
        currentMidpoint = bestOrigin
      }
    }

    // Phase 1: Compute dynamic thresholds after first successful route data
    if (thresholds.averageTravelTime === 0) {
      thresholds = computeConvergenceThresholds(travelTimes)
      console.log(
        `Dynamic thresholds set: time diff ${thresholds.maxTimeDiffSeconds.toFixed(0)}s, ` +
          `percentage ${thresholds.maxPercentageDiff.toFixed(1)}%, ` +
          `max iterations ${thresholds.maxIterations} ` +
          `(avg travel time: ${Math.floor(thresholds.averageTravelTime / 60)}m)`
      )
    }

    const timeDifference = best.timeDifference
    const percentageDiff = best.percentageDiff

    console.log(
      `Iteration ${i + 1}: Best of ${candidates.length} candidates — ` +
        `Times: [${travelTimes.map((t) => `${Math.floor(t / 60)}m`).join(", ")}] | ` +
        `Diff: ${Math.floor(timeDifference / 60)}m ${timeDifference % 60}s (${percentageDiff.toFixed(1)}%)`
    )

    iterations.push({
      midpoint: { ...currentMidpoint },
      timeDifference,
      percentageDiff,
      isBest: false,
      iteration: i + 1,
      candidatesTested: candidates.length,
      travelTimes: [...travelTimes],
      thresholds: { ...thresholds },
    })

    // Check convergence against dynamic thresholds
    if (
      timeDifference <= thresholds.maxTimeDiffSeconds ||
      percentageDiff <= thresholds.maxPercentageDiff
    ) {
      bestMidpoint = currentMidpoint
      bestIterationIndex = iterations.length - 1
      break
    }

    // Track best iteration by composite convergence score
    const convergenceScore = Math.min(
      timeDifference / thresholds.maxTimeDiffSeconds,
      percentageDiff / thresholds.maxPercentageDiff
    )

    if (convergenceScore < minConvergenceScore) {
      minConvergenceScore = convergenceScore
      bestMidpoint = currentMidpoint
      bestIterationIndex = iterations.length - 1
    }

    // --- Compute shift target ---
    let target: Coordinates

    if (isMultiPerson) {
      // For 3+ people: use gradient-based shift — each person exerts a pull
      // proportional to how much their travel time exceeds the mean
      target = computeGradientTarget(currentMidpoint, coordinates, travelTimes)
    } else {
      // For 2 people: weighted centroid works perfectly
      target = computeWeightedCentroid(coordinates, travelTimes)
    }

    // Step size derived from imbalance, clamped to [0.1, 0.5]
    // For first iteration with large imbalance, use larger alpha to jump
    // closer to the target (0.5 for multi-person, 1.0 for 2-person)
    let alpha: number
    if (isFirstIteration && percentageDiff > 100) {
      // Large initial imbalance: jump aggressively toward target
      alpha = isMultiPerson ? 0.3 : 1.0
      console.log(
        `Iteration ${i + 1}: Large initial imbalance (${percentageDiff.toFixed(0)}%), jumping with alpha=${alpha}`
      )
    } else {
      // Multi-person uses smaller steps to avoid overshooting past barriers
      const maxAlpha = isMultiPerson ? 0.3 : 0.5
      alpha = Math.max(0.1, Math.min(maxAlpha, percentageDiff / 100))
    }
    isFirstIteration = false

    // Oscillation detection: position-based and time-based
    midpointHistory.push({ ...currentMidpoint })

    // Time-domain oscillation: detect when the farthest person has flipped
    // at least once in recent iterations — a sign of a barrier between origins
    const maxTimeIndex = travelTimes.indexOf(Math.max(...travelTimes))
    let timeOscillation = false
    if (!isMultiPerson && iterations.length >= 2) {
      let flips = 0
      let lastMaxIdx = maxTimeIndex
      for (let j = iterations.length - 1; j >= 0 && j >= iterations.length - 3; j--) {
        const prevTimes = iterations[j].travelTimes ?? []
        if (prevTimes.length < 2) continue
        const prevMaxIdx = prevTimes.indexOf(Math.max(...prevTimes))
        if (prevMaxIdx !== lastMaxIdx) {
          flips++
          lastMaxIdx = prevMaxIdx
        }
      }
      // At least one flip in the last 3 iterations means barrier oscillation
      if (flips >= 1) {
        timeOscillation = true
      }
    }

    const positionOscillation =
      midpointHistory.length >= 3 &&
      coordDistance(
        currentMidpoint,
        midpointHistory[midpointHistory.length - 3]
      ) < OSCILLATION_THRESHOLD

    if (positionOscillation || timeOscillation) {
      if (isMultiPerson) {
        // For multi-person oscillation: set midpoint to average of
        // oscillating positions and stop iterating — we've found the
        // best the algorithm can do for this arrangement
        const twoAgo = midpointHistory[midpointHistory.length - 3]
        if (twoAgo) {
          currentMidpoint = {
            latitude: (currentMidpoint.latitude + twoAgo.latitude) / 2,
            longitude: (currentMidpoint.longitude + twoAgo.longitude) / 2,
          }
        }
        console.log(
          `Iteration ${i + 1}: Multi-person oscillation detected, settling at average position`
        )
        // Use this as the best midpoint if it's better
        bestMidpoint = currentMidpoint
        bestIterationIndex = iterations.length - 1
        break
      } else {
        alpha *= 0.5
        oscillationDetected = true
        // Grant extra iterations to work through barrier oscillation (once only)
        if (
          thresholds.maxIterations - i <= 1 &&
          extraIterationsGranted < MAX_EXTRA_ITERATIONS
        ) {
          const grant = MAX_EXTRA_ITERATIONS - extraIterationsGranted
          thresholds = {
            ...thresholds,
            maxIterations: thresholds.maxIterations + grant,
          }
          extraIterationsGranted += grant
          console.log(
            `Iteration ${i + 1}: Oscillation detected, reducing alpha to ${alpha.toFixed(3)} and granting ${grant} extra iterations (max now ${thresholds.maxIterations})`
          )
        } else if (extraIterationsGranted > 0) {
          // Already granted extra iterations and still oscillating — give up
          console.log(
            `Iteration ${i + 1}: Still oscillating after extra iterations, stopping`
          )
          break
        } else {
          console.log(
            `Iteration ${i + 1}: Oscillation detected, reducing alpha to ${alpha.toFixed(3)}`
          )
        }
      }
    }

    // Shift toward target (for multi-person this is the gradient-based target;
    // for 2-person this is the weighted centroid)
    currentMidpoint = {
      latitude:
        currentMidpoint.latitude +
        alpha * (target.latitude - currentMidpoint.latitude),
      longitude:
        currentMidpoint.longitude +
        alpha * (target.longitude - currentMidpoint.longitude),
    }
  }

  // Mark the best iteration
  if (iterations[bestIterationIndex]) {
    iterations[bestIterationIndex].isBest = true
  }

  // Use the best midpoint found for final venue search
  const finalPlaces = await fetchNearbyActivities(bestMidpoint, 15)

  return {
    coordinates,
    midpoint: bestMidpoint,
    places: finalPlaces,
    iterations,
    performance: {
      foundOnIteration: iterations[bestIterationIndex]?.iteration ?? 1,
      timeDifference: iterations[bestIterationIndex]?.timeDifference ?? 0,
      percentageDiff: iterations[bestIterationIndex]?.percentageDiff ?? 0,
      thresholds,
    },
    snap: snapResult
      ? {
          originalCentroid: geometricCentroid,
          snappedTo: snapResult.location,
          snapDistanceKm: snapResult.snapDistanceKm,
          cityName: snapResult.cityName,
        }
      : undefined,
  }
}

export const search = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const data = input as { placeIds: Array<string> }
    if (!Array.isArray(data.placeIds) || data.placeIds.length < 2) {
      throw new Error("At least 2 place IDs are required")
    }
    return data
  })
  .handler(async ({ data }) => searchHandler(data))
