# Selection Feature

The `selection` feature handles selecting photos in the grid/map, assigning GPS locations, and saving those assignments with recoverable error handling.

## Responsibilities

- Maintain selected asset set and pending location state.
- Support click/shift/range and select-all selection interactions.
- Persist selected asset location(s) to backend with bounded concurrency and retry.
- Expose callbacks for post-save side effects and selection clearing.
- Provide a compact confirmation UI for executing location saves.

## Files

- `useSelectionState.ts`
    - Core state machine for selection and pending location.
    - Tracks selected assets, pending coordinates, and shift-selection anchor.
- `useLocationAssignment.ts`
    - Builds high-level assignment flow on top of selection state.
    - Handles save action, partial failure recovery, and local error propagation.
- `locationSave.ts`
    - Implements batched save with configurable concurrency.
    - Executes a second retry pass for failures from the first pass.
- `useSelectionCallbacks.ts`
    - Wraps side-effect callbacks for saved assets and completed batches.
- `useSelectionController.ts`
    - Combines callbacks with assignment behavior and exposes controller-level contract.
- `LocationConfirm.tsx`
    - User interface for confirming/persisting current pending location.
- `constant.ts`
    - Shared user-facing error message for save failures.

## Data flow

1. UI triggers selection updates through controller callbacks.
2. Selection state is updated in `useSelectionState`.
3. Pending location is set and `LocationConfirm` becomes visible.
4. `useLocationAssignment.saveAction` submits coordinates through `saveAssetLocationsWithRetry`.
5. Results propagate back:
    - Success: selected assets are cleared and callback hooks refresh app state.
    - Partial: failed assets remain selected with error context.

## Notes

- `saveAssetLocationsWithRetry` intentionally retries only failed assets once.
- Storage or network failures are converted into partial/no-op outcomes instead of throwing when possible, to support graceful UI recovery.
