# Modified Files for Review

> **Last Updated:** December 16, 2025  
> **Features:** Spotify Import + UI Overhaul (Activity Panel, Carousels, Notifications, Playlist/Mix/Discover Redesign, Settings Page Redesign)

## Overview

This document tracks all files created or modified as part of:

1. **Spotify Import Feature** - Import Spotify playlists, match tracks, download albums
2. **UI Overhaul** - Activity Panel, horizontal carousels, notification system

---

## Backend - New Files

| File                                          | Purpose                                                         |
| --------------------------------------------- | --------------------------------------------------------------- |
| `backend/src/services/notificationService.ts` | Notification CRUD service with convenience methods              |
| `backend/src/services/spotifyImport.ts`       | Spotify playlist import logic, track matching, album resolution |
| `backend/src/services/spotify.ts`             | Spotify API/scraping service (embed data extraction)            |
| `backend/src/routes/notifications.ts`         | Notification & download history API endpoints                   |
| `backend/src/routes/spotify.ts`               | Spotify import API endpoints                                    |
| `backend/src/utils/playlistLogger.ts`         | Debug logger for Spotify import jobs                            |

## Backend - Modified Files

| File                                            | Changes                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `backend/prisma/schema.prisma`                  | Added `Notification` model, `DownloadJob.cleared` field               |
| `backend/src/services/simpleDownloadManager.ts` | Added notification integration, failure deduplication                 |
| `backend/src/services/lidarr.ts`                | Smart `anyReleaseOk` fallback, MusicBrainz fallback for artist lookup |
| `backend/src/services/musicbrainz.ts`           | Recording filtering, scoring system, title normalization              |
| `backend/src/services/spotify.ts`               | Embed scraping improvements, debug logging                            |
| `backend/src/index.ts`                          | Registered notification routes                                        |

---

## Frontend - New Files

| File                                                  | Purpose                                               |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `frontend/components/layout/ActivityPanel.tsx`        | Collapsible 3rd column with tabs, PWA install button  |
| `frontend/components/activity/NotificationsTab.tsx`   | System notifications list                             |
| `frontend/components/activity/ActiveDownloadsTab.tsx` | Currently downloading items                           |
| `frontend/components/activity/HistoryTab.tsx`         | Completed/failed with retry                           |
| `frontend/components/ui/HorizontalCarousel.tsx`       | Reusable carousel with arrows                         |
| `frontend/hooks/useActivityPanel.ts`                  | Panel state management                                |
| `frontend/app/import/spotify/page.tsx`                | Spotify import UI page (preview, selection, progress) |

## Frontend - Modified Files

| File                                                          | Changes                                                |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `frontend/components/layout/AuthenticatedLayout.tsx`          | Added 3rd column, event listener for toggle            |
| `frontend/components/layout/TopBar.tsx`                       | Added `ActivityPanelToggle` button                     |
| `frontend/components/MixCard.tsx`                             | Reduced padding/sizing (`p-4` → `p-2.5`)               |
| `frontend/features/home/components/ArtistsGrid.tsx`           | Uses `HorizontalCarousel`                              |
| `frontend/features/home/components/MixesGrid.tsx`             | Uses `HorizontalCarousel`                              |
| `frontend/features/home/components/ContinueListening.tsx`     | Uses `HorizontalCarousel`                              |
| `frontend/features/home/components/PodcastsGrid.tsx`          | Uses `HorizontalCarousel`                              |
| `frontend/features/home/components/HomeHero.tsx`              | Already optimized (compact greeting)                   |
| `frontend/lib/api.ts`                                         | Added notification API methods, Spotify import methods |
| `frontend/app/playlists/page.tsx`                             | Added "Import from Spotify" button/link                |
| `frontend/app/playlist/[id]/page.tsx`                         | Full Spotify-style redesign (see below)                |
| `frontend/app/mix/[id]/page.tsx`                              | Full Spotify-style redesign (matches playlist page)    |
| `frontend/app/discover/page.tsx`                              | Updated to use consistent container widths             |
| `frontend/features/discover/components/DiscoverHero.tsx`      | Redesigned to match playlist/mix hero style            |
| `frontend/features/discover/components/DiscoverActionBar.tsx` | Redesigned with Lidify yellow play button              |
| `frontend/features/discover/components/TrackList.tsx`         | Redesigned to match playlist/mix track listing         |
| `frontend/components/layout/Sidebar.tsx`                      | Removed unused icon imports                            |

---

## Database Changes

```prisma
// NEW MODEL
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // system, download_complete, playlist_ready, error, import_complete
  title     String
  message   String?
  metadata  Json?    // { playlistId, albumId, artistId, etc. }
  read      Boolean  @default(false)
  cleared   Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, cleared])
  @@index([userId, read])
  @@index([createdAt])
}

// MODIFIED MODEL - DownloadJob
model DownloadJob {
  // ... existing fields ...
  cleared   Boolean @default(false)  // NEW: User dismissed from history
}
```

**Migration Applied:** `npx prisma db push`

---

## API Endpoints

### Notifications (`/api/notifications`)

