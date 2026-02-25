# Shared Context

This directory defines the global state layer for the application. It uses React context and a set of domain-specific hooks to keep cross-feature state synchronized in one place.

## Purpose

- Provide a single source of truth for runtime domain state (backend, catalog, selection, view, map UI, and map scene).
- Expose safe, validated hooks so features do not access raw context internals directly.
- Encapsulate reducer actions and domain-specific transitions in one module set.

## Main concepts

- **`AppContext`** — Creates and exports the React context and typed selectors (`useBackend`, `useCatalog`, `useSelection`, `useUIMap`, `useView`, `useMapScene`).
- **`useAppProviderState`** — Owns initial state composition, reducer wiring, and action handlers for all provider domains.
- **`AppProvider`** — Context provider that publishes the computed state object from `useAppProviderState` to descendants.
- **Domain hooks** (`useCatalogDomain`, `useViewDomain`) — Implement focused state transitions for specific slices of the model.
- **Map controller hooks** (`useUIMapController`) — Encapsulate map-lightbox UX transitions.
- **Value hooks** (`useProviderValues`) — Convenient selectors for each domain slice.

## Data flow

1. `AppProvider` mounts and invokes `useAppProviderState`.
2. State and dispatch-capable handlers are created by composing domain controllers and stored in context state.
3. Features call the domain selectors (`useView`, `useCatalog`, etc.) from `AppContext`.
4. Actions mutate domain state through the typed callbacks provided by the provider and shared reducer logic.

## Usage notes

- Prefer domain hooks or the value selectors over direct object mutation.
- Keep UI-specific behavior in the feature layer; keep state transitions in this shared context layer.
- Use the exported hooks from this directory instead of importing shared internals directly.
