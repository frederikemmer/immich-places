# Lightbox Feature

The `lightbox` feature renders the full-screen image overlay and keeps selection,
navigation, and keyboard interactions synchronized with global app state.

## What this feature does

- Shows an image preview overlay when an asset is selected.
- Handles mount/visibility transition timing to animate open/close smoothly.
- Enables keyboard navigation via `Escape`, `ArrowLeft`, and `ArrowRight`.
- Keeps lightbox target aligned with single-asset selection changes.
- Supports opening the active image directly in Immich.

## Files in this directory

- `AssetLightbox.tsx`
    - Main overlay component.
    - Resolves the current and next/previous assets from catalog list.
    - Connects close/open actions and preview rendering.
- `useLightboxAnimation.ts`
    - Hook that manages mount/visible flags and delayed unmount behavior.
    - Exposes `displayAssetID` for stable transition rendering.
- `useLightboxKeyboard.ts`
    - Hook that wires keyboard shortcuts to close / previous / next actions.
- `useLightboxSelectionSync.ts`
    - Hook to sync active lightbox ID when single selection changes.
- `constant.ts`
    - Stores timeout and keyboard constants used by lightbox hooks/components.

## Runtime flow

1. `AssetLightbox` reads `lightboxAssetID` from UI map context.
2. `useLightboxAnimation` decides when the overlay mounts and becomes visible.
3. `useLightboxKeyboard` registers key handlers while the overlay is active.
4. Navigation handlers update selection and reopen the overlay with neighbors.
5. Closing resets display state after animation delay.
