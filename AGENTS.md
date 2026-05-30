# RUET Hall — Mobile App (`hall-app/`)

Expo SDK **56** student mobile app. Feature parity with `web/` (student portal). Read https://docs.expo.dev/versions/v56.0.0/ before writing code.

## Stack

| Item | Choice |
|------|--------|
| Framework | Expo SDK 56, React Native 0.85, React 19.2 |
| Routing | `expo-router` — file-based, native bottom tabs + stack |
| Auth | `Authorization: Bearer {sessionId}` + `expo-secure-store` |
| Theme | System / Light / Dark — Material 3-inspired palette |
| Keyboard | `react-native-keyboard-controller` + `KeyboardAwareScrollView` |
| System UI | `expo-status-bar` + `expo-navigation-bar` via `SystemChrome` |

## Layout (no sidebar)

- **Bottom tabs:** Home, Dining, Pay, Profile
- **Stack screens:** Admission, Report Damage, Settings (pushed from Home/Profile)
- Do **not** add a sidebar — mobile-native navigation only

## Backend connection

- API base: `EXPO_PUBLIC_API_URL` in root `.env` (e.g. `http://192.168.x.x:8000/api`)
- Android emulator default: `http://10.0.2.2:8000/api`
- iOS simulator default: `http://localhost:8000/api`
- Session: parse `sessionId` from `Set-Cookie` on login; store in SecureStore; send as Bearer token (backend `auth.middleware.ts` supports both cookie and Bearer)

## Project structure

```
src/
  app/                    # expo-router routes
    (auth)/               # login, signup
    (app)/
      (tabs)/             # bottom tab screens
      admission.tsx       # stack
      report-damage.tsx
      settings.tsx
  components/             # Screen, ui/*, system-chrome
  contexts/               # AuthContext, ThemeContext
  lib/
    api.ts                # fetch client
    auth-storage.ts       # SecureStore session/user
    services/             # mirrors web/lib/services/*
  constants/theme.ts      # colors, spacing
```

## Conventions

1. Use native RN components — avoid web-only patterns (sidebar, desktop layouts).
2. Wrap form screens in `Screen` (uses `KeyboardAwareScrollView`).
3. Sync status bar + Android nav bar through `SystemChrome` / `useAppTheme().colors`.
4. Keep `src/lib/types.ts` aligned with `web/lib/types.ts` student types.
5. Payment gateway redirects: `expo-web-browser` `openBrowserAsync`.
6. Image uploads: `expo-image-picker` + FormData (same fields as web).

## Run

```bash
cd hall-app
npm install
# set EXPO_PUBLIC_API_URL in repo root .env
npx expo start
```

## Agent skill

Persistent context: `.agents/skills/hall-app/SKILL.md` (monorepo root).
