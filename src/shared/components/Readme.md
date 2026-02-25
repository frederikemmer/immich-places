# Shared Components

The `shared/components` feature exposes reusable UI pieces used across the app shell.

## Purpose

- Compose and render the main photo list surface for both album and timeline modes.
- Display shared loading/empty/pagination behavior.
- Provide thin container wiring from application contexts into presentational list UI.

## Files

- `PhotoList.tsx`
    - High-level layout component for filter bar, album list/detail rendering, and pagination.
    - Receives grouped props for backend, view, catalog, and selection state.
- `PhotoListContainer.tsx`
    - Reads `backend`, `catalog`, `selection`, and `view` contexts.
    - Maps context state/actions into `PhotoList` props.
- `PaginationFooter.tsx`
    - Page navigation controls for timeline mode.
    - Builds compact range with helper from `utils/pagination`.
- `EmptyState.tsx`
    - Placeholder visualization shown when there are no unlocated photos.

## Data flow

1. `PhotoListContainer` reads shared app context values.
2. It computes derived values (selected IDs, active album, missing-count state).
3. It passes context slices into `PhotoList` through typed prop groups.
4. `PhotoList` decides which subview to render (album list or photo grid) and includes
   optional pagination and errors.

## Notes

- `PhotoList` receives explicit grouped props rather than directly reading all context itself,
  making this layer easier to test and reuse.
