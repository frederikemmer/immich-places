# Shared Hooks

This directory contains reusable hooks that encapsulate cross-cutting asynchronous application behavior.

## Contents

- `useBackendStatus`

    - Pings the backend health endpoint and keeps ready/error/health state up to date.
    - Runs a health check on mount and supports explicit re-checks.
    - Cancels in-flight checks when unmounted using `AbortController`.

- `useResync`
    - Handles backend sync orchestration.
    - Optionally starts a sync, polls until sync is no longer in progress or timeout occurs, and then refreshes application data.
    - Polling uses exponential backoff and is fully abortable.

## Design notes

- Hooks expose tiny, composable return objects with stable function references for UI wiring.
- All network side effects are cancellable so screens can unmount without leaking async work.
- Hook consumers provide callbacks (`retryBackendAction`, `refreshData`) so state/data behavior stays in feature code while this layer handles control flow.

## Example use

- Use `useBackendStatus` when a page or layout needs to block interactions while backend connectivity is unknown.
- Use `useResync` to trigger synchronization from settings or admin UIs and surface sync progress/errors.
