# Vibe Matching Algorithm Overhaul Plan

## Overview

This document outlines the plan to overhaul the vibe matching algorithm to use **cosine similarity** on a comprehensive feature vector that includes all 9 ML mood predictions, audio features, and genre/tag matching.

## Current State (Before Overhaul)

### What We Have
- **ML Mood Predictions (9 total):**
  - `moodHappy`, `moodSad`, `moodRelaxed`, `moodAggressive` (existing)
  - `moodParty`, `moodAcoustic`, `moodElectronic` (newly added)
  - `danceabilityMl`, `aggressivenessMl` (existing)
  
- **Audio Features:**
  - `bpm`, `key`, `keyScale` (major/minor)
  - `energy`, `danceability`, `valence`, `arousal`
  - `instrumentalness`, `acousticness`, `speechiness`
  
- **Metadata:**
  - `lastfmTags` (JSON array of tag objects with name/count)
  - `essentiaGenres` (JSON array of genre strings)
  - `trackGenres` relation (linked genre records)

### Previous Algorithm (Weighted Manhattan Distance)
```typescript
// Old approach - arbitrary weights, limited features
const weights = {
  energy: 1.5,
  danceability: 1.2,
  valence: 1.0,
  arousal: 1.0,
  instrumentalness: 0.8,
  bpm: 0.5,
};

let score = 0;
for (const [feature, weight] of Object.entries(weights)) {
  const diff = Math.abs(sourceTrack[feature] - candidateTrack[feature]);
  score += diff * weight;
}
// Lower score = more similar (inverted logic)
```

**Problems with old approach:**
1. Only used 6 features, ignored all ML mood predictions
2. Arbitrary weights with no scientific basis
3. Manhattan distance less effective for high-dimensional feature spaces
4. No genre/tag matching
5. Score inversion was confusing

---

## New Algorithm (Cosine Similarity)

### Phase 1: Database Schema Update ✅
Add new mood fields to Prisma schema:

```prisma
model Track {
  // ... existing fields ...
  
  // ML Mood Predictions (0.0-1.0)
  moodHappy       Float?
  moodSad         Float?
  moodRelaxed     Float?
  moodAggressive  Float?
  moodParty       Float?      // NEW
  moodAcoustic    Float?      // NEW
  moodElectronic  Float?      // NEW
  
  // ... rest of schema ...
}
```

**Migration command:**
```bash
cd backend
npx prisma db push --skip-generate
```

### Phase 2: Audio Analyzer Update ✅
Update `services/audio-analyzer/analyzer.py` to extract and save all 7 mood predictions:

```python
# MusiCNN mood classifiers
mood_models = {
    'moodHappy': 'mood_happy-musicnn-msd-2',
    'moodSad': 'mood_sad-musicnn-msd-2',
    'moodRelaxed': 'mood_relaxed-musicnn-msd-2',
    'moodAggressive': 'mood_aggressive-musicnn-msd-2',
    'moodParty': 'mood_party-musicnn-msd-2',
    'moodAcoustic': 'mood_acoustic-musicnn-msd-2',
    'moodElectronic': 'mood_electronic-musicnn-msd-2',
}

# Save all to database
UPDATE "Track" SET
  "moodHappy" = %s,
  "moodSad" = %s,
  "moodRelaxed" = %s,
  "moodAggressive" = %s,
  "moodParty" = %s,
  "moodAcoustic" = %s,
  "moodElectronic" = %s,
  ...
```

### Phase 3: Feature Vector Construction
Build a normalized feature vector for each track:

