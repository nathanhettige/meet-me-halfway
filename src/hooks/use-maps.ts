import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { SearchResult } from "@/server/maps/types"
import { autocomplete } from "@/server/maps/autocomplete"
import { search } from "@/server/maps/search"

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export function useAutocomplete(input: string) {
  const debouncedInput = useDebouncedValue(input)

  const query = useQuery({
    enabled: debouncedInput.length > 0,
    queryKey: ["autocomplete", debouncedInput],
    queryFn: () => autocomplete({ data: { input: debouncedInput } }),
  })

  return {
    ...query,
    isDebouncing: input !== debouncedInput,
  }
}

export function useSearch(placeIds: Array<string>) {
  return useQuery<SearchResult>({
    enabled: placeIds.length >= 2,
    queryKey: ["search", placeIds],
    queryFn: () => search({ data: { placeIds } }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  })
}
