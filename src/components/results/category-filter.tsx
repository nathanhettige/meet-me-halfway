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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useIsDesktop } from "@/hooks/use-media-query"

type CategoryFilterProps = {
  selected: Set<string>
  onApply: (categories: Set<string>) => void
}

export function CategoryFilter({ selected, onApply }: CategoryFilterProps) {
  const [open, setOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState<Set<string>>(
    () => new Set(selected)
  )
  const isDesktop = useIsDesktop()

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

  const handleOpen = () => {
    setLocalSelected(new Set(selected))
    setOpen(true)
  }

  const filterContent = (
    <>
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
    </>
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleOpen}>
            {noneSelected ? "filter" : `filter (${count})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56">
          <p className="mb-3 text-center text-base font-semibold">filter</p>
          {filterContent}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
      >
        {noneSelected ? "filter" : `filter (${count})`}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-56">
          <DialogTitle className="text-center text-base font-semibold">
            filter
          </DialogTitle>
          {filterContent}
        </DialogContent>
      </Dialog>
    </>
  )
}
