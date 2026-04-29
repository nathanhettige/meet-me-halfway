import {
  Dumbbell,
  Landmark,
  ShoppingBag,
  Sparkles,
  Trees,
  Utensils,
} from "lucide-react"

export type VenueCategory = {
  id: string
  label: string
  icon: typeof Utensils
  types: Array<string>
}

export const VENUE_CATEGORIES: Array<VenueCategory> = [
  {
    id: "food",
    label: "food & drink",
    icon: Utensils,
    types: ["restaurant", "cafe", "bar", "bakery"],
  },
  {
    id: "entertainment",
    label: "entertainment",
    icon: Sparkles,
    types: [
      "movie_theater",
      "museum",
      "art_gallery",
      "bowling_alley",
      "night_club",
      "casino",
      "amusement_park",
    ],
  },
  {
    id: "outdoors",
    label: "outdoors",
    icon: Trees,
    types: [
      "park",
      "zoo",
      "aquarium",
      "dog_park",
      "playground",
      "ice_skating_rink",
    ],
  },
  {
    id: "shopping",
    label: "shopping",
    icon: ShoppingBag,
    types: ["shopping_mall"],
  },
  {
    id: "wellness",
    label: "wellness",
    icon: Dumbbell,
    types: ["spa", "gym", "sports_complex"],
  },
  {
    id: "culture",
    label: "culture",
    icon: Landmark,
    types: ["library", "tourist_attraction"],
  },
]

export const ALL_CATEGORY_IDS = VENUE_CATEGORIES.map((c) => c.id)