```typescript
interface TrackFeatures {
  // ML Moods (0-1)
  moodHappy: number | null;
  moodSad: number | null;
  moodRelaxed: number | null;
  moodAggressive: number | null;
  moodParty: number | null;
  moodAcoustic: number | null;
  moodElectronic: number | null;
  
  // Audio Features
  energy: number | null;
  arousal: number | null;
  danceability: number | null;
  danceabilityMl: number | null;
  instrumentalness: number | null;
  bpm: number | null;
  keyScale: string | null;
  
  // Metadata
  lastfmTags: any;
  essentiaGenres: any;
}

function buildFeatureVector(track: TrackFeatures): number[] {
  return [
    // 7 ML Mood predictions (indices 0-6)
    track.moodHappy ?? 0.5,
    track.moodSad ?? 0.5,
    track.moodRelaxed ?? 0.5,
    track.moodAggressive ?? 0.5,
    track.moodParty ?? 0.5,
    track.moodAcoustic ?? 0.5,
    track.moodElectronic ?? 0.5,
    
    // Core audio features (indices 7-10)
    track.energy ?? 0.5,
    track.arousal ?? 0.5,
    track.danceabilityMl ?? track.danceability ?? 0.5,
    track.instrumentalness ?? 0.5,
    
    // Normalized BPM (index 11)
    // Maps 60-180 BPM to 0-1 range
    Math.max(0, Math.min(1, ((track.bpm ?? 120) - 60) / 120)),
    
    // Key mode (index 12)
    // Major = 1, Minor = 0
    track.keyScale === 'major' ? 1 : 0,
  ];
}
```

**Feature Vector Dimensions: 13**

### Phase 4: Cosine Similarity Calculation

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}
```

**Properties:**
- Returns value between -1 and 1 (for our 0-1 normalized vectors, always 0 to 1)
- 1.0 = identical vectors (perfect match)
- 0.0 = orthogonal vectors (no similarity)
- Higher = better (intuitive, no inversion needed)

### Phase 5: Tag/Genre Bonus

Add bonus points for matching tags and genres:

```typescript
function calculateTagBonus(
  sourceTrack: TrackFeatures,
  candidateTrack: TrackFeatures
): number {
  let bonus = 0;
  
  // Extract tags
  const sourceTags = new Set<string>();
  const candidateTags = new Set<string>();
  
  // Parse lastfmTags
  if (Array.isArray(sourceTrack.lastfmTags)) {
    sourceTrack.lastfmTags.forEach((t: any) => {
      if (t?.name) sourceTags.add(t.name.toLowerCase());
    });
  }
  if (Array.isArray(candidateTrack.lastfmTags)) {
    candidateTrack.lastfmTags.forEach((t: any) => {
      if (t?.name) candidateTags.add(t.name.toLowerCase());
    });
  }
  
  // Parse essentiaGenres
  if (Array.isArray(sourceTrack.essentiaGenres)) {
    sourceTrack.essentiaGenres.forEach((g: string) => {
      sourceTags.add(g.toLowerCase());
    });
  }
  if (Array.isArray(candidateTrack.essentiaGenres)) {
    candidateTrack.essentiaGenres.forEach((g: string) => {
      candidateTags.add(g.toLowerCase());
    });
  }
  
  // Count overlapping tags
  let overlap = 0;
  for (const tag of sourceTags) {
    if (candidateTags.has(tag)) overlap++;
  }
  
  // Bonus: up to 0.1 (10%) for tag overlap
  // Normalized by the smaller set size to handle varying tag counts
  const minSize = Math.min(sourceTags.size, candidateTags.size);
  if (minSize > 0) {
    bonus = (overlap / minSize) * 0.1;
  }
  
  return bonus;
}
```

### Phase 6: Final Score Calculation

```typescript
function calculateVibeScore(
  sourceTrack: TrackFeatures,
  candidateTrack: TrackFeatures
): number {
  // Build feature vectors
  const sourceVector = buildFeatureVector(sourceTrack);
  const candidateVector = buildFeatureVector(candidateTrack);
  
  // Calculate cosine similarity (0-1)
  const cosineSim = cosineSimilarity(sourceVector, candidateVector);
  
  // Add tag bonus (0-0.1)
  const tagBonus = calculateTagBonus(sourceTrack, candidateTrack);
  
  // Final score: cosine similarity + tag bonus
  // Capped at 1.0
  const finalScore = Math.min(1.0, cosineSim + tagBonus);
  
  return finalScore;
}
```

### Phase 7: Integration into Radio Endpoint

Update `backend/src/routes/library.ts`:

```typescript
// In the vibe radio section
const sourceTrack = await prisma.track.findUnique({
  where: { id: trackId },
  select: {
    moodHappy: true,
    moodSad: true,
    moodRelaxed: true,
    moodAggressive: true,
    moodParty: true,
    moodAcoustic: true,
    moodElectronic: true,
    energy: true,
    arousal: true,
    danceability: true,
    danceabilityMl: true,
    instrumentalness: true,
    bpm: true,
    keyScale: true,
    lastfmTags: true,
    essentiaGenres: true,
  },
});

