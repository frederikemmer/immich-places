# Map Feature

This folder contains the map feature for the application, including map initialization, dynamic loading, map controls, marker rendering, and overview-layer synchronization.

## Purpose

The map feature is responsible for:

- Mounting and configuring the Leaflet map instance.
- Rendering clustered overview markers for geo-tagged assets.
- Keeping marker visibility and selection state synchronized with app state.
- Handling marker interactions (click, drag, cluster click).
- Managing focused asset scrolling/location behavior and pending selection markers.

## Main entry points

- `MapView`: main map component that composes overlays and controls.
- `MapViewDynamic`: lazy-loaded variant of `MapView` using `createMapDynamic`.
- `createMapDynamic`: shared helper for dynamic component loading.

## Architecture snapshot

- `useMapViewController` and `useMapViewRefs` provide map-instance orchestration and ref state.
- `useMapViewModel` builds derived map data and handlers.
- `useMapViewEffects` and `useMapViewController` handle bootstrap, click handlers, and auto-fit behavior.
- `useMapDropHandlers` centralizes drag/drop asset assignment.

## Overview marker pipeline

- `useOverviewLayer` coordinates marker orchestration for the overview mode.
- `useOverviewLayerReconcile` creates/rebuilds the cluster group and delegates marker reconciliation.
- `overviewLayerReconcile.helpers` re-exports sync primitives used by reconcile logic.
- `overviewLayerMarkerSync` mutates marker set and binds marker interactions.
- `overviewLayerSelectionSync` keeps focused and selected marker state in sync.
- `overviewLayerFocusEffects` and `overviewLayerFocus` (via hooks) react to focus transitions.
- `overviewLayerClusterSync` contains cluster event wiring and click behavior.
- `overviewLayerMarkerSync` and `clusterIcon` implement the marker visuals.

## Constants and iconography

- `constants.ts` holds map UI and icon styling values.
- `icons.ts` exports SVG markers for map assets, overview pins, and search pin overlays.
- `clusterIcon.ts` builds cluster HTML icons with optional greyscale state.

## Data flow

1. `MapView` acquires map state from view model and controller hooks.
2. `useOverviewLayer` receives marker data and selection refs.
3. `useOverviewLayerReconcile` builds/refreshes `L.markerClusterGroup` and calls shared sync functions.
4. Marker interactions update refs and trigger app-level callbacks (location set, toggle selection, lightbox open).
5. Focus hooks (`useFocusMapAsset`, `useOverviewLayerFocusEffects`) can alter selected/focused assets and map location.

## Files

- `MapView.tsx` / `MapViewDynamic.tsx`: rendered map UI.
- `MapControls.tsx` / `MapOverlays.tsx`: overlay controls and UI decorations.
- `useMapViewController.ts`, `useMapViewRefs.ts`, `useMapViewModel.ts`, `useMapViewEffects.ts`: core controller, state refs, model composition.
- `useMapMarkers.ts`, `useOverviewLayer.ts`, `useOverviewLayerReconcile.ts`, `overviewLayerMarkerSync.ts`, `overviewLayerSelectionSync.ts`, `overviewLayerFocusEffects.ts`, `overviewLayerClusterSync.ts` and helpers: overview marker logic.
- `useFocusMapAsset.ts`, `useFocusMapAsset.flow.ts`: focus behavior and flow resolution.
- `usePendingSelectionMarker.ts`, `useMapDropHandlers.ts`: supporting selection/pending marker/drag behaviors.
- `icons.ts`, `clusterIcon.ts`, `constants.ts`: style and icon assets.
