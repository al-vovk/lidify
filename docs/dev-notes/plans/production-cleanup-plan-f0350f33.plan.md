<!-- f0350f33-28ae-4b99-a6ef-c0ec4fc46b90 3ebd44b8-4704-4bf4-a7cc-824ec82aafa3 -->
# Fix Lidarr Webhooks, Progress Updates, and Discovery Isolation

## Issue 1: Lidarr Webhook URL Missing /api Prefix (Critical)

**Root Cause**: [backend/src/routes/systemSettings.ts](backend/src/routes/systemSettings.ts) line 276 sets webhook URL to `http://host.docker.internal:3006/webhooks/lidarr` but the route is mounted at `/api/webhooks` in [backend/src/index.ts](backend/src/index.ts) line 137.

**Fix**: Update the webhook URL construction to:

1. Add `/api` prefix to the path
2. Use a smarter URL based on the request origin or a configurable callback URL
```typescript
// Line 276 - change from:
const webhookUrl = "http://host.docker.internal:3006/webhooks/lidarr";

// To something like:
const callbackHost = process.env.LIDIFY_CALLBACK_URL || "http://host.docker.internal:3006";
const webhookUrl = `${callbackHost}/api/webhooks/lidarr`;
```


Also add `LIDIFY_CALLBACK_URL` to Docker compose environment variables so users can configure it.

---

## Issue 2: Audiobook/Podcast Progress Not Updating Real-time

**Root Cause**: [frontend/app/audiobooks/page.tsx](frontend/app/audiobooks/page.tsx) computes `continueListening` from `useAudiobooksQuery()` data only. When playback starts, the audio context updates but the query cache doesn't invalidate.

**Fix**: Modify the audiobooks page to:

1. Check if `currentAudiobook` from audio context matches any book in the list
2. If the currently playing audiobook isn't in `continueListening`, prepend it
3. Invalidate audiobooks query when playback starts/stops
```typescript
// In audiobooks page, combine query data with audio context
const { currentAudiobook } = useAudio();

const continueListening = useMemo(() => {
    const inProgress = audiobooks.filter(
        (book) => book.progress && book.progress.progress > 0 && !book.progress.isFinished
    );
    
    // If currently playing an audiobook that's not in the list, add it
    if (currentAudiobook && !inProgress.find(b => b.id === currentAudiobook.id)) {
        const currentBook = audiobooks.find(b => b.id === currentAudiobook.id);
        if (currentBook) {
            return [currentBook, ...inProgress];
        }
    }
    return inProgress;
}, [audiobooks, currentAudiobook]);
```


---

## Issue 3: Discovery Albums Not Isolated from Library

**Root Cause Analysis**: The discovery system relies on:

1. Webhook firing to mark download complete
2. Download job having `discoveryBatchId` set
3. Scanner checking `isDiscoveryDownload()` during scan

If webhook never fires (Issue 1), the scan runs but can't identify albums as discovery.

**Fix**:

1. Fix webhook URL (Issue 1) - this is the primary fix
2. Add fallback: During scan, also check if album path contains "discovery" in Lidarr metadata
3. Verify library routes filter by `location: "LIBRARY"` consistently

---

## Issue 4: Album Cover 404s Spamming Console

**Root Cause**: [frontend/features/artist/components/AvailableAlbums.tsx](frontend/features/artist/components/AvailableAlbums.tsx) fetches covers for unowned albums. When Cover Art Archive doesn't have them, 404 errors spam the console.

**Fix**:

1. In [backend/src/routes/library.ts](backend/src/routes/library.ts) `/album-cover/:mbid` endpoint - return 204 No Content instead of 404 for missing covers (less noisy)
2. In frontend - catch and silently handle missing covers, show placeholder

---

## Issue 5: Shared Playlists Not Showing Username

**Verification Needed**: The code exists in [frontend/app/playlists/page.tsx](frontend/app/playlists/page.tsx) lines 162-164. Check if backend is returning `user.username` correctly.

**Files to check**:

- [backend/src/routes/playlists.ts](backend/src/routes/playlists.ts) - verify `include: { user: { select: { username: true } } }` is working
- Verify playlists actually have `isOwner: false` when shared

---

## Issue 6: Discovery Playlist Never Appears

**Root Cause**: This is directly caused by Issue 1 (webhook URL). The discovery playlist flow is:

1. Discovery Weekly generates recommendations and starts downloads
2. Lidarr grabs and downloads the albums
3. **Lidarr webhook fires on completion** (BROKEN - wrong URL)
4. `simpleDownloadManager.onDownloadComplete()` marks job complete
5. `discoverWeeklyService.checkBatchCompletion()` checks if all albums done
6. When batch complete, triggers scan with `source: "discover-weekly-completion"`
7. Scan processor calls `discoverWeeklyService.buildFinalPlaylist()`
8. Discovery playlist appears in UI

Since step 3 never happens, the playlist is never built.

**Fix**: 
1. Fix webhook URL (Issue 1) - primary fix
2. Add a manual "Rebuild Discovery Playlist" button in the UI as fallback
3. Add a background job that periodically checks for orphaned discovery batches

---

## Issue 7: Audiobooks/Podcasts Missing Filter/Sort Controls

**Problem**: Library page has sorting, pagination, and shuffle controls but audiobooks and podcasts pages don't match this design.

**Fix**: Add to [frontend/app/audiobooks/page.tsx](frontend/app/audiobooks/page.tsx) and [frontend/app/podcasts/page.tsx](frontend/app/podcasts/page.tsx):

- Sort dropdown (Title A-Z, Author A-Z, Recently Added, etc.)
- Items per page dropdown (25, 50, 100, 250)
- Pagination controls
- "Shuffle" button for audiobooks (shuffle all chapters/books)

Match the styling from [frontend/app/library/page.tsx](frontend/app/library/page.tsx) for visual consistency.

---

## Implementation Order

1. Fix Lidarr webhook URL (critical - blocking all download tracking)
2. Add real-time audiobook progress  
3. Add filter/sort/pagination to audiobooks and podcasts pages
4. Suppress album cover 404 noise
5. Verify shared playlist data flow
6. Test discovery isolation after webhook fix

### To-dos

- [ ] Fix owned artist pages - not showing downloadable albums
- [ ] Change default playback quality to 'original'
- [ ] Create docs/ directory with tracking file, add to gitignore
- [ ] Fix Lidarr webhook URL to include /api prefix and make configurable
- [ ] Add real-time audiobook progress by combining query data with audio context
- [ ] Change album cover endpoint to return 204 instead of 404 for missing covers
- [ ] Debug shared playlist username display
- [ ] Test discovery isolation after webhook fix