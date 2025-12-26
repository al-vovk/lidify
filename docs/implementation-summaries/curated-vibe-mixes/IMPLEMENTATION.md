# Curated Vibe Mixes Implementation

## Overview

This update adds **19 new curated vibe mixes** and a **Mood-on-Demand** feature that allows users to generate custom mixes based on audio features.

## Bug Fix

Fixed the `genres` field bug - the Album model uses `genres` (JSON array) not `genre` (string). Added a helper function `findTracksByGenrePatterns()` that properly queries:
1. Track's `lastfmTags` and `essentiaGenres` (native String[] fields)
2. Falls back to filtering `album.genres` JSON array in application code

## New Daily Vibe Mixes (10 tracks each)

| Mix Name | Description | Key Audio Features |
|----------|-------------|-------------------|
| **Sad Girl Sundays** | Melancholic introspection | valence < 0.35, minor key, arousal < 0.4 |
| **Main Character Energy** | You're the protagonist ✨ | valence > 0.55, energy > 0.55, danceability > 0.5 |
| **Villain Era** | Dark & empowering 😈 | minor key, energy > 0.65, aggressive tags |
| **3AM Thoughts** | Late night overthinking 🌙 | arousal < 0.35, energy < 0.45, valence < 0.45 |
| **Hot Girl Walk** | Confident cardio 💅 | danceability > 0.65, BPM 95-135, energy > 0.55 |
| **Rage Cleaning** | Aggressive productivity 🔥 | energy > 0.75, arousal > 0.65, BPM > 125 |
| **Golden Hour** | Warm sunset vibes 🌅 | valence > 0.45, acousticness > 0.35, energy 0.25-0.65 |
| **Shower Karaoke** | Belters you can't help sing 🚿 | instrumentalness < 0.35, energy > 0.55, valence > 0.45 |
| **In My Feelings** | Let it all out 💔 | valence < 0.4, arousal < 0.55, acousticness > 0.25 |
| **Midnight Drive** | Late night cruising 🚗 | energy 0.35-0.65, arousal 0.25-0.55, BPM 85-125 |
| **Coffee Shop Vibes** | Cozy background ☕ | acousticness > 0.4, energy 0.15-0.55 |
| **Romanticize Your Life** | Aesthetic moments 🎬 | valence 0.35-0.75, arousal 0.25-0.65, acousticness > 0.25 |
| **That Girl Era** | Self-improvement mode 💪 | valence > 0.55, energy > 0.45, danceability > 0.45 |
| **Unhinged** | Embrace the chaos 🎪 | Extreme features (high or low everything) |

## New Weekly Curated Mixes (20 tracks each)

| Mix Name | Description | Algorithm |
|----------|-------------|-----------|
| **Deep Cuts** | Hidden gems 💎 | Tracks with zero or few plays |
| **Key Journey** | Harmonic progression 🎹 | Ordered by circle of fifths |
| **Tempo Flow** | Energy arc 📈 | slow → fast → slow BPM journey |
| **Vocal Detox** | Instrumental escape 🧘 | instrumentalness > 0.75 |
| **Minor Key Mondays** | All minor key bangers 🖤 | keyScale = 'minor', energy > 0.45 |

## Mood-on-Demand Feature

### Backend Endpoints

- `POST /api/mixes/mood` - Generate a custom mix based on audio parameters
- `GET /api/mixes/mood/presets` - Get available mood presets for the UI

### Preset Moods (12 total)

1. 😊 Happy & Upbeat
2. 😢 Melancholic
3. 😌 Chill & Relaxed
4. ⚡ High Energy
5. 🎯 Focus Mode
6. 💃 Dance Party
7. 🎸 Acoustic Vibes
8. 🖤 Dark & Moody
9. 💕 Romantic
10. 💪 Workout Beast
11. 😴 Sleep & Unwind
12. 👑 Confidence Boost

### Custom Mix Builder

Users can adjust sliders for:
- Happiness (valence)
- Energy
- Danceability
- Tempo (BPM)

## Frontend Changes

### New Component: `MoodMixer.tsx`

A beautiful Spotify-esque modal with:
- Gradient preset cards with emojis
- Smooth animations (Framer Motion)
- Custom range slider controls
- Dark theme matching the app aesthetic

### Homepage Integration

Added "Mood Mixer" button next to the "Refresh" button in the "Made For You" section.

## Files Modified

### Backend
- `backend/src/services/programmaticPlaylists.ts` - Added helper function, fixed 12 genre bugs, added 19 new mix generators
- `backend/src/routes/mixes.ts` - Added mood endpoints and presets

### Frontend
- `frontend/lib/api.ts` - Added types and API methods for mood mixing
- `frontend/app/page.tsx` - Integrated MoodMixer modal
- `frontend/components/MoodMixer.tsx` - New component (created)

## Technical Notes

- All mixes use Essentia audio analysis data (valence, energy, danceability, BPM, key, etc.)
- Fallback to Last.fm tags when audio analysis is insufficient
- Daily mixes: 10 tracks, refreshed daily
- Weekly mixes: 20 tracks, for longer listening sessions
- Mix generation is cached in Redis for performance




