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

export type PlacePhoto = {
  name: string
  widthPx: number
  heightPx: number
}

export type PlaceAddressComponent = {
  longText: string
  shortText: string
  types: Array<string>
}

export type Place = {
  id: string
  formattedAddress: string
  addressComponents?: Array<PlaceAddressComponent>
  location: Coordinates
  rating: number
  googleMapsUri: string
  websiteUri: string
  displayName: {
    text: string
  }
  currentOpeningHours?: {
    openNow?: boolean
    weekdayDescriptions: Array<string>
  }
  types: Array<string>
  photos?: Array<PlacePhoto>
  priceLevel?: string
  userRatingCount?: number
  businessStatus?: string
  editorialSummary?: {
    text: string
  }
  reviews?: Array<{
    text?: { text: string }
    rating: number
    relativePublishTimeDescription?: string
    authorAttribution?: { displayName: string }
  }>
}

/** Lightweight place returned by minimal Nearby Search (only id, location, displayName, businessStatus) */
export type MinimalPlace = {
  id: string
  location: Coordinates
  displayName: {
    text: string
  }
  businessStatus?: string
}

export type SnapResult = {
  location: Coordinates
  snapDistanceKm: number
  cityName: string
}

export type PlaceDriveTime = {
  durationSeconds: number
  distanceMeters: number
}

export type SearchResult = {
  coordinates: Array<Coordinates>
  origins: Array<{ locality: string; coordinates: Coordinates }>
  midpoint: Coordinates
  places: Array<Place>
  driveTimes: Record<string, Array<PlaceDriveTime>>
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
