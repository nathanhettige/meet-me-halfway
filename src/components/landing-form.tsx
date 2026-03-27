import { useCallback, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import { MapPin, Plus } from "lucide-react"
import { AutoComplete } from "@/components/autocomplete"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

let nextId = 0
function createEntry(placeId = "") {
  return { id: nextId++, placeId }
}

export function LandingForm({ visible }: { visible: boolean }) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState(() => [createEntry(), createEntry()])

  const handleChange = useCallback((entryId: number, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, placeId: value } : e))
    )
  }, [])

  const onDelete = useCallback((entryId: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }, [])

  const onSubmit = useCallback(() => {
    const validIds = entries.map((e) => e.placeId).filter(Boolean)
    if (validIds.length < 2) return
    navigate({ to: "/search", search: { placeIds: validIds.join(",") } })
  }, [entries, navigate])

  const hasEnoughPlaces = entries.filter((e) => e.placeId).length >= 2

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-x-0 bottom-0 z-20 flex items-start justify-center px-6"
          style={{ top: "42vh" }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <div className="landing-form w-full max-w-sm md:max-w-md">
            {/* Tagline */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Alert className="border-white/20 bg-white/15 backdrop-blur-md">
                <AlertDescription className="text-center text-base font-semibold text-foreground">
                  Drop your locations. We'll find the perfect spot to meet.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Address inputs */}
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.75 + index * 0.1,
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <AutoComplete
                      placeholder={
                        index === 0
                          ? "Person 1's address"
                          : index === 1
                            ? "Person 2's address"
                            : `Person ${index + 1}'s address`
                      }
                      setPlaceId={(value) => handleChange(entry.id, value)}
                      onDelete={
                        entries.length > 2
                          ? () => onDelete(entry.id)
                          : undefined
                      }
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <motion.div
              className="mt-4 flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.95 + entries.length * 0.1,
              }}
            >
              <Button
                onClick={onSubmit}
                disabled={!hasEnoughPlaces}
                size="lg"
                className="flex-1 bg-white/90 text-base font-semibold text-slate-800 shadow-lg backdrop-blur-sm hover:bg-white"
              >
                Find a place to meet
              </Button>
              <Button
                onClick={() => setEntries((prev) => [...prev, createEntry()])}
                variant="ghost"
                size="icon"
                className="text-white/80 hover:bg-white/20 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
