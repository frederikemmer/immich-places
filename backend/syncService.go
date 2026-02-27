package main

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"golang.org/x/sync/errgroup"
)

const (
	syncPageSize    = 1000
	syncCooldown    = 30 * time.Second
	albumFetchLimit = 5
)

type SyncService struct {
	db                SyncStore
	immichFactory     *ImmichClientFactory
	nominatim         *NominatimClient
	mu                sync.Mutex
	userSyncing       map[string]bool
	lastSyncCompleted map[string]time.Time
	wg                sync.WaitGroup
	shutdownCtx       context.Context
	freqLocGeneration atomic.Int64
}

func newSyncService(db SyncStore, factory *ImmichClientFactory, nominatim *NominatimClient) *SyncService {
	return &SyncService{
		db:                db,
		immichFactory:     factory,
		nominatim:         nominatim,
		userSyncing:       make(map[string]bool),
		lastSyncCompleted: make(map[string]time.Time),
		shutdownCtx:       context.Background(),
	}
}

func (s *SyncService) isUserSyncing(userID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.userSyncing[userID]
}

func (s *SyncService) acquireUserSyncLock(userID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.userSyncing[userID] {
		return false
	}
	s.userSyncing[userID] = true
	return true
}

func (s *SyncService) releaseUserSyncLock(userID string) {
	s.mu.Lock()
	s.userSyncing[userID] = false
	s.lastSyncCompleted[userID] = time.Now()
	s.mu.Unlock()
}

func (s *SyncService) tryStartUserSync(userID string) (string, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.userSyncing[userID] {
		return "already syncing", false
	}
	if time.Since(s.lastSyncCompleted[userID]) < syncCooldown {
		return "cooldown active", false
	}
	s.userSyncing[userID] = true
	return "", true
}

func (s *SyncService) triggerUserSync(userID, apiKey string) (string, bool) {
	reason, ok := s.tryStartUserSync(userID)
	if !ok {
		return reason, false
	}
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		defer s.releaseUserSyncLock(userID)
		immich := s.immichFactory.forUser(apiKey)
		s.doUserIncrementalSync(s.shutdownCtx, userID, immich)
	}()
	return "sync started", true
}

func (s *SyncService) recordSyncError(ctx context.Context, userID, reason string) {
	if err := s.db.setSyncState(ctx, userID, "lastSyncError", reason); err != nil {
		log.Printf("Failed to record sync error for user %s: %v", userID, err)
	}
}

func (s *SyncService) clearSyncError(ctx context.Context, userID string) {
	s.db.deleteSyncState(ctx, userID, "lastSyncError")
}

func (s *SyncService) startUserFullSync(ctx context.Context, userID string, immich SyncImmichAPI) {
	if !s.acquireUserSyncLock(userID) {
		log.Printf("Sync already in progress for user %s, skipping", userID)
		return
	}
	defer s.releaseUserSyncLock(userID)
	s.doUserFullSync(ctx, userID, immich)
}

