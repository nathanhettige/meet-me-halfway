import { Star, ChevronRight, MapPin } from "lucide-react"
import type { Place } from "@/server/maps/types"
import { cn } from "@/lib/utils"

type PlaceCardProps = {
  place: Place
  onSelect: () => void
}

export function PlaceCard({ place, onSelect }: PlaceCardProps) {
  // Extract suburb from the formatted address (usually after first comma)
  const suburb = extractSuburb(place.formattedAddress)
  
  // Get category from place types
  const category = formatPlaceType(place.types[0])

  return (
    <button
      onClick={onSelect}
      className="group flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left shadow-sm ring-1 ring-border transition-all hover:shadow-md hover:ring-primary/30 active:scale-[0.98]"
    >
      {/* Rating badge */}
      <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-accent">
        <div className="flex items-center gap-0.5">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-foreground">
            {place.rating?.toFixed(1) || "—"}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">rating</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-foreground">
          {place.displayName.text}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{suburb}</span>
        </div>
        {category && (
          <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {category}
          </span>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function extractSuburb(address: string): string {
  // Split by comma and get meaningful parts
  const parts = address.split(",").map((p) => p.trim())
  
  // Usually format is: Street, Suburb, State PostCode, Country
  // We want the suburb (second part) or the first part if only one
  if (parts.length >= 2) {
    // Return suburb and possibly state for context
    return parts[1]
  }
  return parts[0] || address
}

function formatPlaceType(type?: string): string {
  if (!type) return ""
  
  // Convert snake_case to Title Case and handle common types
  const typeMap: Record<string, string> = {
    restaurant: "Restaurant",
    cafe: "Café",
    bar: "Bar",
    coffee_shop: "Coffee",
    bakery: "Bakery",
    park: "Park",
    shopping_mall: "Shopping",
    food: "Food & Drink",
    establishment: "",
    point_of_interest: "",
  }

  if (type in typeMap) {
    return typeMap[type]
  }

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
