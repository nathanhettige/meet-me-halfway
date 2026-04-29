import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense, lazy, useState } from "react"
import { Analytics } from "@vercel/analytics/react"

import appCss from "../styles.css?url"

const TanStackDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-devtools").then((mod) => ({
          default: mod.TanStackDevtools,
        }))
      )

const TanStackRouterDevtoolsPanel =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtoolsPanel,
        }))
      )

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
      <Link to="/" className="underline">
        Go home
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        name: "theme-color",
        content: "rgb(60, 133, 190)",
      },
      {
        title: "meet me halfway",
      },
      {
        name: "description",
        content:
          "find the perfect meeting point based on actual driving time.",
      },
      {
        property: "og:title",
        content: "meet me halfway",
      },
      {
        property: "og:description",
        content:
          "find the perfect meeting point based on actual driving time.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: "https://meet-me-halfway.app",
      },
      {
        property: "og:image",
        content: "https://meet-me-halfway.app/screenshot.png",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:image",
        content: "https://meet-me-halfway.app/screenshot.png",
      },
      {
        name: "twitter:title",
        content: "meet me halfway",
      },
      {
        name: "twitter:description",
        content:
          "find the perfect meeting point based on actual driving time.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Suspense>
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: (
                  <Suspense>
                    <TanStackRouterDevtoolsPanel />
                  </Suspense>
                ),
              },
            ]}
          />
        </Suspense>
        <Analytics />
        <Scripts />
      </body>
    </html>
  )
}
