import { ArrowLeft, Share2 } from "lucide-react"
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
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {cityName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Your halfway point
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="h-9 w-9 rounded-full"
          aria-label="Share results"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
