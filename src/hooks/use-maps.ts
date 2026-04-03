import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { PlacePhoto, SearchResult } from "@/server/maps/types"
import { autocomplete } from "@/server/maps/autocomplete"
import { search } from "@/server/maps/search"
import { fetchPlacePhoto } from "@/server/maps/fetch-place-photo"

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

export function usePlacePhoto(photo: PlacePhoto | undefined) {
  return useQuery<string>({
    enabled: !!photo,
    queryKey: ["place-photo", photo?.name],
    queryFn: () =>
      fetchPlacePhoto({ data: { photoName: photo!.name, maxWidthPx: 400 } }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
}
