import { useEffect, useState } from "react"
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
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [snap, setSnap] = useState<SnapPoint | null>(SNAP_POINTS[0])

  useEffect(() => {
    if (!carouselApi) return
    setCurrentSlide(carouselApi.selectedScrollSnap())
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

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
    >
      <DrawerContent>
        {/* Photo carousel */}
        {photoCount > 0 && (
          <div className="mx-4 my-2">
            {loadedPhotos.length > 0 ? (
              <Carousel
                opts={{ loop: loadedPhotos.length > 1 }}
                setApi={setCarouselApi}
                className="w-full"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <CarouselContent className="-ml-0">
                    {loadedPhotos.map((url, i) => (
                      <CarouselItem key={i} className="pl-0">
                        <img
                          src={url}
                          alt={`${place.displayName.text} photo ${i + 1}`}
                          className="h-48 w-full object-cover"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* Photo count — top-right */}
                  {loadedPhotos.length > 1 && (
                    <div className="absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-0.5">
                      <span className="text-[13px] leading-none font-normal text-white">
                        {currentSlide + 1}/{loadedPhotos.length}
                      </span>
                    </div>
                  )}

                  {/* Dots — bottom-centre */}
                  {loadedPhotos.length > 1 && (
                    <div className="absolute right-0 bottom-2.5 left-0 flex justify-center gap-1.5">
                      {loadedPhotos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => carouselApi?.scrollTo(i)}
                          className={`size-1.5 rounded-full transition-opacity duration-200 ${
                            i === currentSlide ? "bg-white" : "bg-white/50"
                          }`}
                          aria-label={`Go to photo ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Carousel>
            ) : photosQuery.isLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : null}
          </div>
        )}

        <DrawerHeader className="pt-4 pb-3">
          <DrawerTitle className="text-left text-2xl font-bold text-balance">
            {place.displayName.text}
          </DrawerTitle>

          {/* Star rating */}
          <div className="flex items-center gap-1.5">
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

          {/* Category pills + action buttons */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
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

            {/* Divider */}
            {place.types.filter(
              (t) => !["establishment", "point_of_interest"].includes(t)
            ).length > 0 && <div className="h-4 w-px bg-border" />}

            {/* Action buttons */}
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
                <ExternalLink className="h-3 w-3" />
                website
              </button>
            )}
          </div>
        </DrawerHeader>

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