func (s *SyncService) doUserFullSync(ctx context.Context, userID string, immich SyncImmichAPI) {
	log.Printf("Starting full sync for user %s...", userID)
	start := time.Now()

	totalUpserted, err := s.syncAssets(ctx, userID, immich, nil, "full")
	if err != nil {
		log.Printf("Full sync asset error for user %s: %v", userID, err)
		s.recordSyncError(ctx, userID, fmt.Sprintf("full sync: %v", err))
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	if err := s.db.setSyncState(ctx, userID, "lastFullSyncAt", now); err != nil {
		log.Printf("Failed to set lastFullSyncAt for user %s: %v", userID, err)
	}
	if err := s.db.setSyncState(ctx, userID, "lastSyncAt", now); err != nil {
		log.Printf("Failed to set lastSyncAt for user %s: %v", userID, err)
	}

	s.syncStacks(ctx, userID, immich)
	s.recomputeFrequentLocations(ctx, userID)

	if err := s.db.refreshAssetCountCache(ctx, userID); err != nil {
		log.Printf("failed to refresh asset count cache for user %s: %v", userID, err)
	}

	albumErr := s.syncAlbums(ctx, userID, immich)

	if albumErr != nil {
		s.recordSyncError(ctx, userID, fmt.Sprintf("full sync: %v", albumErr))
	} else {
		s.clearSyncError(ctx, userID)
	}

	log.Printf("Full sync completed for user %s: %d assets in %v", userID, totalUpserted, time.Since(start))
}

func (s *SyncService) startUserIncrementalSync(ctx context.Context, userID string, immich SyncImmichAPI) {
	if !s.acquireUserSyncLock(userID) {
		return
	}
	defer s.releaseUserSyncLock(userID)
	s.doUserIncrementalSync(ctx, userID, immich)
}

func (s *SyncService) doUserIncrementalSync(ctx context.Context, userID string, immich SyncImmichAPI) {
	lastSyncAt, err := s.db.getSyncState(ctx, userID, "lastSyncAt")
	if err != nil {
		log.Printf("Failed to get lastSyncAt for user %s: %v", userID, err)
		return
	}
	if lastSyncAt == nil {
		log.Printf("No previous sync found for user %s, running full sync instead", userID)
		s.doUserFullSync(ctx, userID, immich)
		return
	}

	log.Printf("Starting incremental sync for user %s (since %s)...", userID, *lastSyncAt)
	start := time.Now()

	totalUpserted, err := s.syncAssets(ctx, userID, immich, lastSyncAt, "incremental")
	if err != nil {
		log.Printf("Incremental sync asset error for user %s: %v", userID, err)
		s.recordSyncError(ctx, userID, fmt.Sprintf("incremental sync: %v", err))
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	if err := s.db.setSyncState(ctx, userID, "lastSyncAt", now); err != nil {
		log.Printf("Failed to set lastSyncAt for user %s: %v", userID, err)
	}

	s.syncStacks(ctx, userID, immich)

	if totalUpserted > 0 {
		s.recomputeFrequentLocations(ctx, userID)
	}

	if err := s.db.refreshAssetCountCache(ctx, userID); err != nil {
		log.Printf("failed to refresh asset count cache for user %s: %v", userID, err)
	}

	albumErr := s.syncAlbums(ctx, userID, immich)

	if albumErr != nil {
		s.recordSyncError(ctx, userID, fmt.Sprintf("incremental sync: %v", albumErr))
	} else {
		s.clearSyncError(ctx, userID)
	}

	log.Printf("Incremental sync completed for user %s: %d assets updated in %v", userID, totalUpserted, time.Since(start))
}

func (s *SyncService) syncAssets(ctx context.Context, userID string, immich SyncImmichAPI, updatedAfter *string, label string) (int, error) {
	totalUpserted := 0
	page := 1

	for {
		apiCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		result, err := immich.searchAssets(apiCtx, page, syncPageSize, updatedAfter)
		cancel()
		if err != nil {
			return 0, fmt.Errorf("%s sync error on page %d: %w", label, page, err)
		}

		items := result.Assets.Items
		if len(items) == 0 {
			break
		}

		assets := make([]AssetRow, 0, len(items))
		for _, item := range items {
			assets = append(assets, mapImmichToAssetRow(item))
		}

		if err := s.db.upsertAssets(ctx, userID, assets); err != nil {
			return 0, fmt.Errorf("%s sync failed to batch upsert page %d: %w", label, page, err)
		}
		totalUpserted += len(assets)

		if result.Assets.NextPage == nil {
			break
		}
		nextPage, err := strconv.Atoi(*result.Assets.NextPage)
		if err != nil {
			return 0, fmt.Errorf("%s sync: unexpected non-numeric nextPage token %q", label, *result.Assets.NextPage)
		}
		page = nextPage
	}

	return totalUpserted, nil
}

func (s *SyncService) syncStacks(ctx context.Context, userID string, immich SyncImmichAPI) {
	log.Printf("Syncing stacks for user %s...", userID)

	apiCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	stacks, err := immich.getStacks(apiCtx)
	if err != nil {
		log.Printf("Failed to fetch stacks for user %s: %v", userID, err)
		return
	}

	var updates []stackUpdateRow
	for _, stack := range stacks {
		assetCount := len(stack.Assets)
		for _, asset := range stack.Assets {
			var primaryAssetID *string
			if asset.ID != stack.PrimaryAssetID {
				primaryAssetID = &stack.PrimaryAssetID
			}
			updates = append(updates, stackUpdateRow{
				immichID:       asset.ID,
				stackID:        stack.ID,
				primaryAssetID: primaryAssetID,
				assetCount:     assetCount,
			})
		}
	}

	updated, err := s.db.batchUpdateStackInfo(ctx, userID, updates)
	if err != nil {
		log.Printf("Failed to batch update stack info for user %s: %v", userID, err)
		return
	}

	log.Printf("Stack sync completed for user %s: %d stacks, %d assets updated", userID, len(stacks), updated)
}

func (s *SyncService) recomputeFrequentLocations(ctx context.Context, userID string) {
	clusters, err := s.db.computeFrequentLocationClusters(ctx, userID)
	if err != nil {
		log.Printf("Failed to compute frequent location clusters for user %s: %v", userID, err)
		return
	}

	for i := range clusters {
		clusters[i].Label = formatCoords(clusters[i].Latitude, clusters[i].Longitude)
	}

	if err := s.db.replaceFrequentLocations(ctx, userID, clusters); err != nil {
		log.Printf("Failed to replace frequent locations for user %s: %v", userID, err)
		return
	}

	gen := s.freqLocGeneration.Add(1)
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		s.enrichFrequentLocationLabels(ctx, userID, clusters, gen)
	}()
}

func (s *SyncService) enrichFrequentLocationLabels(ctx context.Context, userID string, clusters []FrequentLocationRow, generation int64) {
	g := new(errgroup.Group)
	g.SetLimit(3)
	for i := range clusters {
		i := i
		g.Go(func() error {
			geocodeCtx, geocodeCancel := context.WithTimeout(ctx, 10*time.Second)
			defer geocodeCancel()
			label, err := s.nominatim.reverseGeocode(geocodeCtx, clusters[i].Latitude, clusters[i].Longitude)
			if err != nil {
				log.Printf("Failed to geocode cluster: %v", err)
				return nil
			}
			clusters[i].Label = label
			return nil
		})
	}
	g.Wait()

	if s.freqLocGeneration.Load() != generation {
		log.Println("Skipping stale frequent location label write (newer sync in progress)")
		return
	}

	if err := s.db.replaceFrequentLocations(ctx, userID, clusters); err != nil {
		log.Printf("Failed to update frequent location labels for user %s: %v", userID, err)
	}
}

type albumWork struct {
	album   ImmichAlbumResponse
	changed bool
}

type albumFetchResult struct {
	albumID  string
	assetIDs []string
}

func (s *SyncService) syncAlbums(ctx context.Context, userID string, immich SyncImmichAPI) error {
	log.Printf("Syncing albums for user %s...", userID)

	listCtx, listCancel := context.WithTimeout(ctx, 30*time.Second)
	defer listCancel()
	albums, err := immich.getAlbums(listCtx)
	if err != nil {
		return fmt.Errorf("fetch albums: %w", err)
	}

	existingAlbums, err := s.db.getAlbumUpdatedAtMap(ctx, userID)
	if err != nil {
		return fmt.Errorf("get album updatedAt map: %w", err)
	}

	albumIDs, changedWork := s.upsertAlbumMetadata(ctx, userID, albums, existingAlbums, immich)

	if err := s.fetchAndReplaceAlbumAssets(ctx, userID, changedWork, immich); err != nil {
		return err
	}

	if err := s.db.deleteAlbumsNotIn(ctx, userID, albumIDs); err != nil {
		log.Printf("Failed to clean up stale albums for user %s: %v", userID, err)
	}

	log.Printf("Album sync completed for user %s: %d albums", userID, len(albums))
	return nil
}

func (s *SyncService) upsertAlbumMetadata(ctx context.Context, userID string, albums []ImmichAlbumResponse, existing map[string]string, _ SyncImmichAPI) ([]string, []albumWork) {
	albumIDs := make([]string, 0, len(albums))
	work := make([]albumWork, 0, len(albums))

	for _, album := range albums {
		albumIDs = append(albumIDs, album.ID)

		if err := s.db.upsertAlbum(ctx, userID, album.ID, album.AlbumName, album.AlbumThumbnailAssetID, album.AssetCount, album.UpdatedAt, album.StartDate); err != nil {
			log.Printf("Failed to upsert album %s for user %s: %v", album.ID, userID, err)
			continue
		}

		changed := existing[album.ID] != album.UpdatedAt
		work = append(work, albumWork{album: album, changed: changed})
	}

	return albumIDs, work
}

func (s *SyncService) fetchAndReplaceAlbumAssets(ctx context.Context, userID string, work []albumWork, immich SyncImmichAPI) error {
	g := new(errgroup.Group)
	g.SetLimit(albumFetchLimit)
	var fetchMu sync.Mutex
	var fetched []albumFetchResult

	for _, w := range work {
		if !w.changed {
			continue
		}
		album := w.album
		g.Go(func() error {
			fetchCtx, fetchCancel := context.WithTimeout(ctx, 30*time.Second)
			defer fetchCancel()
			assetIDs, err := immich.getAlbumAssetIDs(fetchCtx, album.ID)
			if err != nil {
				return fmt.Errorf("fetch asset IDs for album %s: %w", album.ID, err)
			}
			fetchMu.Lock()
			fetched = append(fetched, albumFetchResult{albumID: album.ID, assetIDs: assetIDs})
			fetchMu.Unlock()
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return fmt.Errorf("album asset fetch: %w", err)
	}

	for _, result := range fetched {
		if err := s.db.replaceAlbumAssets(ctx, userID, result.albumID, result.assetIDs); err != nil {
			return fmt.Errorf("replace album assets for %s: %w", result.albumID, err)
		}
	}

	return nil
}

func (s *SyncService) startPeriodicSync(ctx context.Context, intervalMS int) {
	ticker := time.NewTicker(time.Duration(intervalMS) * time.Millisecond)
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				s.syncAllUsers(ctx)
			case <-ctx.Done():
				log.Println("Periodic sync stopped")
				return
			}
		}
	}()
}

func (s *SyncService) syncAllUsers(ctx context.Context) {
	db, ok := s.db.(*Database)
	if !ok {
		return
	}
	users, err := db.getUsersWithAPIKeys(ctx)
	if err != nil {
		log.Printf("Periodic sync: failed to load users: %v", err)
		return
	}
	for _, u := range users {
		if u.ImmichAPIKey == nil {
			continue
		}
		immich := s.immichFactory.forUser(*u.ImmichAPIKey)
		s.startUserIncrementalSync(ctx, u.ID, immich)
	}
}

func mapImmichToAssetRow(item ImmichAssetResponse) AssetRow {
	asset := AssetRow{
		ImmichID:         item.ID,
		Type:             item.Type,
		OriginalFileName: item.OriginalFileName,
		FileCreatedAt:    item.FileCreatedAt,
	}
	if item.ExifInfo != nil {
		asset.Latitude = item.ExifInfo.Latitude
		asset.Longitude = item.ExifInfo.Longitude
		asset.City = item.ExifInfo.City
		asset.State = item.ExifInfo.State
		asset.Country = item.ExifInfo.Country
		asset.DateTimeOriginal = item.ExifInfo.DateTimeOriginal
	}
	return asset
}
