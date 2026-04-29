import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Car,
  ChevronDown,
  Clock,
  Globe,
  MapPin,
  MessageSquareText,
  Navigation,
  Star,
} from "lucide-react"
import type { Coordinates, Place, PlaceDriveTime } from "@/server/maps/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { usePlacePhotos } from "@/hooks/use-maps"

type Origin = {
  locality: string
  coordinates: Coordinates
}

type PlaceDetailContentProps = {
  place: Place
  driveTimes?: Array<PlaceDriveTime>
  origins?: Array<Origin>
  onBack?: () => void
  /** Whether collapsible sections start expanded (desktop) */
  defaultExpanded?: boolean
}

export function PlaceDetailContent({
  place,
  driveTimes,
  origins,
  onBack,
  defaultExpanded = false,
}: PlaceDetailContentProps) {
  const photosQuery = usePlacePhotos(place.photos, 5)

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

  return (
    <div className="flex h-full flex-col">
      {/* Back button (desktop panel mode) */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 pt-4 pb-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          back to results
        </button>
      )}

      {/* Header */}
      <div className="px-4 pt-3 pb-3">
        <h2 className="text-2xl font-bold text-balance text-foreground">
          {place.displayName.text}
        </h2>

        {/* Badge, rating, price level */}
        <div className="mt-1 flex items-center gap-1">
          {place.types
            .filter((t) => !["establishment", "point_of_interest"].includes(t))
            .slice(0, 1)
            .map((type) => (
              <span
                key={type}
                className="rounded-full bg-sky-blue/10 px-2.5 py-0.5 text-[12px] font-semibold tracking-wide text-sky-blue uppercase"
              >
                {formatPlaceType(type)}
              </span>
            ))}
          <span className="text-[12px] text-muted-foreground">&middot;</span>
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
              <span className="text-[12px] text-muted-foreground">
                &middot;
              </span>
              <span className="text-[12px] font-semibold text-muted-foreground">
                {formatPriceLevel(place.priceLevel)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Action buttons */}
        <div className="flex items-center gap-2 px-4 pb-3">
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

        {/* Horizontal scrollable photo mosaic */}
        {photoCount > 0 && (
          <div className="px-4 pb-4">
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

        {/* Editorial summary */}
        <div className="px-4">
          {place.editorialSummary?.text && (
            <div className="mb-4 rounded-xl bg-muted/40 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                {place.editorialSummary.text}
              </p>
            </div>
          )}

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
              defaultExpanded={defaultExpanded}
            />
          )}

          {/* Drive times */}
          {driveTimes && driveTimes.length > 0 && (
            <DriveTimes
              driveTimes={driveTimes}
              origins={origins}
              defaultExpanded={defaultExpanded}
            />
          )}

          {/* Reviews */}
          {place.reviews && place.reviews.length > 0 && (
            <Reviews
              reviews={place.reviews}
              defaultExpanded={defaultExpanded}
            />
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-6" />
      </div>
    </div>
  )
}

function OpeningHours({
  hours,
  defaultExpanded,
}: {
  hours: NonNullable<Place["currentOpeningHours"]>
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
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
        onClick={() => setExpanded((v) => !v)}
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

function DriveTimes({
  driveTimes,
  origins,
  defaultExpanded,
}: {
  driveTimes: Array<PlaceDriveTime>
  origins?: Array<Origin>
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const validTimes = driveTimes.filter((dt) => dt.durationSeconds > 0)
  const avgSeconds =
    validTimes.length > 0
      ? Math.round(
          validTimes.reduce((sum, dt) => sum + dt.durationSeconds, 0) /
            validTimes.length
        )
      : 0

  return (
    <div className="mb-4 rounded-xl bg-muted/40">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            driving time
          </span>
        </div>
        <div className="flex items-center gap-2">
          {avgSeconds > 0 && (
            <span className="text-sm font-semibold text-muted-foreground">
              avg {formatDuration(avgSeconds)}
            </span>
          )}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
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
            <div className="space-y-1.5 px-4 pt-1 pb-3">
              {driveTimes.map((dt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">
                    {origins?.[i]?.locality ?? `person ${i + 1}`}
                  </span>
                  <span className="text-foreground">
                    {dt.durationSeconds > 0
                      ? formatDuration(dt.durationSeconds)
                      : "unavailable"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Reviews({
  reviews,
  defaultExpanded,
}: {
  reviews: NonNullable<Place["reviews"]>
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const displayReviews = reviews.filter((r) => r.text?.text).slice(0, 3)

  if (displayReviews.length === 0) return null

  return (
    <div className="mb-4 rounded-xl bg-muted/40">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">reviews</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
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
            <div className="space-y-3 px-4 pt-1 pb-3">
              {displayReviews.map((review, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-2.5 w-2.5",
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-muted"
                          )}
                        />
                      ))}
                    </div>
                    {review.authorAttribution?.displayName && (
                      <span className="text-xs text-muted-foreground">
                        {review.authorAttribution.displayName}
                      </span>
                    )}
                    {review.relativePublishTimeDescription && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          &middot;
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {review.relativePublishTimeDescription}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                    {review.text?.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes} min`
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
    cafe: "Cafe",
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
