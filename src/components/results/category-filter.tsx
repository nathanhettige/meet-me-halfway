import { useState } from "react"
import { Check } from "lucide-react"
import {
  ALL_CATEGORY_IDS,
  VENUE_CATEGORIES,
} from "@/server/maps/venue-categories"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

type CategoryFilterProps = {
  selected: Set<string>
  onApply: (categories: Set<string>) => void
}

export function CategoryFilter({ selected, onApply }: CategoryFilterProps) {
  const [open, setOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState<Set<string>>(
    () => new Set(selected)
  )

  const noneSelected = selected.size === 0
  const count = selected.size

  const localAllSelected = localSelected.size === ALL_CATEGORY_IDS.length

  const handleToggle = (id: string) => {
    setLocalSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleApply = () => {
    onApply(localSelected)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setLocalSelected(new Set(selected))
          setOpen(true)
        }}
      >
        {noneSelected ? "filter" : `filter (${count})`}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-56">
          <DialogTitle className="text-center text-base font-semibold">
            filter
          </DialogTitle>
          <div className="flex w-full flex-col items-stretch gap-1.5">
            {VENUE_CATEGORIES.map((category) => {
              const Icon = category.icon
              const isSelected = localSelected.has(category.id)
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleToggle(category.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                    isSelected
                      ? "border-sky-blue font-medium text-sky-blue"
                      : "border-border bg-background font-medium text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="flex-1 text-left">{category.label}</span>
                  {isSelected && <Check className="size-3.5" />}
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (localAllSelected) {
                  setLocalSelected(new Set())
                } else {
                  setLocalSelected(new Set(ALL_CATEGORY_IDS))
                }
              }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {localAllSelected ? "deselect all" : "select all"}
            </button>
            <Button
              size="sm"
              className="bg-sky-blue text-white hover:bg-sky-blue-dark"
              onClick={handleApply}
            >
              apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
