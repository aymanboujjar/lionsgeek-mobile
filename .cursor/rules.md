## LionsGeek Mobile + Backend — Do Not Break Rules

This file lists **invariants** (contracts) that existing features depend on.
When adding new features or refactoring, **do not change these without updating both backend + mobile in the same PR**.

---

## 1) Auth + session persistence (highest priority)

- **AsyncStorage keys are contracts** (used across `context/`, `app/loading.jsx`, tab guard):
  - `auth_token`
  - `auth_user`
  - `onboarding_seen`
- **Token format**: Mobile uses **Laravel Sanctum personal access tokens** and sends them as:
  - `Authorization: Bearer <token>`
- **Login endpoint contract**:
  - `POST /api/mobile/login`
  - Must return JSON with **exact shape**:
    - `{ token: string, user: object }`
- **Token verification endpoint must remain valid**:
  - `GET /api/mobile/profile`
  - This is the gatekeeper used by `app/loading.jsx`.

---

## 2) API base URL + environment

- **Do not rename** `EXPO_PUBLIC_APP_URL`.
- **Do not hardcode API URLs** in screens/components.
  - Use the shared API wrapper (`api/index.jsx`) and `API.APP_URL`.

---

## 3) Navigation / routes invariants (expo-router)

- **Only these live outside `app/(tabs)/`** (bootstrap + auth):
  - `app/index.jsx`, `app/loading.jsx`, `app/+not-found.tsx`
  - `app/onboarding/`
  - `app/auth/` (`login`, `forgot-password`, `reset-password`)
- **Keep these routes stable** (existing code navigates to them directly):
  - `/loading`
  - `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`
  - `/onboarding`
  - `/(tabs)`
  - `/(tabs)/profile`
  - `/(tabs)/search`
  - `/(tabs)/notifications`
  - `/(tabs)/chat` (and `/(tabs)/chat/[otherUserId]`)
  - `/(tabs)/more`, `/(tabs)/posts/[id]`, `/(tabs)/stories/*`, etc.
- **Visible bottom-tab roots** (do not rename):
  - `index`, `reservations`, `events`, `leaderboard`, `profile` (+ hidden tab routes registered in `(tabs)/_layout.jsx`)
- **Folder structure for new screens (MANDATORY)**:
  - All authenticated app screens **must** live under `app/(tabs)/` (as a tab root, hidden tab, or nested stack folder e.g. `(tabs)/chat/`, `(tabs)/reservations/`).
  - Do not create feature screens at `app/` root except `onboarding/` and `auth/`.
  - Nested stacks use a `_layout.tsx` inside the folder (see `(tabs)/chat/`, `(tabs)/stories/`, `(tabs)/posts/`).
  - Feature-specific screen UI belongs in `app/(tabs)/<feature>/Partials/` (not in `components/`).
  - Shared widgets used by multiple tab screens (e.g. feed post cards) go in `app/(tabs)/_<name>/Partials/` — leading underscore = **no route** (see `_feed/`).
- **`components/` is for reusable UI only** (`ui/`, `layout/`, `helpers/`, profile modals, gates, legal). No feature screens, no `chat/`, `feed/`, `stories/`, `more/`, or feature `Partials/` folders in `components/`.

---

## 4) Shared user object contract

Many components assume these fields exist on `user`:

- **Identity**: `id`, `name`, `email`
- **Avatar**: `image` and/or `avatar` (can be filename or full URL)
- **Roles**: `roles` should behave like an array (ex: `['admin']`, `['coach']`)

If backend changes user shape, update:
- `context/index.jsx` (stored user)
- `components/layout/Navbar.jsx` (avatar normalization)
- feed, notifications, chat components (they read `user.*` and build image URLs)

---

## 5) Always use the shared API wrapper

- For authenticated requests, prefer:
  - `API.getWithAuth(endpoint, token)`
  - `API.postWithAuth(endpoint, data, token)`
- Avoid calling axios directly from new screens.
- **HTTP client (MANDATORY)**:
  - Use **axios only**. `fetch` is forbidden anywhere in the codebase (screens, components, utils, hooks).
  - All HTTP calls must go through the functions exported from `api/index.jsx`. Do not create a second axios instance elsewhere.
  - If an endpoint is missing from `api/index.jsx`, add a new function there first, then consume it — never call axios ad hoc inside a screen/component.

---

## 6) Chat contracts (very easy to break)

Existing chat UI depends on these endpoint paths + response shapes:

- `GET /api/mobile/chat` → `{ conversations: [...] }`
- `GET /api/mobile/chat/following-ids` → `{ following_ids: number[] }`
- `GET /api/mobile/chat/conversation/{userId}` → `{ conversation: {...} }`
- `GET /api/mobile/chat/conversation/{conversationId}/messages` → `{ messages: [...] }`
- `POST /api/mobile/chat/conversation/{conversationId}/send`
  - Must support **`multipart/form-data`**
  - Fields used by the app:
    - `body` (string)
    - `attachment` (file)
    - `attachment_type` in `{ image, video, file, audio }`
- `POST /api/mobile/chat/conversation/{conversationId}/read`
- `DELETE /api/mobile/chat/message/{messageId}`
- `DELETE /api/mobile/chat/conversation/{conversationId}`

Attachment objects in RN are treated as:
- `{ uri, name, type, size }`

---

## 7) Notifications + push

- Push token registration contract:
  - Mobile sends: `POST /api/mobile/push-token` with `{ expo_push_token: string }`
  - Backend must save token for the authenticated user.
- Notifications screen expects:
  - `GET /api/notifications` returning `{ notifications: [...] }`
  - `POST /api/notifications/mark-all-read`

---

## 8) Reservations + training endpoint stability

