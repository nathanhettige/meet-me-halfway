import { Car, Star } from "lucide-react"
import type { Place, PlaceDriveTime } from "@/server/maps/types"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlacePhoto } from "@/hooks/use-maps"

type PlaceCardProps = {
  place: Place
  driveTimes?: Array<PlaceDriveTime>
  onSelect: () => void
}

export function PlaceCard({ place, driveTimes, onSelect }: PlaceCardProps) {
  const locality = place.addressComponents?.find((c) =>
    c.types?.includes("locality")
  )?.longText
  const category = formatPlaceType(place.types[0])
  const rating = place.rating || 0

  const avgDrive = computeAvgDrive(driveTimes)
  const avgDriveLabel = avgDrive != null ? formatDuration(avgDrive) : undefined

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
        <h3 className="text-[15px] leading-tight font-bold text-foreground">
          {place.displayName.text}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{locality}</span>
          {place.priceLevel && (
            <>
              <span>·</span>
              <span className="flex-shrink-0">
                {formatPriceLevel(place.priceLevel)}
              </span>
            </>
          )}
          {avgDriveLabel && (
            <>
              <span>·</span>
              <span className="flex-shrink-0 inline-flex items-center gap-0.5">
                <Car className="size-3" />
                {avgDriveLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function computeAvgDrive(
  driveTimes?: Array<PlaceDriveTime>,
): number | undefined {
  if (!driveTimes || driveTimes.length === 0) return undefined
  const valid = driveTimes.filter((t) => t.durationSeconds > 0)
  if (valid.length === 0) return undefined
  const sum = valid.reduce((acc, t) => acc + t.durationSeconds, 0)
  return sum / valid.length
}

function formatDuration(seconds: number): string | undefined {
  const minutes = Math.round(seconds / 60)
  if (minutes === 0) return undefined
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

function formatPriceLevel(priceLevel: string): string {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: "free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  }
  return map[priceLevel] ?? ""
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
