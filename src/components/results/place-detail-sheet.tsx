import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Star,
} from "lucide-react"
import type { Place } from "@/server/maps/types"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePlacePhoto } from "@/hooks/use-maps"

type PlaceDetailSheetProps = {
  place: Place | null
  onClose: () => void
}

export function PlaceDetailSheet({ place, onClose }: PlaceDetailSheetProps) {
  const firstPhoto = place?.photos?.[0]
  const photoQuery = usePlacePhoto(firstPhoto)

  if (!place) return null

  const locality = place.addressComponents?.find((c) =>
    c.types?.includes("locality")
  )?.longText
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
        {/* Hero photo */}
        {photoQuery.data ? (
          <div className="mx-4 mt-2 overflow-hidden rounded-xl">
            <img
              src={photoQuery.data}
              alt={place.displayName.text}
              className="h-48 w-full object-cover"
            />
          </div>
        ) : photoQuery.isLoading ? (
          <Skeleton className="mx-4 mt-2 h-48 rounded-xl" />
        ) : null}

        <DrawerHeader className="pt-4 pb-2">
          <DrawerTitle className="text-left text-2xl font-bold text-balance">
            {place.displayName.text}
          </DrawerTitle>

          <DrawerDescription className="mt-0 flex items-center gap-1.5 text-left text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{locality}</span>
          </DrawerDescription>

          {/* Star rating */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-sm text-foreground">
              {rating ? rating.toFixed(1) : "N/A"}
            </span>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < fullStars
                      ? "fill-amber-400 text-amber-400"
                      : i === fullStars && hasHalfStar
                        ? "fill-amber-400/50 text-amber-400"
                        : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            {place.userRatingCount && (
              <span className="text-sm text-muted-foreground">
                ({place.userRatingCount.toLocaleString()})
              </span>
            )}
          </div>

          {/* Category pills */}
          {place.types.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {place.types
                .filter(
                  (t) => !["establishment", "point_of_interest"].includes(t)
                )
                .slice(0, 3)
                .map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-sky-blue/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-sky-blue uppercase"
                  >
                    {formatPlaceType(type)}
                  </span>
                ))}
            </div>
          )}
        </DrawerHeader>

        <ScrollArea className="max-h-[40svh] flex-1 px-4">
          {/* Address card */}
          <div className="mb-4 rounded-xl bg-muted/40 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {place.formattedAddress}
            </p>
          </div>

          {/* Opening hours */}
          {place.currentOpeningHours && (
            <OpeningHours hours={place.currentOpeningHours} />
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

function OpeningHours({
  hours,
}: {
  hours: NonNullable<Place["currentOpeningHours"]>
}) {
  const [expanded, setExpanded] = useState(false)
  const { openNow, weekdayDescriptions } = hours

  return (
    <div className="mb-4 rounded-xl bg-muted/40">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {openNow === true ? (
            <span className="text-sm font-semibold text-emerald-500">
              open now
            </span>
          ) : (
            <span className="text-sm font-semibold text-foreground">
              opening hours
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {openNow === false && (
            <span className="text-sm font-semibold text-red-400">
              closed now
            </span>
          )}
          {weekdayDescriptions && weekdayDescriptions.length > 0 && (
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && weekdayDescriptions && weekdayDescriptions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.15, ease: "easeInOut" },
            }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 px-4 pt-2.5 pb-3">
              {weekdayDescriptions.map((day, index) => (
                <p
                  key={index}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {day}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
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