// Get candidates
const candidates = await prisma.track.findMany({
  where: {
    id: { not: trackId },
    analysisStatus: 'enhanced', // Only use analyzed tracks
  },
  select: { /* same fields */ },
  take: 500, // Get more candidates for better matching
});

// Score all candidates
const scored = candidates.map(candidate => ({
  ...candidate,
  vibeScore: calculateVibeScore(sourceTrack, candidate),
}));

// Sort by score (highest first)
scored.sort((a, b) => b.vibeScore - a.vibeScore);

// Take top N for the queue
const vibeQueue = scored.slice(0, limit);

// DO NOT SHUFFLE - preserve the sorted order!
```

---

## Implementation Checklist

- [x] **Phase 1:** Add `moodParty`, `moodAcoustic`, `moodElectronic` to Prisma schema
- [x] **Phase 2:** Update audio analyzer to extract all 7 moods
- [x] **Phase 3:** Implement `buildFeatureVector()` function
- [x] **Phase 4:** Implement `cosineSimilarity()` function
- [x] **Phase 5:** Implement `calculateTagBonus()` function (called `computeTagBonus`)
- [x] **Phase 6:** Implement `calculateVibeScore()` combining all components
- [x] **Phase 7:** Integrate into `/library/radio` endpoint
- [ ] **Phase 8:** Update frontend to display match percentage (optional enhancement)
- [ ] **Phase 9:** Re-analyze tracks to populate new mood fields

---

## Re-Analysis Script

To populate the new mood fields for existing tracks:

```sql
-- Reset analysis status for enhanced tracks to re-run analysis
UPDATE "Track"
SET "analysisStatus" = 'pending'
WHERE "analysisStatus" = 'enhanced';
```

Or use the existing script:
```bash
docker exec lidify_db psql -U lidifydb -d lidify -f /path/to/reset-analysis-for-new-moods.sql
```

---

## Expected Improvements

1. **Better Similarity Matching:** Cosine similarity is mathematically proven to work well for high-dimensional feature vectors
2. **Full ML Utilization:** All 9 mood predictions now contribute to matching
3. **Genre Awareness:** Tag/genre overlap provides meaningful boost
4. **Intuitive Scores:** Higher score = better match (no inversion)
5. **Normalized Features:** All features scaled to 0-1 for fair comparison

---

## Testing Strategy

1. Pick a track with known characteristics (e.g., happy upbeat pop song)
2. Generate vibe queue
3. Verify top matches share similar mood profiles
4. Check that match percentages in UI reflect actual similarity
5. Test with various genres to ensure cross-genre matching works appropriately

---

## Files Modified

- `backend/prisma/schema.prisma` - New mood fields
- `backend/src/routes/library.ts` - New scoring algorithm
- `services/audio-analyzer/analyzer.py` - Extract all 7 moods
- `frontend/components/player/VibeOverlay.tsx` - Display all moods
- `frontend/lib/audio-state-context.tsx` - Extended AudioFeatures interface

---

## Notes

- **Gaia:** Essentia has a companion library called Gaia for large-scale similarity search using KD-trees. This is overkill for our scale (< 100k tracks) but could be considered for future scaling.
- **MusiCNN Limitations:** The model was trained on MSD (Million Song Dataset) which is pop/rock heavy. For classical/ambient music, predictions may be less reliable. We've added normalization to handle this.
- **Shuffle Interaction:** Vibe mode automatically disables shuffle to preserve the sorted order.

