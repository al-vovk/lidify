# Lidify Vibe System Documentation

This document provides comprehensive documentation of the Vibe System - how Lidify analyzes tracks, collects audio metrics, and compares them for vibe matching. Use this as a reference for building frontend interfaces.

---

## Table of Contents

1. [Overview](#overview)
2. [Metrics Collected](#metrics-collected)
3. [Data Structures](#data-structures)
4. [Vibe Matching Algorithm](#vibe-matching-algorithm)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration Guide](#frontend-integration-guide)
7. [Existing Components Reference](#existing-components-reference)

---

## Overview

The Vibe System uses a combination of **audio signal analysis** and **ML-based mood prediction** to understand the "feel" of a track. It operates in two modes:

| Mode | Description | Accuracy |
|------|-------------|----------|
| **Standard** | Heuristic-based analysis using audio signal features (BPM, key, energy) | Good |
| **Enhanced** | ML-based analysis using MusiCNN neural network for mood prediction | Best |

The system enables:
- Finding tracks with similar vibes to a source track
- Generating mood-based playlists
- Visualizing track characteristics in real-time

---

## Metrics Collected

### Core Audio Features (Always Available)

These are extracted directly from audio signal analysis at 44.1kHz:

| Metric | Type | Range | Description |
|--------|------|-------|-------------|
| `bpm` | Float | 60-200 | Tempo in beats per minute |
| `beatsCount` | Int | 0+ | Total number of beats detected |
| `key` | String | "C", "F#", etc. | Musical key |
| `keyScale` | String | "major" \| "minor" | Major or minor tonality |
| `keyStrength` | Float | 0-1 | Confidence of key detection |
| `energy` | Float | 0-1 | RMS-based intensity level |
| `loudness` | Float | dB | Average loudness |
| `dynamicRange` | Float | dB | Difference between quietest and loudest |
| `danceability` | Float | 0-1 | Rhythm regularity and groove potential |

### ML Mood Predictions (Enhanced Mode)

Seven core mood dimensions predicted by the MusiCNN model:

| Metric | Type | Range | Description | Icon Suggestion |
|--------|------|-------|-------------|-----------------|
| `moodHappy` | Float | 0-1 | Happiness/cheerfulness probability | Smile |
| `moodSad` | Float | 0-1 | Sadness/melancholy probability | Frown |
| `moodRelaxed` | Float | 0-1 | Calm/peaceful probability | Coffee |
| `moodAggressive` | Float | 0-1 | Intensity/aggression probability | Flame |
| `moodParty` | Float | 0-1 | Upbeat/party probability | PartyPopper |
| `moodAcoustic` | Float | 0-1 | Acoustic instrumentation probability | Guitar |
| `moodElectronic` | Float | 0-1 | Electronic/synthetic probability | Radio |

### Derived Features (Computed)

These are calculated from the ML predictions:

#### Valence (Emotional Positivity)

```typescript
// Formula:
valence = (
    moodHappy * 0.5 +           // Happy mood (50% weight)
    moodParty * 0.3 +           // Party mood (30% weight)
    (1 - moodSad) * 0.2         // Inverse of sadness (20% weight)
)
```

| Value | Interpretation |
|-------|----------------|
| 0.0 - 0.3 | Melancholic, sad |
| 0.3 - 0.6 | Neutral, balanced |
| 0.6 - 1.0 | Happy, positive |

#### Arousal (Energy/Excitement Level)

```typescript
// Formula:
arousal = (
    moodAggressive * 0.35 +     // Aggressive mood (35% weight)
    moodParty * 0.25 +          // Party mood (25% weight)
    moodElectronic * 0.2 +      // Electronic sound (20% weight)
    (1 - moodRelaxed) * 0.1 +   // Inverse of relaxation (10% weight)
    (1 - moodAcoustic) * 0.1    // Inverse of acoustic (10% weight)
)
```

| Value | Interpretation |
|-------|----------------|
| 0.0 - 0.3 | Calm, peaceful |
| 0.3 - 0.6 | Moderate energy |
| 0.6 - 1.0 | High energy, intense |

### Additional Features

| Metric | Type | Range | Description |
|--------|------|-------|-------------|
| `instrumentalness` | Float | 0-1 | Voice presence (0=vocal, 1=instrumental) |
| `acousticness` | Float | 0-1 | Acoustic vs. processed sound |
| `speechiness` | Float | 0-1 | Spoken word detection |
| `danceabilityMl` | Float | 0-1 | ML-based danceability (more accurate) |

### Metadata & Tags

| Field | Type | Description |
|-------|------|-------------|
| `moodTags` | String[] | Derived mood labels (e.g., ["chill", "happy"]) |
| `essentiaGenres` | String[] | ML-predicted genres (e.g., ["rock", "electronic"]) |
| `lastfmTags` | String[] | User-generated tags from Last.fm |
| `analysisStatus` | String | "pending" \| "processing" \| "completed" \| "failed" |
| `analysisMode` | String | "standard" \| "enhanced" |
| `analyzedAt` | DateTime | When analysis was performed |

---

## Data Structures

### TypeScript Interface

```typescript
interface AudioFeatures {
    // Core audio features
    bpm?: number | null;
    beatsCount?: number | null;
    key?: string | null;
    keyScale?: string | null;
    keyStrength?: number | null;
    energy?: number | null;
    loudness?: number | null;
    dynamicRange?: number | null;
    danceability?: number | null;

    // Derived features
    valence?: number | null;
    arousal?: number | null;

    // Additional features
    instrumentalness?: number | null;
    acousticness?: number | null;
    speechiness?: number | null;
    danceabilityMl?: number | null;

    // ML Mood predictions (Enhanced mode)
    moodHappy?: number | null;
    moodSad?: number | null;
    moodRelaxed?: number | null;
    moodAggressive?: number | null;
    moodParty?: number | null;
    moodAcoustic?: number | null;
    moodElectronic?: number | null;

    // Metadata
    analysisStatus?: string | null;
    analysisMode?: string | null;
    analyzedAt?: string | null;

    // Tags
    moodTags?: string[];
    essentiaGenres?: string[];
    lastfmTags?: string[];
}
```

### Feature Display Configuration

Recommended configuration for displaying features in UI:

```typescript
const FEATURE_CONFIG = [
    {
        key: "energy",
        label: "Energy",
        icon: "Zap",           // lucide-react icon
        min: 0,
        max: 1,
        lowLabel: "Calm",
        highLabel: "Intense",
    },
    {
        key: "valence",
        label: "Mood",
        icon: "Heart",
        min: 0,
        max: 1,
        lowLabel: "Melancholic",
        highLabel: "Happy",
    },
    {
        key: "danceability",
        label: "Groove",
        icon: "Footprints",
        min: 0,
        max: 1,
        lowLabel: "Freeform",
        highLabel: "Danceable",
    },
    {
        key: "bpm",
        label: "Tempo",
        icon: "Gauge",
        min: 60,
        max: 180,
        lowLabel: "Slow",
        highLabel: "Fast",
        unit: "BPM",
    },
    {
        key: "arousal",
        label: "Arousal",
        icon: "AudioWaveform",
        min: 0,
        max: 1,
        lowLabel: "Peaceful",
        highLabel: "Energetic",
    },
];

const ML_MOOD_CONFIG = [
    { key: "moodHappy", label: "Happy", icon: "Smile", color: "yellow-400" },
    { key: "moodSad", label: "Sad", icon: "Frown", color: "blue-400" },
    { key: "moodRelaxed", label: "Relaxed", icon: "Coffee", color: "green-400" },
    { key: "moodAggressive", label: "Aggressive", icon: "Flame", color: "red-400" },
    { key: "moodParty", label: "Party", icon: "PartyPopper", color: "pink-400" },
    { key: "moodAcoustic", label: "Acoustic", icon: "Guitar", color: "amber-400" },
    { key: "moodElectronic", label: "Electronic", icon: "Radio", color: "purple-400" },
];
```

---

## Vibe Matching Algorithm

### Feature Vector Construction

The system builds a **13-dimensional feature vector** for each track:

```typescript
const buildFeatureVector = (track: AudioFeatures) => [
    // ML Mood predictions (7 features) - 1.3x weight for semantic importance
    getMoodValue(track.moodHappy, 0.5) * 1.3,
    getMoodValue(track.moodSad, 0.5) * 1.3,
    getMoodValue(track.moodRelaxed, 0.5) * 1.3,
    getMoodValue(track.moodAggressive, 0.5) * 1.3,
    getMoodValue(track.moodParty, 0.5) * 1.3,
    getMoodValue(track.moodAcoustic, 0.5) * 1.3,
    getMoodValue(track.moodElectronic, 0.5) * 1.3,

    // Audio features (5 features)
    track.energy ?? 0.5,
    calculateEnhancedArousal(track),
    track.danceabilityMl ?? track.danceability ?? 0.5,
    track.instrumentalness ?? 0.5,

    // BPM (octave-aware normalization)
    1 - octaveAwareBPMDistance(track.bpm ?? 120, 120),

    // Valence
    calculateEnhancedValence(track),
];

// Helper: Get mood value with fallback
const getMoodValue = (value: number | null | undefined, fallback: number) =>
    value ?? fallback;
```

### Cosine Similarity Calculation

Tracks are compared using cosine similarity:

```typescript
const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magA += vectorA[i] * vectorA[i];
        magB += vectorB[i] * vectorB[i];
    }

    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
};
```

### Tag/Genre Bonus

Additional boost for shared tags:

```typescript
const computeTagBonus = (
    sourceTags: string[],
    sourceGenres: string[],
    trackTags: string[],
    trackGenres: string[]
): number => {
    const sourceSet = new Set(
        [...sourceTags, ...sourceGenres].map(t => t.toLowerCase())
    );
    const trackSet = new Set(
        [...trackTags, ...trackGenres].map(t => t.toLowerCase())
    );

    const overlap = [...sourceSet].filter(tag => trackSet.has(tag)).length;
    return Math.min(0.05, overlap * 0.01);  // Max 5% bonus
};
```

### Final Score

```typescript
const finalScore = cosineSimilarity(sourceVector, targetVector) * 0.95 + tagBonus;
```

### Matching Thresholds

| Mode | Minimum Similarity |
|------|-------------------|
| Enhanced | 40% |
| Standard | 50% |

Lower threshold for Enhanced mode because ML predictions provide more nuanced differentiation.

### Octave-Aware BPM Matching

Treats harmonically related tempos as similar (60 BPM ≈ 120 BPM ≈ 240 BPM):

```typescript
const octaveAwareBPMDistance = (bpm1: number, bpm2: number): number => {
    const normalizeToOctave = (bpm: number): number => {
        while (bpm < 77) bpm *= 2;
        while (bpm > 154) bpm /= 2;
        return bpm;
    };

    const norm1 = normalizeToOctave(bpm1);
    const norm2 = normalizeToOctave(bpm2);

    const logDistance = Math.abs(Math.log2(norm1) - Math.log2(norm2));
    return Math.min(logDistance, 1);
};
```

---

## API Endpoints

### Get Track Audio Features

```
GET /api/tracks/:id/features
```

Response:
```json
{
    "bpm": 128.5,
    "energy": 0.78,
    "valence": 0.65,
    "arousal": 0.72,
    "danceability": 0.85,
    "key": "C",
    "keyScale": "major",
    "moodHappy": 0.72,
    "moodSad": 0.15,
    "moodRelaxed": 0.28,
    "moodAggressive": 0.45,
    "moodParty": 0.68,
    "moodAcoustic": 0.12,
    "moodElectronic": 0.78,
    "analysisMode": "enhanced",
    "analysisStatus": "completed"
}
```

### Find Similar Tracks (Vibe Match)

```
GET /api/library/vibe-match?trackId=:id&limit=20
```

Response:
```json
{
    "source": { /* track with features */ },
    "matches": [
        {
            "track": { /* track data */ },
            "similarity": 0.87,
            "features": { /* audio features */ }
        }
    ]
}
```

### Generate Mood Mix

```
POST /api/mixes/mood
```

Request:
```json
{
    "valence": { "min": 0.6, "max": 1.0 },
    "energy": { "min": 0.5, "max": 0.8 },
    "danceability": { "min": 0.7, "max": 1.0 },
    "bpm": { "min": 100, "max": 140 },
    "limit": 15
}
```

### Get Mood Presets

```
GET /api/mixes/mood-presets
```

Response:
```json
[
    {
        "id": "chill",
        "name": "Chill Vibes",
        "color": "from-blue-600 to-purple-600",
        "params": {
            "valence": { "min": 0.3, "max": 0.7 },
            "energy": { "min": 0.1, "max": 0.4 }
        }
    }
]
```

---

## Frontend Integration Guide

### Displaying Feature Values

Normalize values for consistent display:

```typescript
function normalizeValue(
    value: number | null | undefined,
    min: number,
    max: number
): number {
    if (value === null || value === undefined) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Usage
const normalizedBpm = normalizeValue(track.bpm, 60, 180);
const normalizedEnergy = normalizeValue(track.energy, 0, 1);
```

### Calculating Match Scores

```typescript
function calculateFeatureMatch(
    sourceVal: number | null,
    currentVal: number | null,
    min: number,
    max: number
): { diff: number; match: number } {
    const sourceNorm = normalizeValue(sourceVal, min, max);
    const currentNorm = normalizeValue(currentVal, min, max);
    const diff = Math.abs(sourceNorm - currentNorm);
    const match = Math.round((1 - diff) * 100);

    return { diff, match };
}
```

### Match Score Color Coding

```typescript
function getMatchColor(matchPercent: number): string {
    if (matchPercent >= 80) return "text-green-400";  // Excellent
    if (matchPercent >= 60) return "text-yellow-400"; // Good
    return "text-red-400";                            // Different
}

function getMatchDescription(matchPercent: number): string {
    if (matchPercent >= 80) return "Excellent match - very similar vibe";
    if (matchPercent >= 60) return "Good match - similar energy";
    return "Different vibe - exploring variety";
}
```

### Visualization Recommendations

#### 1. Radar Chart (Spider Graph)
Best for comparing multiple features at once. Shows source track (dashed line) vs current track (solid fill).

#### 2. Progress Bars
Best for individual feature comparison with source marker overlay.

#### 3. Mood Grid
4x2 or 4x4 grid of ML mood indicators with percentage matches.

#### 4. Valence-Arousal Quadrant
2D scatter plot with:
- X-axis: Valence (sad → happy)
- Y-axis: Arousal (calm → energetic)

Quadrants:
- Top-right: Happy + Energetic (Party)
- Top-left: Sad + Energetic (Angry/Tense)
- Bottom-right: Happy + Calm (Peaceful)
- Bottom-left: Sad + Calm (Melancholic)

---

## Existing Components Reference

### VibeOverlay
Location: `frontend/components/player/VibeOverlay.tsx`

Full-featured overlay showing:
- Overall match percentage
- Feature-by-feature comparison bars
- ML mood grid (enhanced mode)
- Source vs current legend

### VibeGraph
Location: `frontend/components/player/VibeGraph.tsx`

Compact radar chart for:
- 4-feature comparison (Energy, Mood, Dance, BPM)
- Match score badge
- Inline display in player

### MoodMixer
Location: `frontend/components/MoodMixer.tsx`

Modal for:
- Quick mood presets
- Custom range sliders
- Generating mood-based playlists

---

## Special Considerations

### Out-of-Distribution (OOD) Detection

The MusiCNN model was trained on pop/rock music. For other genres (classical, ambient, jazz), predictions may be unreliable. The backend normalizes these cases:

**Detection criteria:**
- All mood values > 0.7 with low variance
- All mood values clustered around 0.5

**UI Recommendation:** Show a subtle indicator when `analysisMode` is "standard" or when predictions seem unreliable.

### Handling Missing Data

Always provide fallback values:

```typescript
const safeFeatures = {
    energy: track.energy ?? 0.5,
    valence: track.valence ?? 0.5,
    bpm: track.bpm ?? 120,
    // ... etc
};
```

### Analysis Status States

| Status | UI Treatment |
|--------|--------------|
| `pending` | Show "Analyzing..." with spinner |
| `processing` | Show progress indicator |
| `completed` | Show full vibe data |
| `failed` | Show fallback/retry option |

---

## Quick Reference: Value Ranges

| Metric | Min | Max | Neutral |
|--------|-----|-----|---------|
| All mood* | 0 | 1 | 0.5 |
| energy | 0 | 1 | 0.5 |
| valence | 0 | 1 | 0.5 |
| arousal | 0 | 1 | 0.5 |
| danceability | 0 | 1 | 0.5 |
| bpm | 60 | 200 | 120 |
| keyStrength | 0 | 1 | - |

---

## File Locations

| Component | Path |
|-----------|------|
| Audio Analyzer (Python) | `services/audio-analyzer/analyzer.py` |
| Vibe Matching Logic | `backend/src/routes/library.ts` |
| Database Schema | `backend/prisma/schema.prisma` |
| Frontend Vibe Overlay | `frontend/components/player/VibeOverlay.tsx` |
| Frontend Vibe Graph | `frontend/components/player/VibeGraph.tsx` |
| Mood Mixer | `frontend/components/MoodMixer.tsx` |
| Audio State Context | `frontend/lib/audio-state-context.tsx` |

---

## Research Background

The Vibe System's valence and arousal calculations are informed by music psychology research:

### Valence (Emotional Positivity)

**Key Finding:** Mode/tonality is the strongest predictor of perceived valence in music.

- **Lee et al. (ICASSP 2020)** - Demonstrated that musical mode (major vs. minor) has the highest correlation with listener-reported valence
- Major keys contribute positively (+0.3 in our formula), minor keys negatively (-0.2)
- This aligns with centuries of music theory and empirical psychology research

### Arousal (Energy/Excitement)

**Key Finding:** The "electronic" mood prediction from ML models is unreliable for arousal calculation.

- **Grekow (2018)** - Found that direct energy and tempo features outperform genre-based predictions for arousal
- Our implementation replaces the "electronic" mood with explicit energy and BPM contributions
- This provides more consistent arousal predictions across diverse genres

### Feature Weights

The specific weights in our formulas (e.g., 0.35 for happy mood, 0.25 for energy) were tuned through:
1. Initial values from published research
2. Empirical testing on a diverse music library
3. User feedback on vibe matching accuracy

### References

- Lee, J., et al. (2020). "Music Emotion Recognition Using Valence-Arousal Regression." ICASSP 2020.
- Grekow, J. (2018). "Music Emotion Maps in Arousal-Valence Space." IFIP International Conference on Computer Information Systems and Industrial Management.
