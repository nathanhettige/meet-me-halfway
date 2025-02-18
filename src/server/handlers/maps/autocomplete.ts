import { publicProcedure } from "@/server/jstack";
import { z } from "zod";

const handler = publicProcedure
  .input(z.object({ input: z.string() }))
  .query(async ({ c, input }) => {
    const url = "https://places.googleapis.com/v1/places:autocomplete";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY as string,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: input.input,
      }),
    });

    const data = (await response.json()) as {
      suggestions: Array<{
        placePrediction: { placeId: string; text: { text: string } };
      }>;
    };

    const predictions = data.suggestions.map((suggestion) => ({
      value: suggestion.placePrediction.placeId,
      label: suggestion.placePrediction.text.text,
    }));

    return c.superjson(predictions);
  });

export default handler;
