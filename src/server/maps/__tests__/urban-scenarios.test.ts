import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  SCENARIOS,
  createWorldFromScenario,
  scoreResult,
} from "./test-simulation"
import type { SearchResult } from "@/server/maps/types"
import type { Scenario, ScoreResult } from "./test-simulation"
import { fetchNearbyActivities } from "@/server/maps/fetch-nearby-activities"
import { fetchNearbyCities } from "@/server/maps/fetch-nearby-cities"
import { fetchPlaceDetails } from "@/server/maps/fetch-place-details"
import { fetchRoute } from "@/server/maps/fetch-route"
import { fetchRouteMatrix } from "@/server/maps/fetch-route-matrix"
import { searchHandler } from "@/server/maps/search"
import { snapMidpointToPopulatedArea } from "@/server/maps/snap-midpoint"


// Mock all API functions
vi.mock("@/server/maps/fetch-place-details", () => ({
  fetchPlaceDetails: vi.fn(),
}))
vi.mock("@/server/maps/fetch-nearby-activities", () => ({
  fetchNearbyActivities: vi.fn(),
}))
vi.mock("@/server/maps/fetch-nearby-cities", () => ({
  fetchNearbyCities: vi.fn(),
}))
vi.mock("@/server/maps/fetch-route-matrix", () => ({
  fetchRouteMatrix: vi.fn(),
}))
vi.mock("@/server/maps/fetch-route", () => ({
  fetchRoute: vi.fn(),
}))
vi.mock("@/server/maps/snap-midpoint", () => ({
  snapMidpointToPopulatedArea: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function runScenario(scenario: Scenario): Promise<{
  result: SearchResult
  score: ScoreResult
}> {
  const world = createWorldFromScenario(scenario)

  vi.mocked(fetchPlaceDetails).mockImplementation(world.mockFetchPlaceDetails)
  vi.mocked(fetchNearbyActivities).mockImplementation(
    world.mockFetchNearbyActivities
  )
  vi.mocked(fetchNearbyCities).mockImplementation(world.mockFetchNearbyCities)
  vi.mocked(fetchRouteMatrix).mockImplementation(world.mockFetchRouteMatrix)
  vi.mocked(fetchRoute).mockImplementation(world.mockFetchRoute)
  vi.mocked(snapMidpointToPopulatedArea).mockImplementation(
    world.mockSnapMidpointToPopulatedArea
  )

  const result = await searchHandler({
    placeIds: scenario.origins.map((o) => o.placeId),
  })

  // Find best iteration's travel times
  const bestIteration = result.iterations.find((iter) => iter.isBest)
  const travelTimes = bestIteration?.travelTimes ?? []

  const score = scoreResult(
    travelTimes.length > 0 ? travelTimes : [0, 0],
    result.performance.foundOnIteration,
    result.performance.thresholds.maxIterations
  )

  return { result, score }
}

describe("urban 2-person scenarios", () => {
  for (const [, scenario] of Object.entries(SCENARIOS)) {
    // Only test 2-person scenarios here
    if (scenario.origins.length !== 2) continue
    // Skip barrier scenarios (those are in geographic-barriers.test.ts)
    if (scenario.barriers && scenario.barriers.length > 0) continue

    it(`${scenario.name}: finds fair midpoint`, async () => {
      const { result, score } = await runScenario(scenario)

      console.log(
        `[${scenario.name}] Fairness: ${score.fairnessScore}, ` +
          `Efficiency: ${score.efficiencyScore}, Overall: ${score.overallScore} | ` +
          `Time diff: ${score.metrics.timeDifferenceSeconds}s (${score.metrics.percentageDiff}%), ` +
          `Iterations: ${score.metrics.iterationsUsed}/${result.performance.thresholds.maxIterations}`
      )

      expect(score.fairnessScore).toBeGreaterThanOrEqual(
        scenario.minFairnessScore
      )
      expect(score.overallScore).toBeGreaterThanOrEqual(
        scenario.minOverallScore
      )
      expect(result.places.length).toBeGreaterThan(0)
    })
  }
})
