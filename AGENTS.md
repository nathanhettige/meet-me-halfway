# AGENTS.md — Meet Me Halfway

## Project Overview

Meet Me Halfway finds the fairest meeting point between two or more people
by optimizing on actual driving time, not straight-line distance. It is
entirely stateless — no accounts, no persistence. Enter addresses, get results.

**Stack:** TanStack Start (Router + React Query) on Vite + Nitro, React 19,
Tailwind CSS v4, shadcn/ui (radix-vega), React Three Fiber (3D landing),
Framer Motion, Google Maps APIs. Package manager is **pnpm**.

---

## Commands

| Task             | Command                                    | Notes                         |
| ---------------- | ------------------------------------------ | ----------------------------- |
| Dev server       | `pnpm dev`                                 | Runs on port 3002             |
| Build            | `pnpm build`                               | Vite + Nitro production build |
| Type check       | `pnpm typecheck`                           | `tsc --noEmit`                |
| Lint             | `pnpm lint`                                | ESLint (TanStack config)      |
| Format           | `pnpm format`                              | Prettier (writes in place)    |
| All tests        | `pnpm test`                                | `vitest run`                  |
| Single test      | `pnpm vitest run src/path/to/file.test.ts` |                               |
| Add UI component | `pnpm dlx shadcn@latest add <name>`        | Adds to `src/components/ui/`  |

---

## Project Structure

```
src/
  routes/             File-based routing (TanStack Router)
    __root.tsx         Root layout (QueryClientProvider, meta)
    index.tsx          Home / landing page
    results.tsx        Results page (places + map)
  components/
    ui/                shadcn/ui generated components (do not hand-edit)
    balloon-text.tsx   3D balloon text (React Three Fiber)
    landing-form.tsx   Landing page form (Framer Motion)
    autocomplete.tsx   Address autocomplete (@base-ui/react)
    clouds.tsx         SVG cloud animations
    results/           Results page components (place-card, mini-map, etc.)
  hooks/
    use-maps.ts        useAutocomplete, useSearch (React Query)
  server/maps/
    search.ts          Main midpoint optimization loop
    autocomplete.ts    Google Places Autocomplete
    calculate-midpoint.ts  Spherical midpoint (Cartesian/atan2)
    snap-midpoint.ts   Snap midpoint to nearest road/city
    fetch-*.ts         Google API wrappers (routes, places, photos, etc.)
    get-place-coordinates.ts  Geocode a place to lat/lng
    types.ts           Shared types (Coordinates, Place, etc.)
    __tests__/         Unit tests for server logic
  lib/utils.ts         cn() utility (clsx + tailwind-merge)
  styles.css           Tailwind v4 config + theme + custom animations
  routeTree.gen.ts     AUTO-GENERATED — do not edit
```

---

## Code Style

### Formatting (Prettier)

- No semicolons
- Double quotes (`"not 'single'"`)
- 2-space indentation, 80-char print width
- Trailing commas (ES5 style)
- LF line endings
- Tailwind class sorting via `prettier-plugin-tailwindcss`

### TypeScript

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, etc.)
- `verbatimModuleSyntax: true` — always use `import type` for type-only imports
- Use `type` (not `interface`) for object shapes
- Use `Array<T>` (not `T[]`) — enforced by ESLint
- Path alias: `@/*` maps to `src/*` — use it for all internal imports

### Naming

- **Files:** kebab-case (`address-form.tsx`, `use-maps.ts`)
- **Components:** PascalCase function declarations (`function LandingForm()`)
- **Hooks:** camelCase with `use` prefix (`useAutocomplete`)
- **Types:** PascalCase (`type Coordinates = { ... }`)
- **Server functions:** camelCase (`fetchPlaceDetails`, `calculateMidpoint`)
- **Variables/functions:** camelCase

### Imports

Order enforced by ESLint: builtin > external > internal > parent > sibling.

```tsx
import { useState, useCallback } from "react" // external
import { useNavigate } from "@tanstack/react-router" // external
import { MapPin } from "lucide-react" // external
import { Button } from "@/components/ui/button" // internal (@/ alias)
import { cn } from "@/lib/utils" // internal (@/ alias)
import type { Coordinates } from "@/server/maps/types" // type import last
```

### Components

- Use **named exports** (not default): `export function Component() {}`
- Props: inline `type` or standalone `type ComponentProps = { ... }`
- Use `React.ComponentProps<"div">` for extending HTML element props
- Use `cn()` for conditional/merged class names
- Use `cva()` for variant-based component styling

### Error Handling

- Server functions: check `response.ok`, read error body, `throw new Error()`
  with context including status and response text
- No try/catch in server functions — errors propagate to React Query
- Client: React Query handles loading/error states via `isLoading`, `isError`

### Styling

- Tailwind CSS v4 (CSS-first config in `styles.css`, no `tailwind.config.js`)
- Use semantic color tokens (`bg-background`, `text-muted-foreground`)
- Use `gap-*` with flex (not `space-x-*` / `space-y-*`)
- Use `size-*` when width and height are equal
- All UI copy must be **lowercase** — no capital letters in user-facing text
- Dark mode via CSS custom properties, not manual `dark:` overrides

### Server Functions (TanStack Start)

```tsx
const myServerFn = createServerFn({ method: "GET" })
  .validator((input) => input as { param: string })
  .handler(async ({ input }) => {
    const response = await fetch(url, {
      headers: { "X-Goog-Api-Key": process.env.MAPS_API_KEY! },
    })
    if (!response.ok)
      throw new Error(`API error ${response.status}: ${await response.text()}`)
    return (await response.json()) as ResultType
  })
```

### Routes (TanStack Router)

- File-based routing in `src/routes/`
- Export `Route` using `createFileRoute("/path")({ component: PageComponent })`
- Root layout uses `createRootRoute()`
- Search params validated with `validateSearch`
- `src/routeTree.gen.ts` is auto-generated — never edit it

---

## Environment Variables

Two Google Maps API keys required (see `.env.template`):

- `MAPS_API_KEY` — server-side only. Used for geocoding, routing, place search.
  Never exposed to the browser.
- `VITE_GOOGLE_MAPS_API_KEY` — client-side only. Used for map rendering.
  Accessed via `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.

---

## Do Not Edit

- `src/routeTree.gen.ts` — auto-generated by TanStack Router
- `src/components/ui/*` — generated by shadcn CLI; update via
  `pnpm dlx shadcn@latest add <component> --overwrite`
- `.output/`, `.tanstack/` — build artifacts (gitignored)
