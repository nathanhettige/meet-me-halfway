import { Card, CardHeader, CardTitle } from "@ui/card";
import AddressForm from "./AddressForm";

export default async function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Meet Me Halfway</CardTitle>
          {/* <CardDescription>Enter you and your friends location</CardDescription> */}
        </CardHeader>
        <AddressForm />
      </Card>
    </main>
  );
}
