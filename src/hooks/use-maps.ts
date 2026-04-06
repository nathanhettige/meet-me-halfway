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

export function usePlacePhotos(
  photos: Array<PlacePhoto> | undefined,
  maxPhotos = 5
) {
  const limited = photos?.slice(0, maxPhotos) ?? []

  const queries = limited.map((photo) => ({
    enabled: limited.length > 0,
    queryKey: ["place-photo", photo.name],
    queryFn: () =>
      fetchPlacePhoto({ data: { photoName: photo.name, maxWidthPx: 800 } }),
    refetchOnMount: false as const,
    refetchOnWindowFocus: false as const,
    staleTime: Infinity,
  }))

  // Run all queries — React Query rules of hooks require a stable call count,
  // so we always call useQuery for each slot (up to maxPhotos).
  const q0 = useQuery<string>({ ...queries[0], enabled: !!queries[0] })
  const q1 = useQuery<string>({ ...queries[1], enabled: !!queries[1] })
  const q2 = useQuery<string>({ ...queries[2], enabled: !!queries[2] })
  const q3 = useQuery<string>({ ...queries[3], enabled: !!queries[3] })
  const q4 = useQuery<string>({ ...queries[4], enabled: !!queries[4] })

  const all = [q0, q1, q2, q3, q4].slice(0, limited.length)

  return {
    urls: all.map((q) => q.data ?? null),
    isLoading: all.some((q) => q.isLoading),
    loadedCount: all.filter((q) => !!q.data).length,
  }
}