| Method | Endpoint                             | Description                  |
| ------ | ------------------------------------ | ---------------------------- |
| GET    | `/notifications`                     | List uncleared notifications |
| GET    | `/notifications/unread-count`        | Get unread count             |
| POST   | `/notifications/:id/read`            | Mark as read                 |
| POST   | `/notifications/read-all`            | Mark all as read             |
| POST   | `/notifications/:id/clear`           | Clear (dismiss) notification |
| POST   | `/notifications/clear-all`           | Clear all notifications      |
| GET    | `/notifications/downloads/active`    | Active downloads             |
| GET    | `/notifications/downloads/history`   | Completed/failed downloads   |
| POST   | `/notifications/downloads/:id/clear` | Clear from history           |
| POST   | `/notifications/downloads/clear-all` | Clear all history            |
| POST   | `/notifications/downloads/:id/retry` | Retry failed download        |

### Spotify Import (`/api/spotify`)

| Method | Endpoint                     | Description                      |
| ------ | ---------------------------- | -------------------------------- |
| POST   | `/spotify/import/preview`    | Generate import preview from URL |
| POST   | `/spotify/import/start`      | Start import with selections     |
| GET    | `/spotify/import/:id/status` | Get import job status            |

---

## Key Bug Fixes

### 1. Track Matching (Spotify Import)

-   **File:** `backend/src/services/spotifyImport.ts`
-   **Fix:** Added `stripTrackSuffix()` to remove "- 2011 Remaster" etc. while keeping punctuation
-   **Fix:** Added Unicode normalization for artist names (Röyksopp → Royksopp)
-   **Fix:** Multiple matching strategies (exact → stripped → fuzzy)

### 2. MusicBrainz Album Resolution

-   **File:** `backend/src/services/musicbrainz.ts`
-   **Fix:** Score threshold > 50 for studio albums
-   **Fix:** Recording filtering (exclude live/demo/acoustic)
-   **Fix:** Soundtrack penalty in scoring

### 3. Lidarr Album Addition

-   **File:** `backend/src/services/lidarr.ts`
-   **Fix:** Smart `anyReleaseOk` fallback (try strict first, then loosen)
-   **Fix:** MusicBrainz fallback when Lidarr's metadata server fails
-   **Fix:** Immediate error when no releases found

### 4. Multiple Failure Notifications

-   **File:** `backend/src/services/simpleDownloadManager.ts`
-   **Fix:** 30-second deduplication window for failure events
-   **Fix:** Only notify on final exhaustion, not each retry
-   **Fix:** Skip notifications for discovery/import batches

---

## Testing Checklist

### Activity Panel

-   [ ] Panel opens/closes from TopBar button
-   [ ] Panel state persists in localStorage
-   [ ] Notifications tab shows system messages
-   [ ] Active tab shows downloading items (refreshes every 5s)
-   [ ] History tab shows completed/failed
-   [ ] Retry button works for failed downloads
-   [ ] Clear buttons work

### Home Page Carousels

-   [ ] Horizontal scroll works
-   [ ] Arrow buttons appear on hover (desktop)
-   [ ] Snap behavior works
-   [ ] Card sizing is compact

### Spotify Import

-   [ ] Preview generation works
-   [ ] Album selection works
-   [ ] Downloads start correctly
-   [ ] Track matching works after downloads
-   [ ] Playlist is created with matched tracks
-   [ ] Notification appears when complete

### Notifications

-   [ ] Download complete creates notification
-   [ ] Download failed creates notification (only on exhaustion)
-   [ ] Spotify import complete creates notification
-   [ ] Unread badge shows count
-   [ ] Mark as read works
-   [ ] Clear works

### Playlist Page

-   [ ] Hero section is compact with bottom-aligned content
-   [ ] Shuffle button randomizes and plays tracks
-   [ ] Track listing spans full width (no container)
-   [ ] Currently playing track is highlighted
-   [ ] Track numbers become play icons on hover
-   [ ] Album column hidden on mobile

### PWA Install

-   [ ] "Install App" button appears in Activity Panel (when installable)
-   [ ] Button triggers browser install prompt
-   [ ] Button disappears after installation

---

## Rollback Instructions

If issues arise, revert these files:

```bash
# Core files to revert for UI changes
git checkout HEAD~1 -- frontend/components/layout/AuthenticatedLayout.tsx
git checkout HEAD~1 -- frontend/components/layout/TopBar.tsx
git checkout HEAD~1 -- frontend/components/layout/ActivityPanel.tsx
git checkout HEAD~1 -- frontend/components/activity/

# For Spotify import issues
git checkout HEAD~1 -- backend/src/services/spotifyImport.ts
git checkout HEAD~1 -- backend/src/services/musicbrainz.ts
git checkout HEAD~1 -- backend/src/services/lidarr.ts

# Database rollback (if needed)
# Remove Notification model and DownloadJob.cleared from schema
npx prisma db push
```

---

## Notes

-   The old `DownloadNotifications.tsx` (floating modal) still exists but is no longer imported in the layout
-   All grid components were already converted to carousels prior to this session
-   The Spotify import flow uses `lidarrService.addAlbum()` directly instead of `simpleDownloadManager` to avoid same-artist fallback

