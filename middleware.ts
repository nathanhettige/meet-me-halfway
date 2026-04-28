import { next } from "@vercel/edge"

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30

// In-memory store (per-isolate, not globally consistent — sufficient for abuse prevention)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > MAX_REQUESTS_PER_WINDOW
}

// Clean up stale entries periodically to prevent memory leaks
function cleanup() {
  const now = Date.now()
  for (const [ip, entry] of requestCounts) {
    if (now > entry.resetAt) {
      requestCounts.delete(ip)
    }
  }
}

export default function middleware(request: Request) {
  const url = new URL(request.url)

  // Only rate-limit server function endpoints
  if (!url.pathname.startsWith("/_serverFn")) {
    return next()
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  // Run cleanup occasionally (~1% of requests)
  if (Math.random() < 0.01) {
    cleanup()
  }

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "too many requests, please try again later" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      },
    )
  }

  return next()
}

export const config = {
  matcher: "/_serverFn/:path*",
}
