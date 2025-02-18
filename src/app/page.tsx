import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ui/card";
import { Button } from "@ui/button";
import { AutoComplete } from "./components/autocomplete";

export default async function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Meet Me Halfway</CardTitle>
          <CardDescription>Enter you and your friends location</CardDescription>
        </CardHeader>
        <CardContent>
          <AutoComplete />
        </CardContent>
        <CardFooter>
          <Button>Find a place to meet</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