## Playlist Page Redesign

**File:** `frontend/app/playlist/[id]/page.tsx`

### Changes Made

1. **Fixed React Hooks Error** - Moved `totalDuration` useMemo before early returns
2. **Full-Width Track Listing** - Removed container wrapper, tracks span full panel width like Spotify
3. **Compact Hero Section** - Smaller cover art (140px/192px), bottom-aligned content, reduced title size
4. **Added Shuffle Button** - Shuffles and plays all tracks in random order
5. **Grid-Based Track Layout** - Columns: #, Title/Artist, Album, Duration (responsive)
6. **Track Hover States** - Number becomes play icon on hover, row highlights

### PWA Install in Activity Panel

**File:** `frontend/components/layout/ActivityPanel.tsx`

-   Added `beforeinstallprompt` event listener
-   "Install App" button appears at bottom of panel when PWA can be installed
-   Hides automatically when app is already installed or running in standalone mode

### Sidebar Cleanup

**File:** `frontend/components/layout/Sidebar.tsx`

-   Removed unused icon imports (Home, Library, Sparkles, Book, Mic2)
-   Navigation items use text-only (no icons) - matching minimalist design

### Playlists Page Redesign

**File:** `frontend/app/playlists/page.tsx`

**Before → After:**

| Element          | Before                            | After                                  |
| ---------------- | --------------------------------- | -------------------------------------- |
| Header title     | `text-3xl md:text-4xl font-black` | `text-2xl font-bold`                   |
| Header padding   | `px-6 md:px-8 py-6 md:py-8`       | `px-6 pt-6 pb-4`                       |
| Gradient overlay | Yellow gradient at top            | Removed                                |
| Import button    | Green outline with icon           | Solid green `bg-[#1DB954]`, no icon    |
| Hidden toggle    | Icon + text, bordered             | Text only, minimal style               |
| Card wrapper     | `<Card>` component                | Simple `<div>` with `hover:bg-white/5` |
| Card padding     | `p-4` (via Card)                  | `p-3`                                  |
| Play button      | `w-12 h-12`                       | `w-10 h-10`                            |
| Empty state      | `<EmptyState>` with icons         | Simple centered div                    |
| Shared badge     | Purple badge                      | Shown in subtitle instead              |
| Track count      | "tracks"                          | "songs" (matches Spotify)              |

**Design Philosophy:**

-   Remove decorative icons where text suffices
-   Reduce spacing for tighter, professional feel
-   Use native hover states instead of custom components
-   Minimal color - let content speak
-   Match Spotify's terminology

---

## Spotify-Style Design Patterns

> **Use these patterns consistently across all pages for a cohesive look.**

### 1. Hero Sections (Albums, Playlists, Artists)

```
- Compact height (max ~180px for cover on desktop)
- Content bottom-aligned to the cover art
- Title: text-2xl md:text-3xl font-bold (NOT text-4xl+)
- Subtitle info: text-sm text-gray-400
- Reduced vertical spacing (gap-2 to gap-4 max)
- No decorative gradients overlaying the hero
```

### 2. Track Listings

```
- Full-width, no container card wrapping
- Grid layout: [#] [Title/Artist] [Album] [Duration]
- Album column: hidden on mobile (md:grid-cols-[16px_1fr_1fr_60px])
- Hover: row bg-white/5, number → play icon
- Playing indicator: Lidify yellow (#ecb200) on track number
- Compact row height (~56px)
```

### 3. Page Headers

```
- Title: text-2xl font-bold (not text-3xl+)
- Subtitle: text-sm text-gray-400
- Actions: rounded-full buttons with minimal icons
- No excessive padding (px-6 py-4 is enough)
```

### 4. Cards (Albums, Artists, Playlists)

```
- Compact padding: p-2.5 (not p-4)
- Title: text-sm font-medium truncate
- Subtitle: text-xs text-gray-500
- Play button: bottom-right, shows on hover
```

### 5. Grids → Carousels

```
- Use HorizontalCarousel for content rows
- Single horizontal line, scroll/swipe
- Arrow buttons on hover (desktop)
- Snap behavior for smooth scrolling
```

### 6. General Typography

```
- Section headers: text-lg font-semibold (not text-xl)
- Greeting (home): text-2xl md:text-3xl font-bold tracking-tight
- No ALL CAPS unless absolutely necessary
- Muted subtitles: text-gray-400 or text-gray-500
```

### 7. Buttons & Actions

```
- Primary action: rounded-full, bg-[#ecb200] text-black
- Secondary: bg-white/10 hover:bg-white/20
- Icon-only buttons: rounded-full p-2
- Minimal icon usage - text labels preferred
```

### 8. Spacing Philosophy

```
- Tight but breathable
- Section gaps: gap-6 (not gap-8 or gap-10)
- Card grids: gap-4
- Hero to content: pt-6 (not pt-10)
```

---

## Post-Implementation Fixes

