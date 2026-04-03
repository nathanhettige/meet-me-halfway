import { ArrowLeft, Share2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

type ResultsHeaderProps = {
  cityName: string
  placeCount: number
  onBack: () => void
}

export function ResultsHeader({
  cityName,
  placeCount,
  onBack,
}: ResultsHeaderProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet halfway in ${cityName}`,
          text: `Found ${placeCount} spots to meet halfway!`,
          url: window.location.href,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-muted/50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-bold text-foreground">{cityName}</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Meeting point for everyone
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="h-10 w-10 rounded-full bg-muted/50"
          aria-label="Share results"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
