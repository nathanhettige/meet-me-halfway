export type Coordinates = {
  latitude: number
  longitude: number
}

export type IterationResult = {
  midpoint: Coordinates
  timeDifference: number
  percentageDiff: number
  isBest: boolean
  iteration: number
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

export type SearchResult = {
  coordinates: Array<Coordinates>
  midpoint: Coordinates
  places: Array<Place>
  iterations: Array<IterationResult>
  performance: {
    foundOnIteration: number
    timeDifference: number
    percentageDiff: number
  }
}
