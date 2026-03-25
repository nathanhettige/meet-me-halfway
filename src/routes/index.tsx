import { createFileRoute } from "@tanstack/react-router"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AddressForm } from "@/components/address-form"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">Meet Me Halfway</CardTitle>
          <CardDescription>
            Find a fair meeting point based on equal driving time
          </CardDescription>
        </CardHeader>
        <AddressForm />
      </Card>
    </div>
  )
}
