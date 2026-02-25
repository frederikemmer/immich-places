# Albums Feature

The `albums` feature renders the album browser list and manages its initial and
ongoing data loading lifecycle.

## What this feature does

- Loads album metadata from the backend when the catalog becomes ready.
- Applies GPS filter awareness (`with` / `without` locations) to determine visible
  items.
- Shows loading, syncing, error, and empty-state UI directly in the album list.
- Supports retry/reload flows through the exported `useAlbums` hook.

## Files in this directory

- `AlbumList.tsx`
    - Renders the album card grid and empty/loading/error states.
    - Applies optional staggered animation per card and handles album selection.
- `useInitialCatalogLoad.ts`
    - Hooks initial catalog bootstrap actions (first page load and album fetch).
    - Uses refs to guarantee each action runs once.
- `useAlbums.ts`
    - Encapsulates album fetch state (`albums`, `isLoading`, `error`) and load action.
    - Cancels stale requests safely when the GPS filter changes.

## Data flow

1. `useInitialCatalogLoad` is used when the catalog becomes ready.
2. It triggers the first page and album loads.
3. `useAlbums` supplies album state and loading status from the backend service.
4. `AlbumList` reads catalog and view state and renders the final UI.