| Date       | File                                                            | Issue                                                 | Fix                                                                                    |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2025-12-15 | `backend/src/routes/notifications.ts`                           | Wrong import path `../db`                             | Changed to `../utils/db`                                                               |
| 2025-12-15 | `frontend/app/playlist/[id]/page.tsx`                           | React hooks order violation                           | Moved `useMemo` before early returns                                                   |
| 2025-12-15 | `frontend/app/playlist/[id]/page.tsx`                           | `useAuth` not defined                                 | Removed unused `isAuthenticated`                                                       |
| 2025-12-15 | `frontend/components/layout/ActivityPanel.tsx`                  | Badge not clearing after clear all                    | Added `notifications-changed` event listener                                           |
| 2025-12-15 | `frontend/components/activity/NotificationsTab.tsx`             | Badge not updating                                    | Dispatch `notifications-changed` event on mutations                                    |
| 2025-12-15 | `backend/src/services/spotifyImport.ts`                         | Track matching failing (apostrophes, artist matching) | Added `normalizeApostrophes()`, changed artist match to use `contains` with first word |
| 2025-12-15 | `frontend/app/playlists/page.tsx`                               | Page design not matching Spotify style                | Full redesign: compact header, cleaner cards, minimal icons, refined typography        |
| 2025-12-15 | `frontend/app/import/spotify/page.tsx`                          | Using Music2 icon instead of Spotify logo             | Uses SpotIcon.png, cleaner layout, matches style guide, removed heavy Card components  |
| 2025-12-15 | `frontend/app/import/spotify/page.tsx`                          | Grey/transparent gradient not matching brand          | Added yellow-to-purple gradient (same as home page) with quick fade ratio (35vh/25vh)  |
| 2025-12-15 | `frontend/app/discover/page.tsx`                                | Container width inconsistent with hero                | Added `max-w-7xl mx-auto` to track listing section                                     |
| 2025-12-15 | `frontend/app/mix/[id]/page.tsx`                                | Container width inconsistent with hero                | Added `max-w-7xl mx-auto` to track listing section                                     |
| 2025-12-15 | `frontend/app/playlist/[id]/page.tsx`                           | Container width inconsistent with hero                | Added `max-w-7xl mx-auto` to track listing section                                     |
| 2025-12-15 | `frontend/features/discover/components/*`                       | Discover page not matching playlist/mix design        | Redesigned DiscoverHero, DiscoverActionBar, TrackList to match Spotify style           |
| 2025-12-15 | `frontend/app/library/page.tsx`                                 | Container width not matching other pages              | Removed `max-w-7xl mx-auto`, now full-width with `px-4 md:px-8`                        |
| 2025-12-15 | `frontend/features/library/components/LibraryHeader.tsx`        | Container width not matching other pages              | Removed `max-w-7xl mx-auto`, now full-width with `px-4 md:px-8`                        |
| 2025-12-15 | `frontend/app/podcasts/page.tsx`                                | Container width + card styling not matching           | Removed `max-w-7xl mx-auto`, cleaner cards without borders/gradients                   |
| 2025-12-15 | `frontend/app/audiobooks/page.tsx`                              | Container width not matching other pages              | Removed `max-w-7xl mx-auto`, smaller header text, consistent with Spotify style        |
| 2025-12-15 | `frontend/app/artist/[id]/page.tsx`                             | Container width not matching other pages              | Removed `max-w-7xl mx-auto`, now full-width with `px-4 md:px-8`                        |
| 2025-12-15 | `frontend/app/album/[id]/page.tsx`                              | Container width not matching other pages              | Removed `max-w-7xl mx-auto`, now full-width with `px-4 md:px-8`                        |
| 2025-12-15 | `frontend/features/artist/components/ArtistHero.tsx`            | Hero not matching Spotify style                       | Compact hero, full-width, bottom-aligned content, kept VibrantJS gradients             |
| 2025-12-15 | `frontend/features/artist/components/ArtistActionBar.tsx`       | Action bar too heavy                                  | Simplified to play button + shuffle + download, matching playlist style                |
| 2025-12-15 | `frontend/features/artist/components/PopularTracks.tsx`         | Track list not matching new style                     | Removed Card wrapper, grid-based layout, cleaner typography                            |
| 2025-12-15 | `frontend/features/artist/components/Discography.tsx`           | Section header too large                              | Changed header from `text-2xl md:text-3xl` to `text-xl`                                |
| 2025-12-15 | `frontend/features/artist/components/AvailableAlbums.tsx`       | Section headers too large                             | Changed headers to `text-xl font-bold mb-4`, renamed sections                          |
| 2025-12-15 | `frontend/features/artist/components/SimilarArtists.tsx`        | Cards not matching new style                          | Cleaner cards with transparent bg, smaller header                                      |
| 2025-12-15 | `frontend/features/artist/components/ArtistBio.tsx`             | Using Card component                                  | Replaced Card with simple `bg-white/5` div                                             |
| 2025-12-15 | `frontend/features/album/components/AlbumHero.tsx`              | Hero not matching Spotify style                       | Compact hero, full-width, bottom-aligned content, kept VibrantJS gradients             |
| 2025-12-15 | `frontend/features/album/components/AlbumActionBar.tsx`         | Action bar too heavy                                  | Simplified to play + shuffle + add to playlist, matching playlist style                |
| 2025-12-15 | `frontend/features/album/components/SimilarAlbums.tsx`          | Section header too large                              | Changed header to `text-xl font-bold mb-4`                                             |
| 2025-12-15 | `frontend/app/artist/[id]/page.tsx`                             | Artist bio/about not showing                          | Now uses `artist.bio \|\| artist.summary` for library artists with `summary` field     |
| 2025-12-15 | `frontend/features/artist/components/ArtistBio.tsx`             | Read more link not brand color                        | Added `[&_a]:text-[#ecb200]` for Lidify yellow links                                   |
| 2025-12-15 | `frontend/app/audiobooks/[id]/page.tsx`                         | Page design not matching Spotify style                | Compact hero, yellow play button, integrated action bar, full-width layout             |
| 2025-12-15 | `frontend/features/audiobook/components/AudiobookHero.tsx`      | Hero too large and dated                              | Compact Spotify-style hero with bottom-aligned content, VibrantJS gradients preserved  |
| 2025-12-15 | `frontend/features/audiobook/components/AudiobookActionBar.tsx` | Action bar not matching other pages                   | Yellow play button, inline progress, subtle action icons                               |
| 2025-12-15 | `frontend/app/podcasts/[id]/page.tsx`                           | Page design not matching Spotify style                | Compact hero, fixed height gradient (25vh), full-width layout                          |
| 2025-12-15 | `frontend/features/podcast/components/PodcastHero.tsx`          | Hero too large and dated                              | Compact Spotify-style hero with bottom-aligned content, VibrantJS gradients preserved  |
| 2025-12-15 | `frontend/features/podcast/components/PodcastActionBar.tsx`     | Action bar too heavy                                  | Yellow subscribe button, subtle RSS link, cleaner remove confirmation                  |
| 2025-12-15 | `frontend/features/podcast/components/ContinueListening.tsx`    | Cards not matching new style                          | Yellow play button, cleaner progress bar, simpler prev/next episodes                   |
| 2025-12-15 | `frontend/features/podcast/components/EpisodeList.tsx`          | Episode list not matching new style                   | Removed Card wrapper, yellow highlights, cleaner typography                            |
| 2025-12-15 | `frontend/features/podcast/components/SimilarPodcasts.tsx`      | Cards not matching new style                          | Transparent bg with hover, smaller header, cleaner layout                              |
| 2025-12-15 | `frontend/features/podcast/components/PreviewEpisodes.tsx`      | Cards not matching new style                          | Removed Card wrappers, yellow subscribe button, cleaner About section                  |

