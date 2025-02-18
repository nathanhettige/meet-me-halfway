import { Card, CardDescription, CardHeader, CardTitle } from "@ui/card";
import Search from "./search";

export default async function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Meet Me Halfway</CardTitle>
          <CardDescription>Enter you and your friends location</CardDescription>
        </CardHeader>
        <Search />
      </Card>
    </main>
  );
}
