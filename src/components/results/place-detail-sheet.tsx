import { Star, MapPin, Clock, ExternalLink, Navigation } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Place } from "@/server/maps/types"

type PlaceDetailSheetProps = {
  place: Place | null
  onClose: () => void
}

export function PlaceDetailSheet({ place, onClose }: PlaceDetailSheetProps) {
  if (!place) return null

  const suburb = extractSuburb(place.formattedAddress)
  const rating = place.rating || 0
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  const handleDirections = () => {
    // Open in Google Maps app or browser
    window.open(place.googleMapsUri, "_blank")
  }

  const handleWebsite = () => {
    if (place.websiteUri) {
      window.open(place.websiteUri, "_blank")
    }
  }

  return (
    <Drawer open={!!place} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90svh]">
        <DrawerHeader className="pb-3 pt-4">
          {/* Category pills */}
          {place.types.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {place.types
                .filter(
                  (t) => !["establishment", "point_of_interest"].includes(t)
                )
                .slice(0, 3)
                .map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary"
                  >
                    {formatPlaceType(type)}
                  </span>
                ))}
            </div>
          )}

          <DrawerTitle className="text-balance text-left text-2xl font-bold">
            {place.displayName.text}
          </DrawerTitle>

          <DrawerDescription className="mt-1.5 flex items-center gap-1.5 text-left text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{suburb}</span>
          </DrawerDescription>

          {/* Star rating */}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < fullStars
                      ? "fill-amber-400 text-amber-400"
                      : i === fullStars && hasHalfStar
                        ? "fill-amber-400/50 text-amber-400"
                        : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-foreground">
              {rating ? rating.toFixed(1) : "N/A"}
            </span>
          </div>
        </DrawerHeader>

        <ScrollArea className="max-h-[40svh] flex-1 px-4">
          {/* Address card */}
          <div className="mb-4 rounded-xl bg-muted/40 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {place.formattedAddress}
            </p>
          </div>

          {/* Opening hours */}
          {place.currentOpeningHours?.weekdayDescriptions && (
            <div className="mb-4">
              <h4 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Opening Hours
              </h4>
              <div className="space-y-1.5 rounded-xl bg-muted/40 p-4">
                {place.currentOpeningHours.weekdayDescriptions.map(
                  (day, index) => (
                    <p
                      key={index}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {day}
                    </p>
                  )
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex gap-3 p-4 pt-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 rounded-xl"
            onClick={handleDirections}
          >
            <Navigation className="h-4 w-4" />
            Directions
          </Button>
          {place.websiteUri && (
            <Button
              size="lg"
              className="flex-1 gap-2 rounded-xl"
              onClick={handleWebsite}
            >
              <ExternalLink className="h-4 w-4" />
              Website
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
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
  }

  if (type in typeMap) {
    return typeMap[type]
  }

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
