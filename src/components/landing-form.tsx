import { useForm } from "@tanstack/react-form"
import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import { Plus } from "lucide-react"
import * as z from "zod"
import { AutoComplete } from "@/components/autocomplete"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"

const MAX_ENTRIES = 5

const formSchema = z.object({
  addresses: z
    .array(
      z.object({
        placeId: z.string().min(1, "please select an address"),
        label: z.string(),
      })
    )
    .min(2),
})

type AddressEntry = {
  placeId: string
  label: string
}

// Module-level store so form state survives route navigations
let persistedEntries: Array<AddressEntry> | null = null

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

  const defaultAddresses: Array<AddressEntry> = persistedEntries ?? [
    { placeId: "", label: "" },
    { placeId: "", label: "" },
  ]

  const form = useForm({
    defaultValues: {
      addresses: defaultAddresses,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      const validIds = value.addresses.map((a) => a.placeId).filter(Boolean)
      navigate({ to: "/results", search: { placeIds: validIds.join(",") } })
    },
  })

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
              <Alert className="border-0 bg-white/30 backdrop-blur-xl">
                <AlertDescription className="text-center text-base font-bold text-slate-900">
                  find the best places to catch up with a perfectly balanced
                  drive time for everyone.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Card with inputs + actions */}
            <div className="rounded-2xl border border-white/30 bg-white/20 p-4 shadow-lg backdrop-blur-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}
              >
                {/* Address inputs */}
                <form.Field name="addresses" mode="array">
                  {(field) => {
                    // Keep persisted store in sync whenever form is rendered
                    persistedEntries = field.state.value

                    return (
                      <div className="space-y-3">
                        {field.state.value.map((entry, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                              opacity: 0,
                              x: 20,
                              transition: { duration: 0.2 },
                            }}
                            transition={{
                              duration: 0.5,
                              ease: [0.22, 1, 0.36, 1],
                              delay: staggerBase + index * 0.1,
                            }}
                          >
                            <form.Field name={`addresses[${index}].placeId`}>
                              {(subField) => {
                                const isInvalid =
                                  subField.state.meta.isTouched &&
                                  !subField.state.meta.isValid
                                return (
                                  <Field data-invalid={isInvalid}>
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
                                      setPlaceId={(placeId, label) => {
                                        subField.handleChange(placeId)
                                        field.replaceValue(index, {
                                          placeId,
                                          label,
                                        })
                                      }}
                                      onBlur={subField.handleBlur}
                                      onDelete={
                                        field.state.value.length > 2
                                          ? () => field.removeValue(index)
                                          : undefined
                                      }
                                    />
                                    {isInvalid && (
                                      <FieldError
                                        errors={subField.state.meta.errors}
                                        className="px-1"
                                      />
                                    )}
                                  </Field>
                                )
                              }}
                            </form.Field>
                          </motion.div>
                        ))}

                        {/* Actions */}
                        <motion.div
                          className="mt-4 flex items-center gap-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.5,
                            delay:
                              staggerBase +
                              0.2 +
                              field.state.value.length * 0.1,
                          }}
                        >
                          <Button
                            type="submit"
                            size="lg"
                            className="flex-1 bg-white/90 text-base font-semibold text-slate-800 shadow-lg backdrop-blur-sm hover:bg-white"
                          >
                            find a place to meet
                          </Button>
                          <Button
                            type="button"
                            onClick={() =>
                              field.pushValue({ placeId: "", label: "" })
                            }
                            variant="ghost"
                            size="sm"
                            className="font-semibold text-white hover:bg-white/20 hover:text-white"
                            disabled={field.state.value.length >= MAX_ENTRIES}
                          >
                            <Plus className="h-4 w-4" />
                            add friend
                          </Button>
                        </motion.div>
                      </div>
                    )
                  }}
                </form.Field>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
