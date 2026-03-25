import { useState } from "react"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAutocomplete } from "@/hooks/use-maps"

type Option = {
  value: string
  label: string
}

type AutoCompleteProps = {
  disabled?: boolean
  placeholder?: string
  setPlaceId?: (placeId: string) => void
  onDelete?: () => void
}

export function AutoComplete({
  placeholder,
  disabled,
  setPlaceId,
  onDelete,
}: AutoCompleteProps) {
  const [searchValue, setSearchValue] = useState("")

  const { data, isDebouncing, isLoading } = useAutocomplete(searchValue)

  const options = isDebouncing ? [] : (data ?? [])

  function getStatus() {
    if (isLoading || isDebouncing) {
      return "Loading..."
    }
    if (searchValue !== "" && options.length === 0) {
      return "No results found"
    }
    return null
  }

  const status = getStatus()

  return (
    <div className="flex w-full gap-2">
      <div className="w-full">
        <Autocomplete.Root
          disabled={disabled}
          items={options}
          value={searchValue}
          itemToStringValue={(item: Option) => item.label}
          filter={null}
          onValueChange={(next) => setSearchValue(next)}
        >
          <Autocomplete.Input
            placeholder={placeholder}
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />

          <Autocomplete.Portal hidden={!status && options.length === 0}>
            <Autocomplete.Positioner
              sideOffset={4}
              className="z-50 outline-none"
            >
              <Autocomplete.Popup className="w-(--anchor-width) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                <Autocomplete.Status>
                  {status && (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {status}
                    </div>
                  )}
                </Autocomplete.Status>

                <Autocomplete.List className="max-h-50 overflow-y-auto p-1 data-empty:p-0">
                  {(option: Option) => (
                    <Autocomplete.Item
                      key={option.value}
                      value={option}
                      className={cn(
                        "relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none",
                        "data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                      )}
                      onClick={() => setPlaceId?.(option.value)}
                    >
                      {option.label}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      </div>

      {onDelete ? (
        <Button size="icon" variant="outline" onClick={onDelete}>
          <Trash2 />
        </Button>
      ) : null}
    </div>
  )
}
