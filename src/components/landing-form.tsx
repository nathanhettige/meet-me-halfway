import { useCallback, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import { Plus } from "lucide-react"
import { AutoComplete } from "@/components/autocomplete"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

let nextId = 0
function createEntry(placeId = "") {
  return { id: `entry-${Date.now()}-${nextId++}`, placeId }
}

export function LandingForm({ visible }: { visible: boolean }) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState(() => [createEntry(), createEntry()])

  const handleChange = useCallback((entryId: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, placeId: value } : e))
    )
  }, [])

  const onDelete = useCallback((entryId: string) => {
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
          className="absolute inset-x-0 top-[35vh] bottom-0 z-20 flex items-start justify-center px-8 md:top-[42vh] md:px-6"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <div className="landing-form w-full max-w-md md:max-w-lg">
            {/* Tagline */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Alert className="border-0 bg-white/15 backdrop-blur-xl">
                <AlertDescription className="text-center text-base font-bold text-slate-800/80">
                  find the best places to catch up with a perfectly balanced
                  drive time for everyone.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Card with inputs + actions */}
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
              {/* Address inputs */}
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.75 + index * 0.1,
                    }}
                  >
                    <AutoComplete
                      placeholder={
                        index === 0
                          ? "person 1's address"
                          : index === 1
                            ? "person 2's address"
                            : `person ${index + 1}'s address`
                      }
                      setPlaceId={(value) => handleChange(entry.id, value)}
                      onDelete={
                        entries.length > 2
                          ? () => onDelete(entry.id)
                          : undefined
                      }
                    />
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
                  find a place to meet
                </Button>
                <Button
                  onClick={() => setEntries((prev) => [...prev, createEntry()])}
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:bg-white/20 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  add friend
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
