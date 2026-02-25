# Shared Services

This directory contains the backend service layer used by features and shared hooks.

## Purpose

- Centralize HTTP calls to the backend under consistent URL, timeout, and header behavior.
- Provide runtime validators for backend payloads to protect application state from malformed API responses.
- Export convenience helpers for building asset URLs (thumbnail/preview).

## Modules

- `backendApi.ts`

    - Domain-oriented API functions (`fetchAssets`, `fetchAlbums`, `fetchMapMarkers`, `saveAssetLocation`, `triggerSync`, etc.).
    - Normalizes page/query parameters, calls transport helpers, and validates responses.

- `backendApi.fetch.ts`

    - `backendFetch` wraps `fetch` with default client headers and request timeout/abort behavior.
    - `parseJSON` applies runtime validation after JSON parsing.

- `backendApi.guards.ts`
    - Runtime type guards that validate backend payloads (`isPaginatedAssets`, `isAlbumRow`, `isSyncStatus`, etc.).

## Flow

1. Feature code calls an exported function in `backendApi.ts`.
2. Function builds request URL + query string, then calls `backendFetch`.
3. Response body is parsed and validated by `parseJSON` using a matching guard from `backendApi.guards.ts`.
4. Typed data is returned or an error is thrown for invalid payloads.

## Contracts and safety

- Guards are used for all major API responses and prevent invalid data from entering stores/hooks.
- Requests are abortable and respect caller-provided signals.
- Timeout behavior is centralized through shared constants.
