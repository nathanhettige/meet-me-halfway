import { Star, ChevronRight, MapPin } from "lucide-react"
import type { Place } from "@/server/maps/types"

type PlaceCardProps = {
  place: Place
  onSelect: () => void
}

export function PlaceCard({ place, onSelect }: PlaceCardProps) {
  // Extract suburb from the formatted address (usually after first comma)
  const suburb = extractSuburb(place.formattedAddress)

  // Get category from place types
  const category = formatPlaceType(place.types[0])

  // Generate star display
  const rating = place.rating || 0
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <button
      onClick={onSelect}
      className="group flex w-full items-start gap-4 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border/50 transition-all active:scale-[0.98]"
    >
      {/* Left content */}
      <div className="min-w-0 flex-1">
        {/* Category pill */}
        {category && (
          <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {category}
          </span>
        )}

        {/* Place name */}
        <h3 className="text-balance text-[17px] font-bold leading-snug text-foreground">
          {place.displayName.text}
        </h3>

        {/* Location */}
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{suburb}</span>
        </div>

        {/* Star rating row */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < fullStars
                    ? "fill-amber-400 text-amber-400"
                    : i === fullStars && hasHalfStar
                      ? "fill-amber-400/50 text-amber-400"
                      : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {rating ? rating.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="flex h-full flex-shrink-0 items-center self-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 transition-colors group-hover:bg-primary/10">
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </div>
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
