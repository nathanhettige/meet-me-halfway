import { Car, Clock } from "lucide-react"

type DriveTimesProps = {
  originNames: Array<string>
  travelTimes: Array<number>
  timeDifference: number
}

function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return `~${minutes} min`
}

export function DriveTimes({
  originNames,
  travelTimes,
  timeDifference,
}: DriveTimesProps) {
  if (travelTimes.length === 0) return null

  const diffMinutes = Math.round(timeDifference / 60)

  return (
    <div className="mx-4 rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Car className="size-4 text-sky-blue" />
        <h3 className="text-sm font-semibold text-foreground">drive times</h3>
      </div>

      <div className="flex flex-col gap-2">
        {travelTimes.map((time, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">
              {originNames[index]?.toLowerCase() ?? `person ${index + 1}`}
            </span>
            <span className="font-medium text-foreground">
              {formatMinutes(time)}
            </span>
          </div>
        ))}
      </div>

      {travelTimes.length >= 2 && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-3">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {diffMinutes <= 1
              ? "almost perfectly fair"
              : `${diffMinutes} min difference`}
          </span>
        </div>
      )}
    </div>
  )
}
