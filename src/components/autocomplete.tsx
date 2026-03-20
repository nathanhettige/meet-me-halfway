import { useCallback, useMemo, useRef, useState } from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Check, Trash2 } from "lucide-react"
import type { KeyboardEvent } from "react"
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
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
  const inputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setOpen] = useState(false)
  const [focus, setFocus] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selected, setSelected] = useState<Option>()

  const { data, isLoading } = useAutocomplete(searchValue)
  const options = useMemo(() => data ?? [], [data])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current
      if (!input) return

      if (!isOpen) {
        setOpen(true)
      }

      if (event.key === "Enter" && input.value !== "") {
        const optionToSelect = options.find(
          (option) => option.label === input.value
        )
        if (optionToSelect) {
          setSelected(optionToSelect)
          setPlaceId?.(optionToSelect.value)
        }
      }

      if (event.key === "Escape") {
        input.blur()
      }
    },
    [isOpen, options]
  )

  const handleBlur = useCallback(() => {
    setOpen(false)
    setFocus(false)
    if (selected) setSearchValue(selected.label)
  }, [selected])

  const handleFocus = useCallback(() => {
    setOpen(true)
    setFocus(true)
  }, [])

  const handleSelectOption = useCallback(
    (selectedOption: Option) => {
      setSelected(selectedOption)
      setPlaceId?.(selectedOption.value)

      setTimeout(() => {
        inputRef.current?.blur()
      }, 0)
    },
    [setPlaceId]
  )

  return (
    <div className="flex w-full gap-2">
      <CommandPrimitive onKeyDown={handleKeyDown} className="w-full">
        <div>
          <CommandInput
            ref={inputRef}
            value={focus ? searchValue : (selected?.label ?? searchValue)}
            onValueChange={(s) => setSearchValue(s)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="text-base"
          />
        </div>
        <div className="relative mt-1">
          <div
            className={cn(
              "animate-in fade-in-0 zoom-in-95 absolute top-0 z-10 w-full rounded-xl bg-popover outline-none",
              isOpen ? "block" : "hidden"
            )}
          >
            <CommandList className="rounded-lg ring-1 ring-border">
              {isLoading ? (
                <CommandPrimitive.Loading>
                  <div className="p-1">
                    <Skeleton className="flex h-8 w-full items-center justify-center" />
                  </div>
                </CommandPrimitive.Loading>
              ) : null}
              {options.length > 0 && !isLoading ? (
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = selected?.value === option.value
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                        onSelect={() => handleSelectOption(option)}
                        className={cn(
                          "flex w-full items-center gap-2",
                          !isSelected ? "pl-8" : null
                        )}
                      >
                        {isSelected ? <Check className="w-4" /> : null}
                        {option.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : null}
              {!isLoading ? (
                <CommandPrimitive.Empty className="select-none rounded-sm px-2 py-3 text-center text-sm">
                  No results found
                </CommandPrimitive.Empty>
              ) : null}
            </CommandList>
          </div>
        </div>
      </CommandPrimitive>
      {onDelete ? (
        <Button size="icon" variant="outline" onClick={onDelete}>
          <Trash2 />
        </Button>
      ) : null}
    </div>
  )
}
