# Lidify Testing Checklist

Use this checklist when testing Lidify before releases or after major changes.

## ✅ Automated Pre-Deploy Smoke Test (Recommended)

This repo includes a one-command smoke test that covers the **core** flows (API + UI). It intentionally skips “hard” items like lock-screen media controls, background playback on real devices, etc.

### Run (one command)

```bash
./scripts/predeploy-test.sh
```

### Notes

-   **Requires music in `MUSIC_PATH`** (or `./music`) with at least one track, otherwise playback/playlist-related checks will fail.
-   **Environment overrides** (optional):
    -   `LIDIFY_UI_BASE_URL` (default `http://127.0.0.1:3030`)
    -   `LIDIFY_API_BASE_URL` (default `http://127.0.0.1:3006`)
    -   `LIDIFY_TEST_USERNAME` / `LIDIFY_TEST_PASSWORD`
    -   `LIDIFY_TEARDOWN=0` to keep containers running after the script finishes

## 🎵 Audio Playback

### Music (Tracks)

-   [ ] Play a track from an album
-   [ ] Play/pause toggle works
-   [ ] Seeking works (drag the progress bar)
-   [ ] Fast forward (10s) works
-   [ ] Rewind (10s) works
-   [ ] Next track works
-   [ ] Previous track works
-   [ ] Volume slider works
-   [ ] Mute toggle works
-   [ ] Shuffle toggle works (plays random order)
-   [ ] Repeat modes work (off, repeat all, repeat one)
-   [ ] Queue displays correctly
-   [ ] Removing tracks from queue works

### Podcasts

-   [ ] Play a podcast episode
-   [ ] Seeking works (when cached)
-   [ ] Progress saves when pausing
-   [ ] Progress resumes on different device/browser
-   [ ] Can seek far ahead after episode is fully cached/downloaded
-   [ ] Subscribing to a new podcast works
-   [ ] Unsubscribing from a podcast works
-   [ ] Episode list loads correctly

### Audiobooks

-   [ ] Play an audiobook (requires Audiobookshelf integration)
-   [ ] Progress saves automatically
-   [ ] Can resume from saved position
-   [ ] Reset progress works
-   [ ] Mark as complete works

### Cross-Device Sync

-   [ ] Start playing on desktop, resume on mobile (or vice versa)
-   [ ] Queue syncs between devices

---

## 🔍 Discovery & Search

### Deezer Previews

-   [ ] Preview button appears on unowned albums
-   [ ] Preview button appears on artist discovery pages
-   [ ] Preview plays 30-second clip
-   [ ] Preview stops when full track starts

### Search

-   [ ] Library search finds artists
-   [ ] Library search finds albums
-   [ ] Library search finds tracks
-   [ ] Discovery search finds external artists
-   [ ] Discovery search finds podcasts

---

## 📥 Downloads & Integration

### Lidarr Integration

-   [ ] Download entire artist works
-   [ ] Download individual album works
-   [ ] Download status updates in real-time
-   [ ] Webhook triggers library rescan after import

### Soularr (Soulseek)

-   [ ] Search returns results
-   [ ] Download from Soulseek works
-   [ ] Downloaded files appear in library after scan

---

## 📚 Library Management

### Discover Weekly

-   [ ] Generate Discover Weekly works
-   [ ] Playlist populates with recommendations
-   [ ] Can like/dislike albums
-   [ ] Liked albums move to permanent collection

### Playlists

-   [ ] Create new playlist works
-   [ ] Add track to playlist works
-   [ ] Remove track from playlist works
-   [ ] Delete playlist works
-   [ ] Reorder tracks (drag and drop) works

---

## 🔐 Authentication & Users

### Two-Factor Authentication

-   [ ] Enable 2FA works
-   [ ] Login with 2FA code works
-   [ ] Recovery codes work
-   [ ] Disable 2FA works

### User Management

-   [ ] Create new user works (admin only)
-   [ ] User can log in
-   [ ] User has separate playlists/history
-   [ ] Delete user works (admin only)

---

## 🎨 Metadata & Enrichment

### Artist Enrichment

-   [ ] Manual enrichment button works
-   [ ] Artist bio populates
-   [ ] Artist genres populate
-   [ ] Hero image/background loads
-   [ ] Album art loads correctly

---

## 📱 PWA / Mobile

### Installation

-   [ ] PWA install prompt appears on mobile browsers
-   [ ] Can install to home screen (Android Chrome)
-   [ ] Can add to home screen (iOS Safari)

### PWA Features

-   [ ] Installed PWA opens in standalone mode
-   [ ] Media Session controls show in notification/lock screen
-   [ ] Background audio continues when screen is off
-   [ ] Audio continues when switching tabs

---

## 🖥️ UI/UX

### General

-   [ ] Login page loads correctly
-   [ ] Onboarding flow works for new users
-   [ ] Navigation between pages works
-   [ ] Dark theme renders correctly
-   [ ] Mobile responsive layout works

### Player

-   [ ] Mini player shows on mobile
-   [ ] Full player expands correctly
-   [ ] Album art displays
-   [ ] Artist/track info displays

---

## 🐳 Docker

### All-in-One Container

-   [ ] Container starts without errors
-   [ ] Web UI accessible on port 3030
-   [ ] API proxying works (rewrites to backend)
-   [ ] Database persists on restart
-   [ ] Library scan works

---

## Notes

**Test Environment:**

-   Browser:
-   OS:
-   Lidify Version:
-   Date:

**Issues Found:**

-
