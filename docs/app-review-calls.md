# App Review notes — voice / video calls (VoIP)

Keep `UIBackgroundModes: voip`. Do **not** add `audio`.

`voip` is required for iOS PushKit → CallKit so a **killed or locked** iPhone can show the system incoming-call screen and ring. Background `audio` is unused (no persistent playback) and was already rejected under Guideline 2.5.4.

## What reviewers / QA should demo

Record this on a **development or production native build** (not Expo Go).

### iOS (cold start)

1. Install a native iOS build with Push Notifications + Voice over IP enabled on the App ID.
2. Sign in, grant microphone / notifications, and confirm a VoIP token uploads (`apns_voip_token`).
3. Force-quit the app (swipe away).
4. Place a call from another device.
5. The lock screen / CallKit UI must appear and the phone must ring **without opening the app first**.
6. Answer from CallKit → the in-app call screen joins Agora.

### Android (app closed)

1. Native Android build with phone-account / full-screen-intent permissions granted.
2. Force-stop or swipe away the app.
3. Place a call from another device.
4. Telecom / CallKeep incoming UI (or the high-priority `incoming-calls` channel) must alert.
5. Answer → in-app Agora call.

### Either platform (app already open)

Ably `incoming-call` opens `incoming-call` and plays `assets/sounds/ringtone.wav`. This path does not need VoIP.

## If cold-start CallKit is not verified before submit

Do not ship `voip` until the iOS recording above exists. Apple can reject unused VoIP the same way it rejected unused background audio.

## Rebase vs stories PR (#43)

Merge **#43 (stories) first**, then rebase **#42 (calls)** onto `main`.

Shared files (keep **both** sides):

| File | Keep from stories | Keep from calls |
|---|---|---|
| `api/index.jsx` | story helpers (archive, stickers, etc.) | `initiateCall` / accept / reject / history / Ably |
| `app/(tabs)/_layout.jsx` | immersive hide for stories / chat threads | call routes + Event Scan `nestedRouteName === 'scanner'` |
| `app/(tabs)/more.jsx` | Story archive, Close friends | Call history |

This branch already contains that combined wiring so a rebase should not drop call screens or story menu links.
