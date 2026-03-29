export type Coordinates = {
  latitude: number
  longitude: number
}

export type ConvergenceThresholds = {
  maxTimeDiffSeconds: number
  maxPercentageDiff: number
  maxIterations: number
  averageTravelTime: number
}

export type IterationResult = {
  midpoint: Coordinates
  timeDifference: number
  percentageDiff: number
  isBest: boolean
  iteration: number
  candidatesTested?: number
  travelTimes?: Array<number>
  thresholds?: ConvergenceThresholds
}

export type Place = {
  id: string
  formattedAddress: string
  rating: number
  googleMapsUri: string
  websiteUri: string
  displayName: {
    text: string
  }
  currentOpeningHours?: {
    weekdayDescriptions: Array<string>
  }
  types: Array<string>
}

export type SnapResult = {
  location: Coordinates
  snapDistanceKm: number
  cityName: string
}

export type SearchResult = {
  coordinates: Array<Coordinates>
  midpoint: Coordinates
  places: Array<Place>
  iterations: Array<IterationResult>
  performance: {
    foundOnIteration: number
    timeDifference: number
    percentageDiff: number
    thresholds: ConvergenceThresholds
  }
  snap?: {
    originalCentroid: Coordinates
    snappedTo: Coordinates
    snapDistanceKm: number
    cityName: string
  }
}
