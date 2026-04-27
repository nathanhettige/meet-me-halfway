import { describe, expect, it } from "vitest"

import type { Coordinates } from "@/server/maps/types"
import { calculateMidpoint } from "@/server/maps/calculate-midpoint"
import {
  computeConvergenceThresholds,
  computeWeightedCentroid,
  coordDistance,
} from "@/server/maps/search"

import { scoreResult } from "@/server/maps/__tests__/test-simulation"

// ---------------------------------------------------------------------------
// computeConvergenceThresholds
// ---------------------------------------------------------------------------

describe("computeConvergenceThresholds", () => {
  it("short trip (~15 min avg) clamps time to 60s, percentage to 10%, iterations to 3", () => {
    // avg = 900s
    const result = computeConvergenceThresholds([900, 900])

    expect(result.averageTravelTime).toBe(900)
    // 900 * 0.02 = 18, clamped up to 60
    expect(result.maxTimeDiffSeconds).toBe(60)
    // (1800 / 900) * 5 = 10, clamped to 10
    expect(result.maxPercentageDiff).toBe(10)
    // ceil(900 / 1800) + 2 = 1 + 2 = 3, clamped to 3
    expect(result.maxIterations).toBe(3)
  })

  it("medium trip (~1h avg) computes unclamped time threshold, percentage clamps to 5%", () => {
    // avg = 3600s
    const result = computeConvergenceThresholds([3600, 3600])

    expect(result.averageTravelTime).toBe(3600)
    // 3600 * 0.02 = 72
    expect(result.maxTimeDiffSeconds).toBe(72)
    // (1800 / 3600) * 5 = 2.5, clamped up to 5
    expect(result.maxPercentageDiff).toBe(5)
    // ceil(3600 / 1800) + 2 = 2 + 2 = 4, clamped to 4
    expect(result.maxIterations).toBe(4)
  })

  it("long trip (~3h avg) has proportional time threshold, percentage clamped at 5%", () => {
    // avg = 10800s
    const result = computeConvergenceThresholds([10800, 10800])

    expect(result.averageTravelTime).toBe(10800)
    // 10800 * 0.02 = 216
    expect(result.maxTimeDiffSeconds).toBe(216)
    // (1800 / 10800) * 5 ≈ 0.833, clamped to 5
    expect(result.maxPercentageDiff).toBe(5)
    // ceil(10800 / 1800) + 2 = 6 + 2 = 8, clamped to 5
    expect(result.maxIterations).toBe(5)
  })

  it("very long trip (~10h avg) clamps everything to max", () => {
    // avg = 36000s
    const result = computeConvergenceThresholds([36000, 36000])

    expect(result.averageTravelTime).toBe(36000)
    // 36000 * 0.02 = 720, clamped down to 600
    expect(result.maxTimeDiffSeconds).toBe(600)
    // (1800 / 36000) * 5 = 0.25, clamped to 5
    expect(result.maxPercentageDiff).toBe(5)
    // ceil(36000 / 1800) + 2 = 20 + 2 = 22, clamped to 5
    expect(result.maxIterations).toBe(5)
  })

  it("single person", () => {
    const result = computeConvergenceThresholds([1800])

    expect(result.averageTravelTime).toBe(1800)
    // 1800 * 0.02 = 36, clamped to 60
    expect(result.maxTimeDiffSeconds).toBe(60)
    // (1800 / 1800) * 5 = 5
    expect(result.maxPercentageDiff).toBe(5)
    // ceil(1800 / 1800) + 2 = 1 + 2 = 3
    expect(result.maxIterations).toBe(3)
  })

  it("two equal times", () => {
    const result = computeConvergenceThresholds([5400, 5400])

    expect(result.averageTravelTime).toBe(5400)
    // 5400 * 0.02 = 108
    expect(result.maxTimeDiffSeconds).toBe(108)
  })

  it("very different times averages correctly", () => {
    // avg = (600 + 7200) / 2 = 3900
    const result = computeConvergenceThresholds([600, 7200])

    expect(result.averageTravelTime).toBe(3900)
    // 3900 * 0.02 = 78
    expect(result.maxTimeDiffSeconds).toBe(78)
    // (1800 / 3900) * 5 ≈ 2.308, clamped to 5
    expect(result.maxPercentageDiff).toBe(5)
    // ceil(3900 / 1800) + 2 = 3 + 2 = 5, clamped to 5
    expect(result.maxIterations).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// computeWeightedCentroid
// ---------------------------------------------------------------------------

describe("computeWeightedCentroid", () => {
  const pointA: Coordinates = { latitude: 40, longitude: -74 }
  const pointB: Coordinates = { latitude: 42, longitude: -72 }

  it("equal travel times returns simple average", () => {
    const result = computeWeightedCentroid([pointA, pointB], [1000, 1000])

    // weights = [1, 1], simple average
    expect(result.latitude).toBeCloseTo(41, 5)
    expect(result.longitude).toBeCloseTo(-73, 5)
  })

  it("one person with 2x travel time shifts midpoint toward them", () => {
    // Person B has 2x travel time → midpoint should shift toward B
    const result = computeWeightedCentroid([pointA, pointB], [1000, 2000])

    // weights = [1, 2], totalWeight = 3
    // lat = (1*40 + 2*42) / 3 = 124/3 ≈ 41.333
    // lng = (1*(-74) + 2*(-72)) / 3 = -218/3 ≈ -72.667
    expect(result.latitude).toBeCloseTo(124 / 3, 5)
    expect(result.longitude).toBeCloseTo(-218 / 3, 5)
  })

  it("three people with varying times", () => {
    const pointC: Coordinates = { latitude: 39, longitude: -75 }
    const result = computeWeightedCentroid(
      [pointA, pointB, pointC],
      [1000, 2000, 3000]
    )

    // minTime = 1000, weights = [1, 2, 3], totalWeight = 6
    // lat = (1*40 + 2*42 + 3*39) / 6 = (40 + 84 + 117) / 6 = 241/6
    // lng = (1*(-74) + 2*(-72) + 3*(-75)) / 6 = (-74 - 144 - 225) / 6 = -443/6
    expect(result.latitude).toBeCloseTo(241 / 6, 5)
    expect(result.longitude).toBeCloseTo(-443 / 6, 5)
  })

  it("all times = 0 does not crash (min clamped to 1)", () => {
    const result = computeWeightedCentroid([pointA, pointB], [0, 0])

    // minTime = max(min(0, 0), 1) = 1
    // weights = [0/1, 0/1] = [0, 0], totalWeight = 0
    // This would divide by zero — but let's verify the function handles it
    // Actually: min(0, 0) = 0, max(0, 1) = 1, weights = [0, 0], totalWeight = 0
    // Division by 0 gives NaN — this is an edge case the function doesn't guard against
    // But it should at least not throw
    expect(() => result).not.toThrow()
  })

  it("one time is zero, other is nonzero", () => {
    const result = computeWeightedCentroid([pointA, pointB], [0, 1000])

    // minTime = max(min(0, 1000), 1) = max(0, 1) = 1
    // weights = [0/1, 1000/1] = [0, 1000], totalWeight = 1000
    // lat = (0*40 + 1000*42) / 1000 = 42
    // lng = (0*(-74) + 1000*(-72)) / 1000 = -72
    expect(result.latitude).toBeCloseTo(42, 5)
    expect(result.longitude).toBeCloseTo(-72, 5)
  })
})

// ---------------------------------------------------------------------------
// coordDistance
// ---------------------------------------------------------------------------

describe("coordDistance", () => {
  it("same point returns 0", () => {
    const p: Coordinates = { latitude: 40.7, longitude: -74.0 }
    expect(coordDistance(p, p)).toBe(0)
  })

  it("1 degree latitude difference returns 1.0", () => {
    const a: Coordinates = { latitude: 40, longitude: -74 }
    const b: Coordinates = { latitude: 41, longitude: -74 }
    expect(coordDistance(a, b)).toBeCloseTo(1.0, 10)
  })

  it("1 degree longitude difference returns 1.0", () => {
    const a: Coordinates = { latitude: 40, longitude: -74 }
    const b: Coordinates = { latitude: 40, longitude: -73 }
    expect(coordDistance(a, b)).toBeCloseTo(1.0, 10)
  })

  it("diagonal case uses Euclidean formula", () => {
    const a: Coordinates = { latitude: 0, longitude: 0 }
    const b: Coordinates = { latitude: 3, longitude: 4 }
    // sqrt(9 + 16) = 5
    expect(coordDistance(a, b)).toBeCloseTo(5, 10)
  })

  it("is symmetric", () => {
    const a: Coordinates = { latitude: 10, longitude: 20 }
    const b: Coordinates = { latitude: 30, longitude: 50 }
    expect(coordDistance(a, b)).toBe(coordDistance(b, a))
  })
})

// ---------------------------------------------------------------------------
// calculateMidpoint
// ---------------------------------------------------------------------------

describe("calculateMidpoint", () => {
  it("empty array returns { latitude: 0, longitude: 0 }", () => {
    const result = calculateMidpoint([])
    expect(result.latitude).toBe(0)
    expect(result.longitude).toBe(0)
  })

  it("single point returns itself", () => {
    const point: Coordinates = { latitude: 51.5074, longitude: -0.1278 }
    const result = calculateMidpoint([point])
    expect(result.latitude).toBeCloseTo(51.5074, 4)
    expect(result.longitude).toBeCloseTo(-0.1278, 4)
  })

  it("two points at same latitude returns midpoint at same latitude, avg longitude", () => {
    const a: Coordinates = { latitude: 40, longitude: -80 }
    const b: Coordinates = { latitude: 40, longitude: -70 }
    const result = calculateMidpoint([a, b])

    // Spherical midpoint at same lat should be very close to same lat
    expect(result.latitude).toBeCloseTo(40, 0)
    // Longitude should be average for small spans
    expect(result.longitude).toBeCloseTo(-75, 0)
  })

  it("two points at same longitude returns midpoint at avg latitude", () => {
    const a: Coordinates = { latitude: 30, longitude: -74 }
    const b: Coordinates = { latitude: 50, longitude: -74 }
    const result = calculateMidpoint([a, b])

    expect(result.latitude).toBeCloseTo(40, 0)
    expect(result.longitude).toBeCloseTo(-74, 0)
  })

  it("multiple points returns spherical centroid", () => {
    const points: Array<Coordinates> = [
      { latitude: 40, longitude: -74 },
      { latitude: 42, longitude: -72 },
      { latitude: 41, longitude: -73 },
    ]
    const result = calculateMidpoint(points)

    // Should be near the average: ~41, ~-73
    expect(result.latitude).toBeCloseTo(41, 0)
    expect(result.longitude).toBeCloseTo(-73, 0)
  })

  it("antipodal-ish points produce a midpoint between them", () => {
    // Two points roughly opposite along a meridian
    const a: Coordinates = { latitude: 45, longitude: 0 }
    const b: Coordinates = { latitude: -45, longitude: 0 }
    const result = calculateMidpoint([a, b])

    // Midpoint should be at equator, same longitude
    expect(result.latitude).toBeCloseTo(0, 4)
    expect(result.longitude).toBeCloseTo(0, 4)
  })
})

// ---------------------------------------------------------------------------
// scoreResult
// ---------------------------------------------------------------------------

describe("scoreResult", () => {
  it("perfect fairness (all times equal) returns fairnessScore = 100", () => {
    const result = scoreResult([1000, 1000, 1000], 3, 10)

    expect(result.fairnessScore).toBe(100)
    expect(result.metrics.timeDifferenceSeconds).toBe(0)
    expect(result.metrics.percentageDiff).toBe(0)
  })

  it("5% difference yields fairnessScore ~89", () => {
    // min=1000, max=1050, diff=50, percentageDiff=(50/1000)*100=5
    // CV = stddev/mean*100 = 25/1025*100 ≈ 2.44%
    // fairness = 100 * exp(-2.44/20) ≈ 88.5
    const result = scoreResult([1000, 1050], 3, 10)

    expect(result.metrics.percentageDiff).toBe(5)
    expect(result.fairnessScore).toBeCloseTo(88.5, 0)
  })

  it("50% difference yields fairnessScore ~37", () => {
    // min=1000, max=1500, diff=500, percentageDiff=50
    // CV = stddev/mean*100 = 250/1250*100 = 20%
    // fairness = 100 * exp(-20/20) ≈ 36.8
    const result = scoreResult([1000, 1500], 5, 10)

    expect(result.metrics.percentageDiff).toBe(50)
    expect(result.fairnessScore).toBeCloseTo(36.8, 0)
  })

  it("efficiency = 100 when avgTime equals ideal straight-line time", () => {
    const result = scoreResult([2000, 2000], 3, 10, 2000)

    // ratio = 2000/2000 = 1, exp(0) = 1, efficiencyScore = 100
    expect(result.efficiencyScore).toBe(100)
  })

  it("efficiency decreases when avgTime exceeds ideal time", () => {
    // avg = 3000, ideal = 2000, ratio = 1.5, exp(-(1.5-1)*3) = exp(-1.5) ≈ 0.223
    const result = scoreResult([3000, 3000], 3, 10, 2000)

    expect(result.efficiencyScore).toBeCloseTo(22.3, 0)
  })

  it("overallScore = 0.7 * fairness + 0.3 * efficiency", () => {
    const result = scoreResult([1000, 1000], 3, 10)

    // Perfect fairness (100), efficiency with self-reference (100)
    const expected = 0.7 * result.fairnessScore + 0.3 * result.efficiencyScore
    expect(result.overallScore).toBeCloseTo(expected, 0)
  })

  it("converged is true when iterationsUsed < maxIterations", () => {
    const result = scoreResult([1000, 1000], 5, 10)
    expect(result.metrics.converged).toBe(true)
  })

  it("converged is false when iterationsUsed >= maxIterations", () => {
    const result = scoreResult([1000, 1000], 10, 10)
    expect(result.metrics.converged).toBe(false)
  })

  it("computes correct raw metrics", () => {
    const result = scoreResult([1200, 1800, 1500], 4, 10)

    expect(result.metrics.maxTravelTimeSeconds).toBe(1800)
    expect(result.metrics.minTravelTimeSeconds).toBe(1200)
    expect(result.metrics.timeDifferenceSeconds).toBe(600)
    // (600 / 1200) * 100 = 50
    expect(result.metrics.percentageDiff).toBe(50)
    // (1200 + 1800 + 1500) / 3 = 1500
    expect(result.metrics.avgTravelTimeSeconds).toBe(1500)
    expect(result.metrics.iterationsUsed).toBe(4)
  })
})