Mobile currently calls a mix of `/api/mobile/*` and `/api/*` endpoints.
When refactoring backend routes, **preserve these paths** (or change mobile at the same time):

- Training:
  - `GET /api/mobile/trainings`
  - `GET /api/mobile/trainings/{id}`
  - `POST /api/mobile/attendances`
  - `POST /api/mobile/attendance/save`
- Reservations:
  - `GET /api/mobile/reservations`
  - `GET /api/mobile/reservationsCowork`
  - `GET /api/places`
  - `GET /api/users`
  - `GET /api/equipment`
  - `POST /api/reservations/store`
  - `POST /api/cowork/reserve`

---

## 9) Styling (NativeWind)

- Use **NativeWind (Tailwind classNames)** for styling as much as possible. Avoid `StyleSheet.create` unless something genuinely cannot be expressed with utility classes (complex shadows, platform-specific values, animations).
- **Colors must come from the Tailwind color tokens only.** Define/extend the palette once in `tailwind.config.js` (or `colors.ts` if the project centralizes tokens there) and reference colors exclusively through class names that map to those tokens (e.g. `bg-primary`, `text-muted`).
- **Never hardcode hex/rgb colors** inline in components. If a needed color doesn't exist in the token file, add it there first, then use it.

---

## 10) Shared utilities

- Any function used in **more than one place** (formatting, validation, date/time helpers, image URL builders, role checks, etc.) must live in `utils/` (not duplicated per-screen).
- Name utility files by domain, e.g. `utils/date.js`, `utils/user.js`, `utils/format.js`. Import from there instead of re-implementing.
- Pure functions only in `utils/` — no React state, no direct API calls (API calls belong in `api/index.jsx`).

---

## 11) Component reusability

- Build UI as small, reusable components under `components/` (organized by domain: `components/chat/`, `components/layout/`, `components/ui/`, etc.).
- **Screen routes and feature `Partials/` live under `app/(tabs)/<feature>/`** — never under `components/`.
- A screen file in `app/(tabs)/` should mostly **compose** `Partials/` + `components/` — not contain large duplicated JSX.
- Before writing new UI, check `components/ui/` for an existing equivalent (button, input, avatar, badge, card, modal) and reuse/extend it instead of recreating it.

---

## 12) Performance: avoid overload, skeleton loaders, lazy loading

- **Skeleton loaders**: any screen/component that fetches data must show a skeleton placeholder (not a blank screen or only a spinner) while loading. Reuse a shared `components/ui/Skeleton*.jsx` rather than building one-off skeletons per screen.
- **Lazy loading**:
  - Use `React.lazy` / dynamic `import()` (or expo-router's natural code-splitting) for heavy/rarely-used screens and large components (e.g. media viewers, charts, big modals).
  - Lists must be virtualized (`FlatList`/`FlashList`) — never `.map()` to render large/unbounded lists.
  - Paginate or infinite-scroll chat messages, notifications, and reservation lists instead of fetching everything at once.
- **Avoid overload**:
  - Memoize expensive components (`React.memo`) and callbacks/values (`useCallback`/`useMemo`) where re-renders are measurably costly.
  - Debounce/throttle search inputs and any handler tied to fast user input or scroll events.
  - Don't re-fetch on every render — fetch in `useEffect` with correct dependency arrays, and cache where sensible.

---

## 13) Security

- Never log tokens, passwords, or full user objects to the console in production code.
- Always send the auth token via the shared API wrapper headers — never embed it in URLs or query strings.
- Validate/sanitize any user-provided input before sending it to the backend (especially anything rendered back as HTML/markdown).
- Do not store sensitive data (tokens, passwords) anywhere except the contracted AsyncStorage keys (`auth_token`, `auth_user`) — no extra plaintext copies in component state persisted to storage.
- Handle deep links and external URLs defensively (validate scheme/host before navigating or opening).
- Strip/avoid verbose error messages from the backend that could leak internals to the UI — show user-friendly messages via the global error screen (see §15) and log details only in dev.

---

## 14) Documentation requirement

- Every task/feature/fix must be documented as a Markdown file inside a `docs/` folder at the project root.
- One doc per task, named by ticket/feature, e.g. `docs/chat-attachments.md`, `docs/skeleton-loaders.md`.
- Each doc should briefly cover: what changed, why, files touched, any new contracts/endpoints, and how to test.
- If a task breaks an invariant from this file, the doc must explicitly call that out per §16 (Change management).

---

## 15) Global error screen

- The app must have a single shared **Error screen/component** (e.g. `components/ui/ErrorScreen.jsx` or `app/error.jsx` if using expo-router's error boundary) shown whenever:
  - A network/API call fails (after retries, if any) and there's no usable cached data.
  - An unexpected runtime error is caught by an error boundary.
- It should support at minimum: a friendly message, an icon/illustration, and a retry action (re-run the failed function).
- Screens should not invent their own one-off error UI — they call/render the shared error screen/component, optionally passing a custom message.

---

## 16) Git commit convention

- **One commit per concept/change** — do not bundle unrelated changes (e.g. a new screen + an unrelated bugfix) into one commit.
- Use clear, scoped commit messages, e.g.:
  - `feat(chat): add skeleton loader for conversation list`
  - `fix(auth): correct token refresh on 401`
  - `refactor(utils): extract date formatting into utils/date.js`
  - `docs(chat): document attachment upload flow`
- Each commit should leave the app in a working state.

---

## 17) “Change management” rule (how to refactor safely)

If you must break an invariant:
- Update backend + mobile together.
- Add a short note in the PR describing:
  - Old behavior
  - New behavior
  - Migration/compat layer (if any)
  - How to test
- Also add/update the corresponding file in `docs/` per §14.