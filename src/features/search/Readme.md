# Search Feature

The `search` feature powers place lookup for map navigation.

It lets users type a location query, see debounced autocomplete results, select a result,
and persist recent selections for repeat use.

## Directory files

- `PlaceSearch.tsx`
    - UI entry point for location search.
    - Uses `usePlaceSearch` to run queries and render state.
- `usePlaceSearch.ts`
    - Debounced query execution and cancellation logic.
    - Tracks open/closed dropdown state, loading, and errors.
    - Handles outside-click dismissal and selection side-effects.
- `nominatim.ts`
    - Geocoder service client.
    - Supports local proxy endpoint search and Nominatim response parsing/normalization.
- `searchHistory.ts`
    - Read/write helpers for browser-stored place history.
    - Includes validation, normalization, de-duplication, TTL trimming, and persistence helpers.
- `constant.ts`
    - Event/constant values used by search components.

## Runtime flow

1. `PlaceSearch` renders the input and dropdown and passes callbacks to `usePlaceSearch`.
2. Input changes call `handleChange`, which debounces and triggers `doSearch`.
3. `doSearch` calls `searchPlaces` with `AbortController` support to avoid stale work.
4. Results are rendered in a menu; selecting one:
    - parses and validates coordinates,
    - sends the location to the map selection action,
    - optionally updates displayed query text,
    - and persists the result to local history.
5. Focus/outside-click behavior controls dropdown visibility.

## Notes

- All geocode responses are parsed through strict guards before being surfaced to UI.
- History writes are best-effort and intentionally non-blocking when storage is unavailable.