---

## Settings Page Redesign (December 16, 2025)

### Overview

Complete redesign of the settings page to match Spotify's clean, minimal aesthetic with:

-   **Sidebar navigation** - Fixed sidebar with section links, active state tracking via intersection observer
-   **Single scrollable page** - All sections on one page instead of tabs
-   **Unified Spotify section** - Combined OAuth user connection + Developer API credentials
-   **Spotify-style design patterns** - Row-based layouts, clean toggles, minimal borders

### Database Changes

```prisma
model User {
  // ... existing fields ...

  // NEW: Spotify OAuth connection
  spotifyAccessToken   String?   // Encrypted OAuth access token
  spotifyRefreshToken  String?   // Encrypted OAuth refresh token
  spotifyTokenExpiry   DateTime? // When access token expires
  spotifyUserId        String?   // Spotify user ID
  spotifyDisplayName   String?   // Display name from Spotify
}
```

### New API Endpoints

| Method | Endpoint                       | Description                         |
| ------ | ------------------------------ | ----------------------------------- |
| GET    | `/api/spotify/auth/url`        | Generate OAuth authorization URL    |
| GET    | `/api/spotify/auth/callback`   | Handle OAuth callback, store tokens |
| POST   | `/api/spotify/auth/disconnect` | Remove user's Spotify connection    |
| GET    | `/api/spotify/auth/status`     | Check if user is connected          |

### New Frontend Files

| File                                                                          | Purpose                                 |
| ----------------------------------------------------------------------------- | --------------------------------------- |
| `frontend/features/settings/components/ui/SettingsLayout.tsx`                 | Sidebar + main content wrapper          |
| `frontend/features/settings/components/ui/SettingsSidebar.tsx`                | Navigation sidebar with section links   |
| `frontend/features/settings/components/ui/SettingsSection.tsx`                | Section header with separator           |
| `frontend/features/settings/components/ui/SettingsRow.tsx`                    | Label + description left, control right |
| `frontend/features/settings/components/ui/SettingsToggle.tsx`                 | Spotify-style toggle switch             |
| `frontend/features/settings/components/ui/SettingsSelect.tsx`                 | Dropdown select                         |
| `frontend/features/settings/components/ui/SettingsInput.tsx`                  | Text/password input with show/hide      |
| `frontend/features/settings/components/ui/ConnectionCard.tsx`                 | OAuth connection card (Spotify)         |
| `frontend/features/settings/components/ui/index.ts`                           | Barrel export                           |
| `frontend/features/settings/components/sections/AccountSection.tsx`           | Password change + 2FA                   |
| `frontend/features/settings/components/sections/PlaybackSection.tsx`          | Streaming quality dropdown              |
| `frontend/features/settings/components/sections/SpotifyConnectionSection.tsx` | Spotify OAuth connection                |
| `frontend/features/settings/components/sections/SpotifyAPISection.tsx`        | Developer API credentials               |
| `frontend/features/settings/components/sections/CacheSection.tsx`             | Cache sizes + automation toggles        |
| `frontend/features/settings/hooks/useSpotifyOAuth.ts`                         | OAuth state management                  |

