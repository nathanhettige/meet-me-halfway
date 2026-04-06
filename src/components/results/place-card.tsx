import { MapPin, Star } from "lucide-react"
import type { Place } from "@/server/maps/types"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlacePhoto } from "@/hooks/use-maps"

type PlaceCardProps = {
  place: Place
  onSelect: () => void
}

export function PlaceCard({ place, onSelect }: PlaceCardProps) {
  const suburb = extractSuburb(place.formattedAddress)
  const category = formatPlaceType(place.types[0])
  const rating = place.rating || 0

  const firstPhoto = place.photos?.[0]
  const photoQuery = usePlacePhoto(firstPhoto)

  return (
    <div className="group cursor-pointer" onClick={onSelect}>
      {/* Photo card */}
      <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-muted shadow-md transition-transform duration-300 active:scale-[0.98]">
        {photoQuery.data ? (
          <img
            src={photoQuery.data}
            alt={place.displayName.text}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : photoQuery.isLoading ? (
          <Skeleton className="size-full rounded-none" />
        ) : (
          <div className="size-full bg-gradient-to-br from-sky-blue/20 to-muted" />
        )}

        {/* Category badge — top-left */}
        {category && (
          <span className="absolute top-3 left-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
            {category}
          </span>
        )}

        {/* Rating badge — top-right */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[12px] font-bold text-white">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Text below the card */}
      <div className="mt-2.5 px-1">
        <h3 className="text-[15px] leading-snug font-bold text-foreground">
          {place.displayName.text}
        </h3>
        <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{suburb}</span>
        </div>
      </div>
    </div>
  )
}

function extractSuburb(address: string): string {
  const parts = address.split(",").map((p) => p.trim())
  if (parts.length >= 2) {
    return parts[1]
  }
  return parts[0] || address
}

function formatPlaceType(type?: string): string {
  if (!type) return ""

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
