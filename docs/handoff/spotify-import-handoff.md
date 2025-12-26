# Spotify Import Feature - Handoff Document

## Overview

The Spotify Import feature allows users to import playlists from Spotify into Lidify. It searches for matching tracks on Soulseek (and optionally Lidarr), downloads them, creates a local playlist, and matches downloaded tracks to the playlist.

## Current State

### What Works
1. **Spotify Playlist Parsing**: Fetches playlist metadata via Spotify embed API
2. **Soulseek Downloads**: Direct P2P downloads with retry logic (tries up to 3 different users)
3. **Parallel Processing**: Searches run in parallel, downloads limited to concurrency of 4
4. **Track Matching**: Multiple matching strategies (exact, fuzzy, contains, startsWith)
5. **Pending Track System**: Tracks that fail to download are stored as "pending" with:
   - Deezer preview playback (30s samples)
   - Manual retry button
   - Remove button
6. **Retry Functionality**: Non-blocking retry - returns immediately, downloads in background
7. **Reconciliation**: After library scan, pending tracks are automatically matched to downloaded files

### What Needs Testing
1. **Lidarr Integration**: Download source can be set to "lidarr" but needs end-to-end testing
2. **Lidarr + Soulseek Fallback**: When `downloadSource: "lidarr"` and `soulseekFallback: "failed"`, should try Lidarr first then fall back to Soulseek
3. **Activity Panel Integration**: Downloads should show progress in the activity panel
4. **Edge Cases**: Various artist name formats, special characters, live recordings filtering

## Architecture

### Flow
```
1. User pastes Spotify playlist URL
2. Frontend calls POST /spotify/preview with URL
3. Backend fetches playlist via Spotify embed API
4. Backend searches MusicBrainz for album MBIDs
5. Preview returned to user showing matched/unmatched tracks
6. User confirms import
7. Frontend calls POST /spotify/import
8. Backend:
   a. For each album, either:
      - Sends to Lidarr (if enabled)
      - Downloads directly via Soulseek
   b. Waits for downloads to complete
   c. Runs library scan
   d. Matches tracks to playlist
   e. Creates pending entries for unmatched tracks
9. User sees playlist with matched tracks + failed/pending tracks
```

### Key Files

#### Backend Routes
- `backend/src/routes/spotify.ts` - Main import endpoints
  - `POST /spotify/preview` - Parse and preview playlist
  - `POST /spotify/import` - Execute import job
  - `GET /spotify/import/:jobId/status` - Check job status

- `backend/src/routes/playlists.ts` - Playlist management + pending track handling
  - `GET /playlists/:id/pending/:trackId/preview` - Get fresh Deezer preview URL
  - `POST /playlists/:id/pending/:trackId/retry` - Retry downloading a failed track
  - `DELETE /playlists/:id/pending/:trackId` - Remove pending track from playlist
  - `POST /playlists/:id/pending/reconcile` - Manually trigger reconciliation

#### Backend Services
- `backend/src/services/spotifyImport.ts` - Core import logic
  - `previewPlaylist()` - Parse Spotify URL and match to MusicBrainz
  - `executeImport()` - Run the full import job
  - `reconcilePendingTracks()` - Match pending tracks to library after scan

- `backend/src/services/soulseek.ts` - Direct Soulseek P2P client
  - `searchTrack()` - Search for a track (15s timeout)
  - `downloadTrack()` - Download a single file
  - `searchAndDownload()` - Search + download with retry
  - `searchAndDownloadBatch()` - Parallel search, concurrent download
  - `downloadBestMatch()` - Download from pre-searched results (used by retry)

- `backend/src/services/lidarr.ts` - Lidarr integration
  - `searchAlbum()` - Search for album by MBID
  - `addAlbum()` - Add album to Lidarr for download
  - `getDownloadQueue()` - Check download progress

- `backend/src/services/deezer.ts` - Deezer API for previews
  - `getTrackPreview()` - Get 30s preview URL for a track

- `backend/src/services/musicbrainz.ts` - MusicBrainz lookups
  - `searchRecordingByISRC()` - Find recording by ISRC
  - `searchRecording()` - Search by artist/title
  - `getReleaseDetails()` - Get album details

