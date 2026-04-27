import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown,
  Clock,
  Globe,
  MapPin,
  Navigation,
  Star,
} from "lucide-react"
import type { Place } from "@/server/maps/types"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { usePlacePhotos } from "@/hooks/use-maps"

type PlaceDetailSheetProps = {
  place: Place | null
  onClose: () => void
}

const SNAP_POINTS = [0.67, 0.95] as const
type SnapPoint = (typeof SNAP_POINTS)[number]

export function PlaceDetailSheet({ place, onClose }: PlaceDetailSheetProps) {
  const photosQuery = usePlacePhotos(place?.photos, 5)
  const [snap, setSnap] = useState<SnapPoint | null>(SNAP_POINTS[0])

  if (!place) return null

  const rating = place.rating || 0
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  const handleDirections = () => {
    window.open(place.googleMapsUri, "_blank")
  }

  const handleWebsite = () => {
    if (place.websiteUri) {
      window.open(place.websiteUri, "_blank")
    }
  }

  const photoCount = place.photos?.length ? Math.min(place.photos.length, 5) : 0
  const loadedPhotos = photosQuery.urls.filter(Boolean) as Array<string>

  const isExpanded = snap === SNAP_POINTS[1]

  return (
    <Drawer
      open={!!place}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setSnap(SNAP_POINTS[0])
        }
      }}
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={snap}
      setActiveSnapPoint={(s) => setSnap(s as SnapPoint | null)}
      fadeFromIndex={0}
    >
      <DrawerContent>
        <DrawerHeader className="pt-4 pb-3">
          <DrawerTitle className="text-left text-2xl font-bold text-balance">
            {place.displayName.text}
          </DrawerTitle>

          {/* Badge, rating, price level */}
          <div className="flex items-center gap-1">
            {place.types
              .filter(
                (t) => !["establishment", "point_of_interest"].includes(t)
              )
              .slice(0, 1)
              .map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-sky-blue/10 px-2.5 py-0.5 text-[12px] font-semibold tracking-wide text-sky-blue uppercase"
                >
                  {formatPlaceType(type)}
                </span>
              ))}
            <span className="text-[12px] text-muted-foreground">·</span>
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-semibold text-foreground">
                {rating ? rating.toFixed(1) : "N/A"}
              </span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
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
                <span className="text-[12px] text-muted-foreground">
                  ({place.userRatingCount.toLocaleString()})
                </span>
              )}
            </div>
            {place.priceLevel && (
              <>
                <span className="text-[12px] text-muted-foreground">·</span>
                <span className="text-[12px] font-semibold text-muted-foreground">
                  {formatPriceLevel(place.priceLevel)}
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleDirections}
              className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Navigation className="h-3 w-3" />
              directions
            </button>
            {place.websiteUri && (
              <button
                onClick={handleWebsite}
                className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Globe className="h-3 w-3" />
                website
              </button>
            )}
          </div>
        </DrawerHeader>

        {/* Horizontal scrollable photo mosaic */}
        {photoCount > 0 && (
          <div className="px-4 pb-2">
            {loadedPhotos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto">
                {loadedPhotos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${place.displayName.text} photo ${i + 1}`}
                    className="h-36 w-52 shrink-0 rounded-xl object-cover"
                  />
                ))}
              </div>
            ) : photosQuery.isLoading ? (
              <Skeleton className="h-36 rounded-xl" />
            ) : null}
          </div>
        )}

        <div
          className={cn(
            "min-h-0 flex-1 px-4",
            isExpanded ? "overflow-y-auto" : "overflow-hidden"
          )}
        >
          {/* Address card */}
          <div className="mb-4 rounded-xl bg-muted/40 p-4">
            <p className="flex items-start gap-2 text-sm leading-snug text-foreground">
              <MapPin className="mt-px h-4 w-4 shrink-0 text-muted-foreground" />
              {place.formattedAddress}
            </p>
          </div>

          {/* Opening hours */}
          {place.currentOpeningHours && (
            <OpeningHours
              hours={place.currentOpeningHours}
              isExpanded={isExpanded}
              onExpand={() => setSnap(SNAP_POINTS[1])}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function OpeningHours({
  hours,
  isExpanded,
  onExpand,
}: {
  hours: NonNullable<Place["currentOpeningHours"]>
  isExpanded: boolean
  onExpand: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { openNow, weekdayDescriptions } = hours
  const statusLabel =
    openNow === true
      ? { label: "open now", className: "text-emerald-500" }
      : openNow === false
        ? { label: "closed now", className: "text-red-400" }
        : null

  return (
    <div className="mb-4 rounded-xl bg-muted/40">
      <button
        data-vaul-no-drag
        onClick={() => {
          if (!isExpanded) {
            onExpand()
            setExpanded(true)
            return
          }
          setExpanded((v) => !v)
        }}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            opening hours
          </span>
        </div>
        <div className="flex items-center gap-2">
          {statusLabel && (
            <span className={`text-sm font-semibold ${statusLabel.className}`}>
              {statusLabel.label}
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
                  className="text-sm leading-relaxed text-foreground"
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

function formatPriceLevel(priceLevel: string): string {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: "free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  }
  return map[priceLevel] ?? priceLevel
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
