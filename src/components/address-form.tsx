import { useForm } from "@tanstack/react-form"
import { useNavigate } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import * as z from "zod"
import { AutoComplete } from "@/components/autocomplete"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldError } from "@/components/ui/field"

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

export function AddressForm() {
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      addresses: [
        { placeId: "", label: "" },
        { placeId: "", label: "" },
      ],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      const validIds = value.addresses.map((a) => a.placeId).filter(Boolean)
      navigate({ to: "/search", search: { placeIds: validIds.join(",") } })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field name="addresses" mode="array">
        {(field) => (
          <>
            <CardContent className="w-full space-y-2">
              {field.state.value.map((entry, index) => (
                <form.Field key={index} name={`addresses[${index}].placeId`}>
                  {(subField) => {
                    const isInvalid =
                      subField.state.meta.isTouched &&
                      !subField.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <AutoComplete
                          placeholder="enter an address"
                          defaultValue={entry.label}
                          setPlaceId={(placeId, label) => {
                            subField.handleChange(placeId)
                            field.replaceValue(index, { placeId, label })
                          }}
                          onBlur={subField.handleBlur}
                          onDelete={
                            field.state.value.length > 2
                              ? () => field.removeValue(index)
                              : undefined
                          }
                        />
                        {isInvalid && (
                          <FieldError errors={subField.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              ))}
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="submit">find a place to meet</Button>
              <Button
                type="button"
                onClick={() => field.pushValue({ placeId: "", label: "" })}
                variant="secondary"
              >
                <Plus />
                Add
              </Button>
            </CardFooter>
          </>
        )}
      </form.Field>
    </form>
  )
}
