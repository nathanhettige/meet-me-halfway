import { useState, useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, MapPin, Navigation } from "lucide-react"
import { AutoComplete } from "@/components/autocomplete"
import { Button } from "@/components/ui/button"

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
          className="absolute inset-x-0 bottom-0 z-20 flex items-start justify-center px-4 pt-6"
          style={{ top: "40vh" }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <motion.div
            className="landing-form-card w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.5,
            }}
          >
            {/* Header */}
            <motion.div
              className="mb-4 flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Navigation className="h-4 w-4 text-white/70" />
              <p className="text-sm font-medium text-white/80">
                Where is everyone starting from?
              </p>
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
                    delay: 0.8 + index * 0.1,
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
                delay: 1.0 + entries.length * 0.1,
              }}
            >
              <Button
                onClick={onSubmit}
                disabled={!hasEnoughPlaces}
                className="flex-1 bg-white/90 font-semibold text-slate-800 shadow-lg backdrop-blur-sm hover:bg-white"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
