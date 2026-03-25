import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { AutoComplete } from "@/components/autocomplete"
import {
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

let nextId = 0
function createEntry(placeId = "") {
  return { id: nextId++, placeId }
}

export function AddressForm() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState(() => [createEntry(), createEntry()])

  const handleChange = (entryId: number, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, placeId: value } : e))
    )
  }

  const onDelete = (entryId: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  const onSubmit = () => {
    const validIds = entries.map((e) => e.placeId).filter(Boolean)
    if (validIds.length < 2) return
    navigate({ to: "/search", search: { placeIds: validIds.join(",") } })
  }

  return (
    <>
      <CardContent className="w-full space-y-2">
        {entries.map((entry) => (
          <AutoComplete
            key={entry.id}
            placeholder="Enter an address"
            setPlaceId={(value) => handleChange(entry.id, value)}
            onDelete={
              entries.length > 2 ? () => onDelete(entry.id) : undefined
            }
          />
        ))}
      </CardContent>
      <CardFooter className="justify-between">
        <Button onClick={onSubmit}>Find a place to meet</Button>
        <Button
          onClick={() => setEntries((prev) => [...prev, createEntry()])}
          variant="secondary"
        >
          <Plus />
          Add
        </Button>
      </CardFooter>
    </>
  )
}
