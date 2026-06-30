# Tabs navigation restructure

## What changed

All authenticated screens now live under `app/(tabs)/`. Only bootstrap and auth remain at `app/` root.

## Screen vs component split

Feature screen logic lives in `app/(tabs)/<feature>/Partials/` — **not** in `components/`.

| Location | Contents |
|----------|----------|
| `app/(tabs)/events/Partials/` | Events list, detail, scanner, booking UI |
| `app/(tabs)/infoSession/Partials/` | Info session list, scanner, participant detail |
| `app/(tabs)/reservations/Partials/` | Reservation history content |
| `app/(tabs)/chat/Partials/` | Chat list, thread, message UI |
| `app/(tabs)/stories/Partials/` | Story viewer, editor, overlays, highlights |
| `app/(tabs)/more/Partials/` | More hub shell, gamer profile stats |
| `app/(tabs)/_feed/Partials/` | Feed post cards, create post, stories tray (shared across home/profile/saved) |

**Underscore folders** (`_feed/`) have no Expo route — they only hold shared Partials imported by sibling tab screens.

`components/` keeps cross-feature reusable UI only: `ui/`, `layout/`, `helpers/`, `legal/`, profile modals, call widgets, gates.

## Files outside `(tabs)` (allowed)

- `app/index.jsx` — entry redirect
- `app/loading.jsx` — token verification gate
- `app/+not-found.tsx`
- `app/onboarding/`
- `app/auth/` (login, forgot-password, reset-password)

## Moved into `(tabs)/`

- `chat/`, `stories/`, `posts/`, `settings/`
- `more`, `activity`, `saved-posts`, call screens, legal screens, More hub children, reservation/attendance history, etc.

## Navigation

Use `/(tabs)/…` paths in `router.push` / `router.replace` (e.g. `/(tabs)/chat`, `/(tabs)/posts/123`).

Auth paths unchanged: `/auth/login`, `/loading`, `/onboarding`.

## Nested layouts

- `(tabs)/stories/_layout.tsx` — modal presentations for create/viewer/highlight
- `(tabs)/posts/_layout.tsx` — post detail + edit stack
- `(tabs)/settings/_layout.tsx` — close-friends modal

## How to test

1. Cold start → onboarding → login → loading → tabs
2. Navbar: chat, search, notifications, profile
3. Profile ⋯ long-press → More → sub-screens (activity, saved posts, terms, etc.)
4. Feed: open post, edit post, stories create/viewer
5. Incoming/outgoing call flow
6. Push notification deep links (chat, reservations)
