# Auth Feature

This feature owns all authentication UX and state for the app, including:

- user session initialization,
- login and registration flows,
- Immich API key setup for authenticated users,
- and the authenticated user menu.

## Files in this directory

- `AuthContext.tsx`
    - Provides `AuthProvider` and `useAuth` context API.
    - Tracks `user`, API key presence, loading state, and auth errors.
    - Exposes `login`, `register`, `logout`, `refreshUser`, and `updateAPIKey` actions.
- `authApi.ts`
    - Contains auth endpoint calls (`register`, `login`, `logout`, `getMe`, `updateSettings`, `getAuthStatus`).
    - Handles request/response validation and typed error signaling.
- `AuthSidebar.tsx`
    - Renders the auth screen shell with `login` and `register` modes.
    - Delegates to `APIKeySetup` when a user exists but no key is configured.
- `APIKeySetup.tsx`
    - Displays Immich API key configuration form and save flow.
    - Offers sign-out from the same panel.
- `UserMenu.tsx`
    - Renders user avatar menu and sign-out action.
- `AuthMap.tsx`
    - Renders a Leaflet map for the auth layout.
- `AuthMapDynamic.tsx`
    - Exposes a lazy-loaded map wrapper used where dynamic import is required.
- `constant.ts`
    - Stores shared auth constants such as `MINIMUM_PASSWORD_LENGTH` and `AUTH_INPUT_CLASS`.

## Runtime behavior

1. `AuthProvider` starts by requesting `/auth/me` to initialize session state.
2. If unauthenticated, UI renders `AuthSidebar` and evaluates `/auth/status` for registration availability.
3. When signed in but lacking an Immich API key, `APIKeySetup` is shown.
4. `UserMenu` is available for authenticated sessions to expose account + sign-out flow.
