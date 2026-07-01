# Events tab — mobile compliance refactor

## What changed

Aligned `app/(tabs)/events/` with `.cursor/rules.md`: centralized API calls, moved pure helpers to `utils/`, added shared error UI, improved list performance, and replaced hardcoded colors.

## Why

The events feature had a separate axios module, feature-local helpers with embedded API calls, custom per-screen error UI, `ScrollView` + `.map()` lists, and inline hex/rgba colors — all violations of the project invariants.

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

Removed page-as-partial files: `EventDetail.jsx`, `ParticipantDetail.jsx`.

| Area | Files |
|------|-------|
| API | `api/index.jsx` — events-info endpoints merged here |
| Utils | `utils/events.js`, `utils/eventBooking.js` (new) |
| UI shared | `components/ui/ErrorScreen.jsx`, `components/ui/SectionCard.jsx` |
| Tokens | `constants/Colors.ts` — `getMutedIconColor`, `Overlays` |
| Events screens | All files under `app/(tabs)/events/Partials/`, `scanner.jsx` |
| Removed | `api/eventsInfoSection.jsx`, `app/(tabs)/events/helpers.js`, `app/(tabs)/events/bookingHelpers.js` |

## API contracts (unchanged behavior)

Events use **API-key auth** (not Sanctum). Env vars:

- `EXPO_PUBLIC_EVENTS_INFO_SECTION_URL` — lionsgeek.ma base (direct mode)
- `EXPO_PUBLIC_EVENTS_INFO_SECTION_KEY` — bearer token
- `EXPO_PUBLIC_EVENTS_INFO_USE_PROXY=true` — route via `EXPO_PUBLIC_APP_URL/api/events-info/*`
- `EXPO_PUBLIC_APP_URL` — required in proxy mode

Exported from `api/index.jsx`:

- `getEvents()`, `getEvent(id)`
- `storeEventBooking(payload)`
- `validateEventInvitation(payload)`
- `manualEventChecking(bookingId, eventId)`
- `fetchParticipantOtherRegistrations(email, excludeEventId)`

## How to test

1. Set `.env` with events URL + key (and proxy flags if needed); restart Expo with `-c`.
2. **Regular user** — Events tab lists public events; tap event → book flow; past/private events hidden.
3. **Scan staff** — Events + Info Session tabs; participant list, QR scanner, manual check-in.
4. **Admin** — Register after event end; scan anytime.
5. Pull-to-refresh on list and detail; trigger airplane mode → shared error screen with retry.
6. Search events — debounced filter; list scrolls via `FlatList`.

## Invariants

No route renames. Auth AsyncStorage keys unchanged. Events remain on separate lionsgeek.ma API-key contract (documented above).
