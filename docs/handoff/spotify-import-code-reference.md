# Spotify Import - Code Reference

Quick reference to key code sections for the next agent.

## Backend Entry Points

### Preview Playlist
**File**: `backend/src/routes/spotify.ts`
**Endpoint**: `POST /spotify/preview`
**Handler**: Lines ~50-120

```typescript
// Fetches Spotify playlist, searches MusicBrainz for albums
const preview = await spotifyImportService.previewPlaylist(url);
// Returns: matchedTracks, unmatchedTracks, albumsToDownload
```

### Execute Import
**File**: `backend/src/routes/spotify.ts`
**Endpoint**: `POST /spotify/import`
**Handler**: Lines ~130-200

```typescript
// Starts async import job
const job = await spotifyImportService.executeImport(preview, userId, playlistName);
// Returns: jobId for status polling
```

### Retry Pending Track
**File**: `backend/src/routes/playlists.ts`
**Endpoint**: `POST /playlists/:id/pending/:trackId/retry`
**Handler**: Lines ~630-745

```typescript
// Non-blocking retry flow:
// 1. Search Soulseek (15s timeout)
// 2. Return immediately with success/failure
// 3. Download in background
// 4. Trigger library scan after download
```

## Core Import Logic

### spotifyImportService.executeImport()
**File**: `backend/src/services/spotifyImport.ts`
**Function**: Lines ~150-350

Key sections:
- **Lines ~180-220**: Download albums via Lidarr or Soulseek
- **Lines ~230-280**: Wait for downloads, handle failures
- **Lines ~290-350**: Create playlist, match tracks, store pending

### Soulseek Download Flow
**File**: `backend/src/services/soulseek.ts`

Key methods:
- `searchTrack()` - Lines ~150-250: Search with 15s timeout
- `downloadTrack()` - Lines ~300-400: Download single file with 180s timeout
- `searchAndDownloadBatch()` - Lines ~525-600: Parallel search, concurrent download
- `downloadBestMatch()` - Lines ~465-520: Download from pre-searched results

### Track Matching
**File**: `backend/src/services/spotifyImport.ts`
**Function**: `matchTrackToLibrary()` - Lines ~400-500

Matching strategies (in order):
1. Exact normalized title + artist first word
2. Stripped title (remove remaster/remix suffixes)
3. Contains search
4. Fuzzy artist + title
5. StartsWith search
6. Last resort fuzzy

### Pending Track Reconciliation
**File**: `backend/src/services/spotifyImport.ts`
**Function**: `reconcilePendingTracks()` - Lines ~550-650

Called after library scan to match pending tracks to newly added files.

## Frontend Components

### Import Wizard
**File**: `frontend/app/import/spotify/page.tsx`

Key state:
- `step`: "url" | "preview" | "importing" | "complete"
- `preview`: PreviewResult from API
- `jobStatus`: Polling status during import

### Playlist Detail - Pending Tracks
**File**: `frontend/app/playlist/[id]/page.tsx`

Key handlers (Lines ~100-160):
- `handlePlayPreview()` - Fetches fresh Deezer URL, plays audio
- `handleRetryPendingTrack()` - Calls retry API, shows toast
- `handleRemovePendingTrack()` - Removes from playlist

Pending track rendering: Lines ~555-650

## Database Queries

### Get Playlist with Pending Tracks
```typescript
const playlist = await prisma.playlist.findUnique({
  where: { id: playlistId },
  include: {
    items: { include: { track: { include: { album: { include: { artist: true }} }} }},
    pendingTracks: { orderBy: { sort: 'asc' } }
  }
});
```

### Create Pending Track
```typescript
await prisma.playlistPendingTrack.create({
  data: {
    playlistId,
    spotifyArtist: track.artist,
    spotifyTitle: track.title,
    spotifyAlbum: resolvedAlbum,
    spotifyTrackId: track.spotifyId,
    deezerPreviewUrl: previewUrl,
    sort: index
  }
});
```

### Reconcile Pending Track (convert to real track)
```typescript
// Delete pending, add real track
await prisma.$transaction([
  prisma.playlistPendingTrack.delete({ where: { id: pendingId } }),
  prisma.playlistItem.create({
    data: { playlistId, trackId: matchedTrack.id, sort: pending.sort }
  })
]);
```

## Configuration Check

```typescript
const settings = await getSystemSettings();
// Key fields:
// - settings.downloadSource: "soulseek" | "lidarr"
// - settings.soulseekFallback: "none" | "failed" | "always"
// - settings.musicPath: where files are downloaded
// - settings.soulseekUsername / soulseekPassword
// - settings.lidarrUrl / lidarrApiKey
```

## Error Handling Patterns

### Soulseek Connection
```typescript
try {
  await soulseekService.ensureConnected();
} catch (err) {
  // Credentials not configured or connection failed
  return { success: false, error: "Soulseek connection failed" };
}
```

### Download Retry Logic
```typescript
const matchesToTry = allMatches.slice(0, MAX_DOWNLOAD_RETRIES); // 3 attempts
for (const match of matchesToTry) {
  const result = await this.downloadTrack(match, destPath);
  if (result.success) return { success: true, filePath: destPath };
  // Try next user on failure
}
return { success: false, error: "All attempts failed" };
```

## Logging

Session logging for debugging:
```typescript
import { sessionLog } from "../utils/playlistLogger";
sessionLog("SOULSEEK", "Message here"); // INFO level
sessionLog("SOULSEEK", "Error message", "ERROR");
sessionLog("SOULSEEK", "Warning", "WARN");
```

Job-specific logging:
```typescript
import { createPlaylistLogger } from "../utils/playlistLogger";
const logger = createPlaylistLogger(jobId);
logger.info("Message");
logger.error("Error");
logger.debug("Debug info");
```