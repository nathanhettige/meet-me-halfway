import { ArrowLeft, MapPin, Share2 } from "lucide-react"
import { Link } from "@tanstack/react-router"
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
    // navigator.share may not exist in all browsers
    const canShare = typeof navigator.share === "function"
    if (canShare) {
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
    <header className="sticky top-0 z-20 bg-white/15 backdrop-blur-xl">
      {/* Logo bar */}
      <div className="flex items-center justify-center border-b border-white/20 px-4 py-2">
        <Link to="/" className="group flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-tight text-white">
            meet me halfway
          </span>
        </Link>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-white" />
              <h1 className="text-lg font-bold text-white">{cityName}</h1>
            </div>
            <p className="text-xs text-white/70">meeting point for everyone</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
          aria-label="Share results"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
