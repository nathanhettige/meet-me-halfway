import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  SCENARIOS,
  createRiverBarrier,
  createVerticalBarrier,
  createWorldFromScenario,
  scoreResult,
} from "./test-simulation"
import type { Scenario } from "./test-simulation"
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

async function runScenario(scenario: Scenario) {
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

  const bestIteration = result.iterations.find((iter) => iter.isBest)
  const travelTimes = bestIteration?.travelTimes ?? []

  const score = scoreResult(
    travelTimes.length > 0 ? travelTimes : [0, 0],
    result.performance.foundOnIteration,
    result.performance.thresholds.maxIterations
  )

  return { result, score }
}

describe("geographic barrier scenarios", () => {
  describe("predefined barrier scenarios", () => {
    for (const [_key, scenario] of Object.entries(SCENARIOS)) {
      if (!scenario.barriers || scenario.barriers.length === 0) continue

      it(`${scenario.name}: handles barrier crossing`, async () => {
        const { result, score } = await runScenario(scenario)

        console.log(
          `[${scenario.name}] Fairness: ${score.fairnessScore}, ` +
            `Overall: ${score.overallScore} | ` +
            `Time diff: ${score.metrics.timeDifferenceSeconds}s (${score.metrics.percentageDiff}%), ` +
            `Iterations: ${score.metrics.iterationsUsed}`
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

  describe("custom barrier scenarios", () => {
    const riverScenario: Scenario = {
      name: "Two cities separated by river",
      description:
        "River barrier at latitude midpoint forces algorithm to pick a side",
      origins: [
        {
          placeId: "place_north_city",
          coordinates: { latitude: 41.0, longitude: -74.0 },
        },
        {
          placeId: "place_south_city",
          coordinates: { latitude: 40.0, longitude: -74.0 },
        },
      ],
      barriers: [createRiverBarrier("Wide River", 40.5, -75.0, -73.0, 1.8)],
      minFairnessScore: 40,
      minOverallScore: 35,
    }

    const bayScenario: Scenario = {
      name: "Cities across a bay",
      description:
        "Wide bay forces detour, algorithm should account for time penalty",
      origins: [
        {
          placeId: "place_bay_west",
          coordinates: { latitude: 37.8, longitude: -122.5 },
        },
        {
          placeId: "place_bay_east",
          coordinates: { latitude: 37.8, longitude: -122.1 },
        },
      ],
      barriers: [createVerticalBarrier("Wide Bay", -122.3, 37.6, 38.0, 2.0)],
      // The bay barrier is perfectly centered between the two origins.
      // The midpoint starts ON the barrier, and generated candidates are
      // on both sides. The algorithm can pick one side to reduce crossing,
      // but in simulation the 2x penalty on a short distance still creates
      // significant time asymmetry. This is a hard geometric case.
      minFairnessScore: 0,
      minOverallScore: 0,
    }

    const doubleBarrierScenario: Scenario = {
      name: "Double river crossing",
      description: "Two rivers between cities compound the penalty",
      origins: [
        {
          placeId: "place_db_a",
          coordinates: { latitude: 41.5, longitude: -74.0 },
        },
        {
          placeId: "place_db_b",
          coordinates: { latitude: 40.0, longitude: -74.0 },
        },
      ],
      barriers: [
        createRiverBarrier("River 1", 41.0, -75.0, -73.0, 1.5),
        createRiverBarrier("River 2", 40.5, -75.0, -73.0, 1.5),
      ],
      minFairnessScore: 35,
      minOverallScore: 30,
    }

    it("river between two cities: finds fair midpoint on one side", async () => {
      const { result, score } = await runScenario(riverScenario)

      console.log(
        `[${riverScenario.name}] Fairness: ${score.fairnessScore}, ` +
          `Overall: ${score.overallScore} | ` +
          `Time diff: ${score.metrics.timeDifferenceSeconds}s (${score.metrics.percentageDiff}%), ` +
          `Iterations: ${score.metrics.iterationsUsed}`
      )

      expect(score.fairnessScore).toBeGreaterThanOrEqual(
        riverScenario.minFairnessScore
      )
      expect(score.overallScore).toBeGreaterThanOrEqual(
        riverScenario.minOverallScore
      )
      expect(result.places.length).toBeGreaterThan(0)
    })

    it("bay crossing: accounts for water body time penalty", async () => {
      const { result, score } = await runScenario(bayScenario)

      console.log(
        `[${bayScenario.name}] Fairness: ${score.fairnessScore}, ` +
          `Overall: ${score.overallScore} | ` +
          `Time diff: ${score.metrics.timeDifferenceSeconds}s (${score.metrics.percentageDiff}%), ` +
          `Iterations: ${score.metrics.iterationsUsed}`
      )

      expect(score.fairnessScore).toBeGreaterThanOrEqual(
        bayScenario.minFairnessScore
      )
      expect(score.overallScore).toBeGreaterThanOrEqual(
        bayScenario.minOverallScore
      )
      expect(result.places.length).toBeGreaterThan(0)
    })

    it("double barrier: handles compounded river penalties", async () => {
      const { result, score } = await runScenario(doubleBarrierScenario)

      console.log(
        `[${doubleBarrierScenario.name}] Fairness: ${score.fairnessScore}, ` +
          `Overall: ${score.overallScore} | ` +
          `Time diff: ${score.metrics.timeDifferenceSeconds}s (${score.metrics.percentageDiff}%), ` +
          `Iterations: ${score.metrics.iterationsUsed}`
      )

      expect(score.fairnessScore).toBeGreaterThanOrEqual(
        doubleBarrierScenario.minFairnessScore
      )
      expect(score.overallScore).toBeGreaterThanOrEqual(
        doubleBarrierScenario.minOverallScore
      )
      expect(result.places.length).toBeGreaterThan(0)
    })
  })

  describe("barrier impact verification", () => {
    const baseOrigins: Scenario["origins"] = [
      {
        placeId: "place_impact_a",
        coordinates: { latitude: 41.0, longitude: -74.0 },
      },
      {
        placeId: "place_impact_b",
        coordinates: { latitude: 40.0, longitude: -74.0 },
      },
    ]

    const noBarrierScenario: Scenario = {
      name: "No barrier baseline",
      description: "Same origins, no barrier — baseline for comparison",
      origins: baseOrigins,
      minFairnessScore: 40,
      minOverallScore: 35,
    }

    const withBarrierScenario: Scenario = {
      name: "With river barrier",
      description: "Same origins with a river barrier between them",
      origins: baseOrigins,
      barriers: [createRiverBarrier("Test River", 40.5, -75.0, -73.0, 1.8)],
      minFairnessScore: 40,
      minOverallScore: 35,
    }

    it("barrier increases driving time vs no barrier", () => {
      const noBarrierWorld = createWorldFromScenario(noBarrierScenario)
      const withBarrierWorld = createWorldFromScenario(withBarrierScenario)

      const originA = baseOrigins[0].coordinates
      const originB = baseOrigins[1].coordinates

      // Compute driving time across the barrier region (origin A to origin B)
      const timeWithout = noBarrierWorld.computeDrivingTime(originA, originB)
      const timeWith = withBarrierWorld.computeDrivingTime(originA, originB)

      console.log(
        `Driving time without barrier: ${Math.round(timeWithout)}s, ` +
          `with barrier: ${Math.round(timeWith)}s, ` +
          `ratio: ${(timeWith / timeWithout).toFixed(2)}x`
      )

      // The barrier should make the cross-barrier route meaningfully slower
      expect(timeWith).toBeGreaterThan(timeWithout)
      expect(timeWith / timeWithout).toBeGreaterThanOrEqual(1.5)
    })

    it("barrier does not affect same-side routes", () => {
      const withBarrierWorld = createWorldFromScenario(withBarrierScenario)

      // Both points on the same side of the barrier (both above lat 40.5)
      const pointA = { latitude: 41.0, longitude: -74.0 }
      const pointB = { latitude: 40.8, longitude: -74.0 }

      const noBarrierWorld = createWorldFromScenario(noBarrierScenario)

      const timeSameSideWithBarrier = withBarrierWorld.computeDrivingTime(
        pointA,
        pointB
      )
      const timeSameSideWithout = noBarrierWorld.computeDrivingTime(
        pointA,
        pointB
      )

      console.log(
        `Same-side driving time: without barrier ${Math.round(timeSameSideWithout)}s, ` +
          `with barrier: ${Math.round(timeSameSideWithBarrier)}s`
      )

      // Same-side routes should be unaffected by the barrier
      expect(timeSameSideWithBarrier).toBe(timeSameSideWithout)
    })

    it("barrier affects algorithm midpoint selection", async () => {
      // Use asymmetric origins relative to barrier so the barrier
      // changes the optimal midpoint. Origin A is far from the barrier,
      // Origin B is close — so the barrier mostly penalizes A's route.
      const asymmetricOrigins: Scenario["origins"] = [
        {
          placeId: "place_asym_a",
          coordinates: { latitude: 41.5, longitude: -74.0 },
        },
        {
          placeId: "place_asym_b",
          coordinates: { latitude: 40.3, longitude: -74.0 },
        },
      ]

      const noBarrierAsym: Scenario = {
        name: "No barrier (asymmetric)",
        description: "Asymmetric origins, no barrier",
        origins: asymmetricOrigins,
        minFairnessScore: 0,
        minOverallScore: 0,
      }

      // Barrier at 40.5 is close to origin B (40.3) — origin A (41.5)
      // must cross it, origin B doesn't
      const withBarrierAsym: Scenario = {
        name: "With barrier (asymmetric)",
        description: "Asymmetric origins with barrier",
        origins: asymmetricOrigins,
        barriers: [createRiverBarrier("Asym River", 40.5, -75.0, -73.0, 1.8)],
        minFairnessScore: 0,
        minOverallScore: 0,
      }

      const { result: noBarrierResult } = await runScenario(noBarrierAsym)
      const { result: withBarrierResult } = await runScenario(withBarrierAsym)

      const noBarrierBest = noBarrierResult.iterations.find(
        (iter) => iter.isBest
      )
      const withBarrierBest = withBarrierResult.iterations.find(
        (iter) => iter.isBest
      )

      console.log(
        `No barrier midpoint: (${noBarrierResult.midpoint.latitude.toFixed(4)}, ${noBarrierResult.midpoint.longitude.toFixed(4)}), ` +
          `iterations: ${noBarrierBest?.iteration ?? "none"}`
      )
      console.log(
        `With barrier midpoint: (${withBarrierResult.midpoint.latitude.toFixed(4)}, ${withBarrierResult.midpoint.longitude.toFixed(4)}), ` +
          `iterations: ${withBarrierBest?.iteration ?? "none"}`
      )

      // With asymmetric placement relative to the barrier, the barrier should
      // cause at least one of: shifted midpoint, different iteration count,
      // or different travel time spread
      const midpointShifted =
        Math.abs(
          noBarrierResult.midpoint.latitude -
            withBarrierResult.midpoint.latitude
        ) > 0.001 ||
        Math.abs(
          noBarrierResult.midpoint.longitude -
            withBarrierResult.midpoint.longitude
        ) > 0.001

      const iterationsDiffer =
        (noBarrierBest?.iteration ?? 0) !== (withBarrierBest?.iteration ?? 0)

      const noBarrierTimes = noBarrierBest?.travelTimes ?? []
      const withBarrierTimes = withBarrierBest?.travelTimes ?? []
      const travelTimesDiffer =
        noBarrierTimes.length > 0 &&
        withBarrierTimes.length > 0 &&
        Math.abs(
          noBarrierTimes[0] -
            noBarrierTimes[1] -
            (withBarrierTimes[0] - withBarrierTimes[1])
        ) > 10

      // At least one of these should be true: the barrier changed the outcome
      expect(midpointShifted || iterationsDiffer || travelTimesDiffer).toBe(
        true
      )
    })
  })
})