### Modified Frontend Files

| File                                                                       | Changes                               |
| -------------------------------------------------------------------------- | ------------------------------------- |
| `frontend/app/settings/page.tsx`                                           | Complete redesign with sidebar layout |
| `frontend/features/settings/components/sections/LidarrSection.tsx`         | Spotify-style row layout              |
| `frontend/features/settings/components/sections/AudiobookshelfSection.tsx` | Spotify-style row layout              |
| `frontend/features/settings/components/sections/SoulseekSection.tsx`       | Spotify-style row layout              |
| `frontend/features/settings/components/sections/AIServicesSection.tsx`     | Spotify-style row layout              |
| `frontend/features/settings/components/sections/StoragePathsSection.tsx`   | Spotify-style row layout              |
| `frontend/features/settings/components/sections/UserManagementSection.tsx` | Cleaner design, modal for delete      |

### Modified Backend Files

| File                            | Changes                                  |
| ------------------------------- | ---------------------------------------- |
| `backend/prisma/schema.prisma`  | Added Spotify OAuth fields to User model |
| `backend/src/routes/spotify.ts` | Added OAuth routes                       |

### Deleted Files (Consolidated)

| File                                                                         | Reason                            |
| ---------------------------------------------------------------------------- | --------------------------------- |
| `frontend/features/settings/components/UserSettingsTab.tsx`                  | Replaced by unified settings page |
| `frontend/features/settings/components/AccountTab.tsx`                       | Replaced by unified settings page |
| `frontend/features/settings/components/SystemSettingsTab.tsx`                | Replaced by unified settings page |
| `frontend/features/settings/components/sections/ChangePasswordSection.tsx`   | Merged into AccountSection        |
| `frontend/features/settings/components/sections/TwoFactorAuthSection.tsx`    | Merged into AccountSection        |
| `frontend/features/settings/components/sections/PlaybackQualitySection.tsx`  | Replaced by PlaybackSection       |
| `frontend/features/settings/components/sections/AdvancedSettingsSection.tsx` | Replaced by CacheSection          |
| `frontend/features/settings/components/sections/CacheSettingsSection.tsx`    | Replaced by CacheSection          |
| `frontend/features/settings/components/sections/SpotifySection.tsx`          | Split into Connection + API       |

### Settings Sections

**All Users:** Account, Playback, Connected Services (Spotify OAuth)

**Admin Only:** Download Services, Media Servers, P2P Networks, AI Services, Spotify API, Storage, Cache & Automation, User Management

---

## Home Page Enhancements (Dec 16, 2025)

### New Features

1. **Radio Stations Section** - Compact horizontal row at the top of the home page showing random Deezer radio stations
2. **Featured Playlists Section** - Grid showing 10 featured Deezer playlists after Popular Artists section

### New Files Created

| File                                                   | Purpose                                     |
| ------------------------------------------------------ | ------------------------------------------- |
| `frontend/features/home/components/FeaturedPlaylistsGrid.tsx` | Grid component for featured playlists       |
| `frontend/features/home/components/RadioStationsGrid.tsx`     | Horizontal scroll component for radio stations |

### Modified Files

| File                                                 | Changes                                          |
| ---------------------------------------------------- | ------------------------------------------------ |
| `frontend/app/page.tsx`                              | Added radio stations and featured playlists sections |
| `frontend/features/home/hooks/useHomeData.ts`        | Added browse data fetching for playlists/radios  |
| `frontend/hooks/useQueries.ts`                       | Added browse query keys and hooks               |
| `backend/src/routes/browse.ts`                       | Increased featured playlists limit from 50 to 200 |

---

## Notification & Sync Button Improvements (Dec 16, 2025)

### Changes

1. **Sync Button** - No longer shows toast overlay, turns green with spinning animation while syncing
2. **Optimistic Notification Clearing** - Notifications are cleared from UI immediately before API call completes
3. **Duplicate Key Fix** - Added context parameter to renderCard in browse page to prevent duplicate key errors

### Modified Files

| File                                                     | Changes                                          |
| -------------------------------------------------------- | ------------------------------------------------ |
| `frontend/components/layout/Sidebar.tsx`                 | Removed toast, added green color while syncing   |
| `frontend/components/activity/NotificationsTab.tsx`      | Implemented optimistic updates for all mutations |
| `frontend/app/browse/playlists/page.tsx`                 | Fixed duplicate key errors with unique keys      |

---

## Essentia Audio Analysis Integration (Dec 16, 2025)

