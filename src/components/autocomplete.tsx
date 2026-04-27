import { useRef, useState } from "react"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { MapPin, Trash2 } from "lucide-react"
import type { Coordinates } from "@/server/maps/types"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useAutocomplete } from "@/hooks/use-maps"
import { getPlaceCoordinates } from "@/server/maps/get-place-coordinates"

type Option = {
  value: string
  label: string
}

type AutoCompleteProps = {
  disabled?: boolean
  placeholder?: string
  defaultValue?: string
  locationBias?: Coordinates
  setPlaceId?: (placeId: string, label: string) => void
  onCoordinatesResolved?: (coords: Coordinates) => void
  onDelete?: () => void
  onBlur?: () => void
}

export function AutoComplete({
  placeholder,
  disabled,
  defaultValue,
  locationBias,
  setPlaceId,
  onCoordinatesResolved,
  onDelete,
  onBlur,
}: AutoCompleteProps) {
  const [searchValue, setSearchValue] = useState(defaultValue ?? "")

  // Tracks the label of the last confirmed selection so we can detect
  // when the user edits the text after picking an option (invalidating it).
  const selectedLabelRef = useRef(defaultValue ?? "")

  // Session token groups autocomplete requests with the subsequent place
  // details call into a single billing session.
  const sessionTokenRef = useRef(crypto.randomUUID())

  const { data, isDebouncing, isLoading } = useAutocomplete(searchValue, {
    sessionToken: sessionTokenRef.current,
    locationBias,
  })

  const options = isDebouncing ? [] : (data ?? [])

  const hasResults = options.length > 0
  const showDropdown =
    isLoading ||
    isDebouncing ||
    (searchValue !== "" && !hasResults) ||
    hasResults

  const handleValueChange = (next: string) => {
    setSearchValue(next)
    // If the user edits away from the confirmed selection, clear the placeId
    if (next !== selectedLabelRef.current) {
      selectedLabelRef.current = ""
      setPlaceId?.("", "")
    }
  }

  const handleSelect = async (option: Option) => {
    selectedLabelRef.current = option.label
    setPlaceId?.(option.value, option.label)

    // Close the autocomplete session by fetching place details with the
    // same session token, then regenerate the token for the next session.
    const token = sessionTokenRef.current
    sessionTokenRef.current = crypto.randomUUID()

    if (onCoordinatesResolved) {
      try {
        const coords = await getPlaceCoordinates({
          data: { placeId: option.value, sessionToken: token },
        })
        onCoordinatesResolved(coords)
      } catch {
        // Coordinates are a nice-to-have for biasing; don't block the user.
      }
    }
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative w-full">
        <Autocomplete.Root
          disabled={disabled}
          items={options}
          value={searchValue}
          itemToStringValue={(item: Option) => item.label}
          filter={null}
          onValueChange={handleValueChange}
        >
          <MapPin className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-slate-700" />
          <Autocomplete.Input
            placeholder={placeholder}
            onBlur={onBlur}
            className={cn(
              "h-12 w-full rounded-xl border border-input bg-background px-10 py-2 text-center text-base",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />

          <Autocomplete.Portal hidden={!showDropdown}>
            <Autocomplete.Positioner
              sideOffset={4}
              className="z-50 outline-none"
            >
              <Autocomplete.Popup className="w-(--anchor-width) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                <Autocomplete.Status>
                  {(isLoading || isDebouncing) && (
                    <div className="flex items-center justify-center px-3 py-6">
                      <Spinner className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  {!isLoading &&
                    !isDebouncing &&
                    searchValue !== "" &&
                    options.length === 0 && (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        no results found
                      </div>
                    )}
                </Autocomplete.Status>

                <Autocomplete.List className="max-h-50 overflow-y-auto p-1 data-empty:p-0">
                  {(option: Option) => (
                    <Autocomplete.Item
                      key={option.value}
                      value={option}
                      className={cn(
                        "relative flex cursor-default items-center overflow-hidden rounded-sm px-2 py-3 text-base text-slate-900 outline-none select-none",
                        "data-highlighted:bg-[rgba(44,173,253,0.15)]"
                      )}
                      onClick={() => handleSelect(option)}
                    >
                      <span className="truncate">{option.label}</span>
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
