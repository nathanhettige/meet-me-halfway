import { useCallback, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import { Plus } from "lucide-react"
import { AutoComplete } from "@/components/autocomplete"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

type FormEntry = {
  id: string
  placeId: string
  label: string
}

const MAX_ENTRIES = 5

let nextId = 0
function createEntry(placeId = "", label = ""): FormEntry {
  return { id: `entry-${Date.now()}-${nextId++}`, placeId, label }
}

// Module-level store so form state survives route navigations
let persistedEntries: Array<FormEntry> | null = null

/** Returns true if the user has previously filled out the form */
export function hasPersistedFormData(): boolean {
  return persistedEntries !== null && persistedEntries.some((e) => e.placeId)
}

export function LandingForm({
  visible,
  returning,
}: {
  visible: boolean
  returning: boolean
}) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Array<FormEntry>>(() => {
    if (persistedEntries) return persistedEntries
    return [createEntry(), createEntry()]
  })

  // Keep the persisted store in sync
  const entriesRef = useRef(entries)
  entriesRef.current = entries
  if (visible) {
    persistedEntries = entries
  }

  const handleChange = useCallback(
    (entryId: string, placeId: string, label: string) => {
      setEntries((prev) => {
        const next = prev.map((e) =>
          e.id === entryId ? { ...e, placeId, label } : e
        )
        persistedEntries = next
        return next
      })
    },
    []
  )

  const onDelete = useCallback((entryId: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== entryId)
      persistedEntries = next
      return next
    })
  }, [])

  const onSubmit = useCallback(() => {
    const validIds = entriesRef.current.map((e) => e.placeId).filter(Boolean)
    if (validIds.length < 2) return
    navigate({ to: "/results", search: { placeIds: validIds.join(",") } })
  }, [navigate])

  const hasEnoughPlaces = entries.filter((e) => e.placeId).length >= 2

  // When returning from results, skip entrance animation delays
  const delay = returning ? 0 : 0.3
  const staggerBase = returning ? 0 : 0.75

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-x-0 top-[35vh] bottom-0 z-20 flex items-start justify-center overflow-y-auto px-8 md:top-[42vh] md:px-6"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
        >
          <div className="landing-form w-full max-w-md md:max-w-lg">
            {/* Tagline */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: delay + 0.3 }}
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
                      delay: staggerBase + index * 0.1,
                    }}
                  >
                    <AutoComplete
                      placeholder={
                        index === 0
                          ? "1st address"
                          : index === 1
                            ? "2nd address"
                            : index === 2
                              ? "3rd address"
                              : `${index + 1}th address`
                      }
                      defaultValue={entry.label}
                      setPlaceId={(placeId, label) =>
                        handleChange(entry.id, placeId, label)
                      }
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
                  delay: staggerBase + 0.2 + entries.length * 0.1,
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
                  disabled={entries.length >= MAX_ENTRIES}
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
