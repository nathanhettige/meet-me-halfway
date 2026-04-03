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
      <DrawerContent className="max-h-[85svh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-left text-xl">
                {place.displayName.text}
              </DrawerTitle>
              <DrawerDescription className="mt-1 flex items-center gap-1 text-left">
                <MapPin className="h-3 w-3" />
                {suburb}
              </DrawerDescription>
            </div>

            {/* Rating badge */}
            <div className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-foreground">
                {place.rating?.toFixed(1) || "—"}
              </span>
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          {/* Address */}
          <div className="mb-4 rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-foreground">{place.formattedAddress}</p>
          </div>

          {/* Opening hours */}
          {place.currentOpeningHours?.weekdayDescriptions && (
            <div className="mb-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4" />
                Opening Hours
              </h4>
              <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                {place.currentOpeningHours.weekdayDescriptions.map(
                  (day, index) => (
                    <p
                      key={index}
                      className="text-sm text-muted-foreground"
                    >
                      {day}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          {/* Place types/categories */}
          {place.types.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {place.types
                  .filter(
                    (t) => !["establishment", "point_of_interest"].includes(t)
                  )
                  .slice(0, 5)
                  .map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {formatPlaceType(type)}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Action buttons */}
        <div className="flex gap-3 border-t border-border p-4">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleDirections}
          >
            <Navigation className="h-4 w-4" />
            Directions
          </Button>
          {place.websiteUri && (
            <Button className="flex-1 gap-2" onClick={handleWebsite}>
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