#### Frontend
- `frontend/app/import/spotify/page.tsx` - Import wizard UI
- `frontend/app/playlist/[id]/page.tsx` - Playlist detail with pending track handling
- `frontend/lib/api.ts` - API client methods

#### Database Schema (relevant tables)
```prisma
model Playlist {
  id            String   @id @default(cuid())
  name          String
  userId        String
  isPublic      Boolean  @default(false)
  spotifyUrl    String?  // Original Spotify URL
  items         PlaylistItem[]
  pendingTracks PlaylistPendingTrack[]
}

model PlaylistPendingTrack {
  id              String   @id @default(cuid())
  playlistId      String
  spotifyArtist   String
  spotifyTitle    String
  spotifyAlbum    String
  spotifyTrackId  String?
  deezerPreviewUrl String?
  sort            Int
  createdAt       DateTime @default(now())
}
```

## Known Issues

### 1. Album Name Shows "Unknown Album"
**Problem**: Pending tracks sometimes show "Unknown Album" instead of the real album name.
**Cause**: Spotify embed API sometimes returns "Unknown Album" for track.album.
**Fix Applied**: Now uses resolved album name from `albumsToDownload` (MusicBrainz data) instead of Spotify embed data.
**File**: `backend/src/services/spotifyImport.ts` line ~280

### 2. Deezer Preview URLs Expire
**Problem**: Deezer preview URLs have timestamps and expire quickly.
**Fix Applied**: Added endpoint to fetch fresh preview URL on demand.
**File**: `backend/src/routes/playlists.ts` - `GET /:id/pending/:trackId/preview`

### 3. Retry Button Was Hanging
**Problem**: Clicking retry would hang for up to 180s (download timeout).
**Fix Applied**: Made retry non-blocking - search first (15s), return immediately, download in background.
**File**: `backend/src/routes/playlists.ts` - `POST /:id/pending/:trackId/retry`

### 4. Missing Files After Scan (Unresolved)
**Problem**: During testing, original downloaded files disappeared from disk, causing scan to remove 7 tracks.
**Status**: Unknown cause - not a code bug. Files were deleted externally. Need to monitor in future tests.

## Testing Checklist

### Soulseek-Only Mode (Current Focus)
- [x] Basic playlist import with Soulseek
- [x] Track matching after download
- [x] Pending track display for failed downloads
- [x] Deezer preview playback
- [x] Retry button functionality
- [x] Remove pending track
- [ ] Toast notifications for retry status
- [ ] Activity panel shows download progress
- [ ] Verify files persist after download

### Lidarr Mode (Needs Testing)
- [ ] Set `downloadSource: "lidarr"` in settings
- [ ] Import playlist - should send albums to Lidarr
- [ ] Lidarr downloads complete
- [ ] Library scan picks up Lidarr downloads
- [ ] Tracks match to playlist

### Lidarr + Soulseek Fallback (Needs Testing)
- [ ] Set `downloadSource: "lidarr"`, `soulseekFallback: "failed"`
- [ ] Import playlist with mix of albums (some in Lidarr, some not)
- [ ] Albums not in Lidarr should fall back to Soulseek
- [ ] Both sources' downloads get matched

## Configuration

System settings relevant to import (in `SystemSettings` table):
```
downloadSource: "soulseek" | "lidarr"
soulseekFallback: "none" | "failed" | "always"
soulseekUsername: string
soulseekPassword: string (encrypted)
lidarrEnabled: boolean
lidarrUrl: string
lidarrApiKey: string (encrypted)
musicPath: string (e.g., "C:/Users/kevin/Music")
```

## Logs

Import logs are written to: `docs/logs/playlists/import_<jobId>_<timestamp>.log`

Session log for Soulseek activity: `docs/logs/playlists/session.log`

## Next Steps

1. Run fresh import test with Soulseek
2. Verify files persist and scan works correctly
3. Test Lidarr-only mode
4. Test Lidarr + Soulseek fallback
5. Add activity panel integration for download progress
6. Consider adding notification when background retry completes