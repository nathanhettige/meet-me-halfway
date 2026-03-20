# AGENTS.md — Meet Me Halfway

## What This App Is

Meet Me Halfway is a meeting point finder. Given two or more people's
addresses, it calculates the fairest geographic midpoint between them and
recommends nearby venues where everyone can meet.

"Fair" means equal driving time, not equal straight-line distance. A river,
mountain range, or highway layout can make the geographic center wildly unfair
in practice. The app corrects for this by optimizing on actual travel time.

The app is completely stateless — no user accounts, no saved searches, no
authentication. Enter addresses, get results.

---

## User Flow

### Home Page

- The user sees a form with at least two address input fields.
- Each field provides autocomplete suggestions as the user types — results
  appear live, not on form submission.
- Selecting a suggestion captures a structured place identifier (not raw text)
  so the location can be precisely resolved later.
- The user can add more address fields dynamically (no stated maximum).
- Any field beyond the minimum two can be individually removed.
- Submitting the form navigates to the results page, passing the selected
  place identifiers.

### Results Page

- A two-panel layout:
  - **Left sidebar** — scrollable list of results and search statistics.
  - **Right panel** — a full-height interactive map.
- The page triggers the midpoint computation on load and displays results
  once the server responds.

---

## Address Input UX

- Autocomplete queries fire as the user types (debounced, not on submit).
- Suggestions show a display name; selecting one stores the underlying
  place identifier for precise geocoding.
- The input behaves like a combobox — keyboard navigable, dismissible.
- Minimum two fields are always visible and cannot be removed.
- An "Add" button appends a new empty field. Each extra field has its own
  remove button.

---

## Core Algorithm — Iterative Midpoint Optimization

### Step 0: Initial Midpoint

Compute the true spherical midpoint of all input locations. This means
converting each lat/lng pair to 3D Cartesian coordinates (x, y, z),
averaging the vectors, and converting back to lat/lng using atan2. A naive
average of lat/lng values is incorrect near the poles and the antimeridian.

### Iteration Loop (up to 10 rounds)

Each iteration:

1. **Find venues** near the current candidate midpoint.
2. **Measure actual driving time** (traffic-aware) from every person's
   starting location to the nearest venue.
3. **Evaluate fairness:**
   - If the absolute travel time difference is ≤ 30 seconds, stop.
   - If the percentage travel time difference is ≤ 5%, stop.
4. **Adjust:** Shift the candidate midpoint toward the person with the
   longest drive. The shift is weighted by the percentage imbalance —
   a large imbalance causes a larger shift.
5. **Repeat** from step 1 with the new candidate.

### Rural / Empty Area Fallback

If no venues are found near the current candidate point (e.g., the midpoint
falls in a forest, desert, or body of water), search for the nearest
populated locality within 50 km and redirect the venue search there.

### Best Result Tracking

The algorithm tracks the most balanced result across all iterations.
The final answer is not necessarily the last iteration — it is whichever
iteration achieved the smallest travel time imbalance.

---

## Venue Search

- Searches for places of interest near the optimized midpoint: cafes,
  restaurants, bars, museums, and similar gathering spots.
- Each venue result includes: name, formatted address, and star rating.
- The search is centered on the optimized midpoint, not the raw
  geographic center.

---

## Results Display

### Search Statistics Card

- Number of iterations the algorithm ran.
- Which iteration found the best (most balanced) midpoint.
- Absolute travel time difference (e.g., "2m 30s").
- Percentage travel time difference.

### Venue List

- A scrollable list of recommended nearby places.
- Each card shows the venue name, address, and star rating.

### Interactive Map

- Auto-fits bounds on load to contain all markers.
- Follows system color scheme (light / dark mode).
- Marker types:
  - **Starting locations** — one per person, visually distinct
    (e.g., house icon, colored glyph).
  - **Iteration markers** — numbered markers showing each iteration's
    candidate midpoint, so the user can see the algorithm converging.
  - **Final marker** — a distinct marker at the recommended meeting point.

---

## Key Design Decisions

- Travel time is always real driving time with traffic awareness, never
  straight-line or "as the crow flies" distance.
- Spherical geometry is required for midpoint calculation — flat-earth
  lat/lng averaging produces incorrect results at scale.
- The map rendering API key (client-side, public) must be separate from
  the geocoding/routing API key (server-side, secret).
- All computation (geocoding, routing, venue search, optimization) happens
  server-side. The client only submits place identifiers and renders results.
- The app is entirely stateless per session — no persistence layer.

---

## Environment Variables

Two API keys are required:

- **Server-side key** — used for geocoding, route/travel-time computation,
  and venue search. Never exposed to the browser.
- **Client-side key** — used only for rendering the interactive map in the
  browser. Safe to expose publicly but should be domain-restricted.
