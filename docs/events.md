# Events tab — mobile architecture

## Auth model (current)

Events / info-session traffic is **Sanctum-authenticated via the mylionsgeek proxy**.

Mobile clients must **not** ship or receive the upstream lionsgeek.ma section API key.

| Concern | Current behavior |
|---------|------------------|
| Client auth | User Sanctum Bearer PAT (`Authorization: Bearer …`) |
| API base | `EXPO_PUBLIC_APP_URL` + `/api/events-info/*` |
| Upstream key | Server-only (`LIONSGEEK_MA_API_KEY` / `config('services.lionsgeek')`) |
| Client secrets | Do **not** define `EXPO_PUBLIC_EVENTS_INFO_SECTION_KEY` (or any section key) — it would ship in the JS bundle |

Authorization is enforced **server-side** on `/api/events-info/*`:

- All routes require `auth:sanctum`
- Public event list/detail/booking: any authenticated user (private events / empty participants filtered in the proxy)
- Scan / PII / check-in routes: Sanctum + `events.info.scan` (admin role **or** `access_scan` on the user record — never from the request body)

## Required mobile env

```env
EXPO_PUBLIC_APP_URL=https://your-api-domain.com
EXPO_PUBLIC_EVENTS_INFO_USE_PROXY=true
# Optional: public CDN base for non-sensitive image display fallbacks only
EXPO_PUBLIC_EVENTS_INFO_SECTION_URL=https://lionsgeek.ma/
```

Do **not** put upstream API keys in any `EXPO_PUBLIC_*` variable.

Config source: `utils/eventsConfig.js` (`EVENTS_API_KEY` is forced empty; proxy mode is required).

## What changed (UI refactor notes)

Aligned `app/(tabs)/events/` with project rules: centralized API calls, pure helpers in `utils/`, shared error UI, list performance, and tokenized colors.

## Folder structure (Inertia-style)

```
app/(tabs)/events/
├── _layout.tsx
├── index.jsx              ← list screen (composes Partials)
├── [id].jsx               ← detail screen (data + composition)
├── scanner.jsx            ← staff QR (guard + lazy EventScanner)
├── participant/[id].jsx   ← staff visitor detail
└── Partials/              ← UI chunks only (no full pages)
```

| Area | Files |
|------|-------|
| API | `api/index.jsx` re-exports `api/events.js` |
| Config | `utils/eventsConfig.js` — env vars (single source) |
| Utils | `utils/events.js`, `utils/eventBooking.js` |
| UI shared | `components/ui/ErrorScreen.jsx`, `components/ui/SectionCard.jsx` |
| Tokens | `constants/Colors.ts` |

## Client API helpers

Exported from `api/index.jsx` (all go through Sanctum proxy when configured):

- `getEvents()`, `getEvent(id)`
- `storeEventBooking(payload)`
- `validateEventInvitation(payload)`
- `manualEventChecking(bookingId, eventId)`
- `collectParticipantOtherRegistrations(...)` — in `utils/events.js`

## How to test

1. Set `.env` with `EXPO_PUBLIC_APP_URL` and `EXPO_PUBLIC_EVENTS_INFO_USE_PROXY=true`; restart Expo with `-c`.
2. Log in so the app has a Sanctum token.
3. **Regular user** — Events tab lists public events; book flow; private/past filtered by server.
4. **Scan staff** (`access_scan` or admin) — participant list, QR scanner, manual check-in.
5. Pull-to-refresh; airplane mode → shared error screen with retry.

## Invariants

No route renames. Auth token storage unchanged. Upstream section keys stay on the server; mobile never embeds them.