### Overview

Integrated Essentia audio analysis to extract BPM, key, mood, energy, and other audio features from tracks. This enables intelligent mood-based mixes and personalized playlists.

### Database Changes

Added to `Track` model in `backend/prisma/schema.prisma`:

| Field              | Type       | Description                           |
| ------------------ | ---------- | ------------------------------------- |
| `bpm`              | Float?     | Beats per minute                      |
| `beatsCount`       | Int?       | Total beats in track                  |
| `key`              | String?    | Musical key (C, F#, Bb, etc.)         |
| `keyScale`         | String?    | "major" or "minor"                    |
| `keyStrength`      | Float?     | Key detection confidence (0-1)        |
| `energy`           | Float?     | Overall energy (0-1)                  |
| `loudness`         | Float?     | Average loudness in dB                |
| `dynamicRange`     | Float?     | Dynamic range in dB                   |
| `danceability`     | Float?     | Danceability score (0-1)              |
| `valence`          | Float?     | Happy (1) to sad (0)                  |
| `arousal`          | Float?     | Energetic (1) to calm (0)             |
| `instrumentalness` | Float?     | Vocal presence (0-1, 1=instrumental)  |
| `acousticness`     | Float?     | Acoustic vs electronic (0-1)          |
| `speechiness`      | Float?     | Spoken word content (0-1)             |
| `moodTags`         | String[]   | ML-classified mood tags               |
| `essentiaGenres`   | String[]   | ML-classified genres                  |
| `lastfmTags`       | String[]   | User-generated mood tags from Last.fm |
| `analysisStatus`   | String     | pending/processing/completed/failed   |
| `analysisVersion`  | String?    | Essentia version used                 |
| `analyzedAt`       | DateTime?  | When analysis was completed           |
| `analysisError`    | String?    | Error message if failed               |

### New Files

| File                                              | Description                                        |
| ------------------------------------------------- | -------------------------------------------------- |
| `services/audio-analyzer/Dockerfile`              | Python 3.11 + Essentia container                   |
| `services/audio-analyzer/analyzer.py`             | Main audio analysis service                        |
| `services/audio-analyzer/requirements.txt`        | Python dependencies                                |
| `backend/src/workers/trackEnrichment.ts`          | Last.fm tag enrichment worker                      |
| `backend/src/routes/analysis.ts`                  | API routes for analysis status & triggers          |

### Modified Files

| File                                                           | Changes                                         |
| -------------------------------------------------------------- | ----------------------------------------------- |
| `backend/prisma/schema.prisma`                                 | Added audio analysis fields to Track model      |
| `backend/src/workers/index.ts`                                 | Added track enrichment worker startup/shutdown  |
| `backend/src/workers/queues.ts`                                | Added `analysisQueue` for audio analysis jobs   |
| `backend/src/index.ts`                                         | Registered `/api/analysis` routes               |
| `backend/src/services/programmaticPlaylists.ts`                | Added mood-based mix generators                 |
| `backend/src/routes/library.ts`                                | Added mood-based radio station filtering        |
| `frontend/features/home/components/LibraryRadioStations.tsx`   | Added mood-based radio station buttons          |
| `docker-compose.yml`                                           | Added `audio-analyzer` service (optional)       |

### New Mix Types (Audio Analysis-Based)

| Mix Type       | Criteria                                      |
| -------------- | --------------------------------------------- |
| High Energy    | energy >= 0.7, BPM >= 120                     |
| Late Night     | energy <= 0.4, BPM <= 90, low arousal         |
| Happy Vibes    | valence >= 0.6, energy >= 0.5                 |
| Melancholy     | valence <= 0.4, minor key preferred           |
| Dance Floor    | danceability >= 0.7, BPM 110-140              |
| Acoustic       | acousticness >= 0.6, energy 0.3-0.6           |
| Instrumental   | instrumentalness >= 0.7, energy 0.3-0.6       |
| Road Trip      | tags or energy 0.5-0.8, BPM 100-130           |
| Sunday Morning | low energy, high acousticness (day-specific)  |
| Monday Motivation | high energy, high valence (day-specific)   |
| Friday Night   | high danceability, high energy (day-specific) |

### API Endpoints

| Method | Endpoint                      | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/api/analysis/status`        | Get analysis progress statistics         |
| POST   | `/api/analysis/start`         | Queue pending tracks for analysis        |
| POST   | `/api/analysis/retry-failed`  | Reset failed tracks to pending           |
| POST   | `/api/analysis/analyze/:id`   | Queue specific track for analysis        |
| GET    | `/api/analysis/track/:id`     | Get analysis data for specific track     |
| GET    | `/api/analysis/features`      | Get aggregated feature statistics        |

### Starting the Audio Analyzer

The audio analyzer is disabled by default. To enable it:

```bash
docker-compose --profile audio-analysis up -d
```

Or just run it separately:

```bash
docker-compose up audio-analyzer -d
```

---

## Notification System Fixes (Dec 16, 2025)

### Issues Fixed

1. **Toast overlays for cache clearing and sync** - Removed toast.success overlays for "Caches cleared" and "Library scan started" since these should appear in the activity panel notification bar instead.

2. **Notification badge not clearing immediately** - The `useNotifications` hook wasn't responding to `notifications-changed` events. Fixed by adding an event listener that triggers a refetch.

3. **Settings page glitchy sidebar** - Replaced IntersectionObserver with scroll-based tracking for smoother sidebar highlighting.

### Modified Files

| File | Change |
|------|--------|
| `frontend/hooks/useNotifications.ts` | Added event listener for `notifications-changed` to trigger immediate refetch |
| `frontend/features/settings/components/sections/CacheSection.tsx` | Removed toast.success for cache clearing and sync, added local error state |
| `frontend/components/layout/TopBar.tsx` | Removed toast.success for library scan started |
| `frontend/components/layout/Sidebar.tsx` | Added `notifications-changed` event dispatch after sync |
| `frontend/features/settings/components/ui/SettingsLayout.tsx` | Replaced IntersectionObserver with throttled scroll listener for smoother sidebar tracking |

### Behavior Changes

- **Sync button**: No longer shows toast overlay - progress appears in activity panel
- **Clear caches button**: No longer shows toast overlay - implicit success (button returns to normal state)
- **Notification badge**: Now clears immediately via optimistic updates and event system
- **Settings sidebar**: Smoother scrolling behavior without jumpy highlights

---

## Session 8: Artist Radio Feature

### New Feature: Artist Radio with Hybrid Similarity Matching

| File | Change |
|------|--------|
| `backend/src/routes/library.ts` | Added `artist` case to `/library/radio` endpoint with hybrid matching |
| `backend/src/routes/library.ts` | Added artist name filtering to `/library/genres` endpoint |
| `frontend/features/artist/components/ArtistActionBar.tsx` | Added Radio icon button for library artists |
| `frontend/app/artist/[id]/page.tsx` | Added `handleStartRadio` function and passed to ArtistActionBar |
| `frontend/lib/api.ts` | Added `getRadioTracks()` method |

### Artist Radio Logic

The artist radio uses a **hybrid approach** with vibe boosting:

1. **Last.fm Similar Artists (filtered to library)**: Primary source, gets up to 15 similar artists that exist in user's library
2. **Genre Matching Fallback**: If < 5 similar artists, finds library artists with overlapping genres
3. **Vibe Boost via Audio Analysis**: Scores similar artists' tracks by BPM, energy, valence, and danceability similarity
4. **Track Mix**: ~40% from original artist, ~60% from vibe-matched similar artists

### Genre Filtering Fix

Artist names (like "Jamiroquai") were incorrectly showing as genres. Fixed by:
- Fetching all artist names at query time
- Filtering out any "genre" that matches an artist name (case-insensitive)

### Bug Fix: Artist Radio "Unknown Artist" / No Image

Fixed two issues with artist radio playback:
1. **Frontend**: Removed double-transformation of tracks - backend already returns properly formatted data
2. **Backend**: Fixed `coverArt` to use `track.album.coverUrl` directly instead of conditional `lidarrAlbumId` check

---

## Session 9: Vibe Match Feature

### New Feature: "Vibe Match" Button on Media Player

Allows users to instantly create a queue of tracks that sound like the currently playing track.

| File | Change |
|------|--------|
| `backend/src/routes/library.ts` | Added `vibe` case to `/library/radio` endpoint with audio feature matching |
| `frontend/components/player/MiniPlayer.tsx` | Added Vibe button (AudioWaveform icon) with loading state |
| `frontend/components/player/FullPlayer.tsx` | Added Vibe button (AudioWaveform icon) with loading state |

### How Vibe Match Works

1. **Takes current track's audio features** (BPM, energy, valence, danceability, key, mood tags)
2. **Searches entire library** for tracks with similar audio profiles
3. **Scores matches** using weighted algorithm:
   - BPM (25%) - within ±15 BPM is ideal
   - Energy (25%)
   - Valence/mood (20%)
   - Danceability (15%)
   - Key compatibility (10%)
   - Mood tag overlap (5%)
4. **Falls back gracefully** if not enough audio matches:
   - Same artist's other tracks
   - Last.fm similar artists' tracks
   - Same genre tracks
   - Random library tracks

### UI Location

The Vibe button (waveform icon) appears after the Repeat button in both:
- MiniPlayer (sidebar player)
- FullPlayer (bottom bar player)

Clicking it replaces the current queue with vibe-matched tracks and shows a toast notification.

---

## Session 9 (continued): Search Tracks Fix

### Bug Fix: Library Tracks Not Showing in Search

The backend was returning tracks in search results, but the frontend never displayed them.

| File | Change |
|------|--------|
| `frontend/app/search/page.tsx` | Added import for `LibraryTracksList` and section to display library tracks |
| `frontend/features/search/components/LibraryTracksList.tsx` | **New file** - Component to display library tracks in search results |

### Features of LibraryTracksList

- Shows up to 10 tracks matching the search query
- Displays cover art, title, artist, album, and duration
- Click to play (integrates with audio context)
- Currently playing track highlighted in yellow
- Artist and album names link to their respective pages
