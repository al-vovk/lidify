# Lidify Vibe Matching System - Research Review Document

## Executive Summary

This document provides a complete overview of Lidify's audio-based music recommendation ("vibe matching") system for research review. The system uses ML-based audio analysis to find similar songs based on how they *sound*, not metadata or collaborative filtering.

---

## Sample Results (Live Terminal Output)

### Example 1: Piano Music ("I Love You" by RIOPY)

```
SOURCE: "I Love You" by RIOPY
  Album: RIOPY
  Analysis Mode: enhanced
  BPM: 91.3 | Energy: 0.28 | Valence: 0.53
  Danceability: 0.96 | Arousal: 0.52 | Key: major
  ML Moods: Happy=0.91, Sad=0.65, Relaxed=1.00, Aggressive=0.99
  Mood Tags: sad, dance, chill, melancholic, relaxed, uplifting, aggressive, intense, groovy, happy

TOP MATCHES (by cosine similarity):
#   | TRACK                           | ARTIST           | BPM  | ENG  | VAL  | H    | S    | R    | A    
----|--------------------------------|------------------|------|------|------|------|------|------|------
1   | Minimal Game                    | RIOPY            | 84   | 0.25 | 0.51 | 0.70 | 0.20 | 0.80 | 0.76
2   | Lullaby                         | RIOPY            | 82   | 0.28 | 0.54 | 0.75 | 0.20 | 0.80 | 0.76
3   | Joy                             | RIOPY            | 97   | 0.34 | 0.57 | 0.98 | 0.58 | 1.00 | 0.99
4   | Introspective (From Home)       | Dirk Maassen     | 94   | 0.32 | 0.55 | 0.79 | 0.20 | 0.80 | 0.80
5   | Sweet dream                     | RIOPY            | 91   | 0.28 | 0.48 | 0.64 | 0.20 | 0.80 | 0.77
6   | Sense of hope                   | RIOPY            | 99   | 0.25 | 0.53 | 0.74 | 0.20 | 0.80 | 0.78
7   | Drive                           | RIOPY            | 96   | 0.44 | 0.55 | 0.78 | 0.20 | 0.80 | 0.78
8   | Air (From Home)                 | Dirk Maassen     | 81   | 0.14 | 0.56 | 0.79 | 0.20 | 0.80 | 0.76
9   | Prelude                         | Muse             | 85   | 0.39 | 0.40 | 0.68 | 0.70 | 0.96 | 1.00
10  | Towards the Sun                 | Dirk Maassen     | 117  | 0.25 | 0.49 | 0.66 | 0.20 | 0.80 | 0.80
```

**Observation:** Piano music correctly matches with other piano composers (RIOPY, Dirk Maassen).

---

### Example 2: Alt-Rock ("You and I" by Pvris)

```
SOURCE: "You and I" by Pvris
  Album: White Noise
  Analysis Mode: enhanced
  BPM: 101.9 | Energy: 0.57 | Valence: 0.50
  Danceability: 1.00 | Arousal: 0.44 | Key: major
  ML Moods: Happy=0.49, Sad=0.31, Relaxed=0.44, Aggressive=0.68
  Mood Tags: intense, dance, aggressive, groovy

TOP MATCHES:
#   | TRACK                           | ARTIST           | BPM  | ENG  | VAL  | H    | S    | R    | A    
----|--------------------------------|------------------|------|------|------|------|------|------|------
1   | Tether                          | CHVRCHES         | 120  | 0.52 | 0.47 | 0.43 | 0.28 | 0.50 | 0.69
2   | By The Throat (Live)            | CHVRCHES         | 118  | 0.50 | 0.52 | 0.37 | 0.20 | 0.34 | 0.72
3   | Separate                        | Pvris            | 90   | 0.64 | 0.52 | 0.49 | 0.26 | 0.40 | 0.85
4   | Strong Hand (Live)              | CHVRCHES         | 80   | 0.58 | 0.60 | 0.55 | 0.34 | 0.34 | 0.74
5   | Stay Gold                       | Pvris            | 100  | 0.72 | 0.57 | 0.47 | 0.25 | 0.35 | 0.80
6   | I Like The Devil                | Purity Ring      | 100  | 0.65 | 0.54 | 0.60 | 0.31 | 0.43 | 0.92
7   | Madness (Live)                  | Muse             | 92   | 0.78 | 0.62 | 0.77 | 0.52 | 0.57 | 0.77
```

**Observation:** Synth-pop/alt-rock correctly matches with similar artists (CHVRCHES, Pvris, Purity Ring).

---

### Example 3: Rock ("Supermassive Black Hole" by Muse)

```
SOURCE: "Supermassive Black Hole" by Muse
  Album: HAARP
  Analysis Mode: enhanced
  BPM: 120.1 | Energy: 0.67 | Valence: 0.56
  Danceability: 1.00 | Arousal: 0.42 | Key: minor
  ML Moods: Happy=0.72, Sad=0.64, Relaxed=0.16, Aggressive=0.22
  Mood Tags: sad, dance, melancholic, uplifting, groovy, happy

TOP MATCHES:
#   | TRACK                           | ARTIST           | BPM  | ENG  | VAL  | H    | S    | R    | A    
----|--------------------------------|------------------|------|------|------|------|------|------|------
1   | Supermassive Black Hole (Live)  | Muse             | 120  | 0.75 | 0.56 | 0.76 | 0.58 | 0.06 | 0.04
2   | Thought Contagion (Live)        | Muse             | 140  | 0.76 | 0.57 | 0.77 | 0.52 | 0.08 | 0.09
3   | Let Them In                     | Pvris            | 146  | 0.64 | 0.62 | 0.67 | 0.50 | 0.22 | 0.22
4   | Panic Station (Live)            | Muse             | 105  | 0.69 | 0.47 | 0.61 | 0.61 | 0.02 | 0.03
5   | Smoke                           | Pvris            | 150  | 0.57 | 0.56 | 0.64 | 0.66 | 0.20 | 0.30
6   | Animals                         | Muse             | 113  | 0.82 | 0.55 | 0.79 | 0.59 | 0.24 | 0.21
```

**Observation:** Rock music correctly matches with other Muse tracks and similar-sounding rock/alt artists.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUDIO ANALYSIS PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────┐   │
│  │ Audio File  │────►│         Essentia Audio Processing                │   │
│  │ (.flac/.mp3)│     │                                                  │   │
│  └─────────────┘     │  • FFT/Spectral Analysis                        │   │
│                      │  • Beat/Tempo Detection                          │   │
│                      │  • Key/Scale Detection                           │   │
│                      │  • RMS Energy Calculation                        │   │
│                      └─────────────┬────────────────────────────────────┘   │
│                                    │                                         │
│                      ┌─────────────▼────────────────────────────────────┐   │
│                      │      MusiCNN (TensorFlow Model)                   │   │
│                      │                                                   │   │
│                      │  Input: 16kHz mono audio                         │   │
│                      │  Output: 200-dimensional embeddings              │   │
│                      │  Architecture: Convolutional Neural Network      │   │
│                      │  Training: Million Song Dataset (MSD)            │   │
│                      └─────────────┬────────────────────────────────────┘   │
│                                    │                                         │
│           ┌────────────────────────┼────────────────────────────┐           │
│           │                        │                            │           │
│           ▼                        ▼                            ▼           │
│  ┌─────────────────┐    ┌─────────────────┐          ┌─────────────────┐   │
│  │  Mood Happy     │    │  Mood Sad       │    ...   │  Danceability   │   │
│  │  Classifier     │    │  Classifier     │          │  Classifier     │   │
│  │  (Softmax)      │    │  (Softmax)      │          │  (Softmax)      │   │
│  └────────┬────────┘    └────────┬────────┘          └────────┬────────┘   │
│           │                      │                            │             │
│           └──────────────────────┼────────────────────────────┘             │
│                                  │                                          │
│                      ┌───────────▼───────────┐                             │
│                      │   DERIVED FEATURES    │                             │
│                      │                       │                             │
│                      │  Valence = f(happy, party, sad)                     │
│                      │  Arousal = f(aggressive, party, electronic,         │
│                      │            relaxed, acoustic)                        │
│                      └───────────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VIBE MATCHING ALGORITHM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Build Feature Vector (13 dimensions):                                   │
│     [moodHappy, moodSad, moodRelaxed, moodAggressive, moodParty,           │
│      moodAcoustic, moodElectronic, energy, arousal, danceability,           │
│      instrumentalness, normalizedBPM, keyMode]                              │
│                                                                              │
│  2. Compute Cosine Similarity:                                              │
│                    Σ(aᵢ × bᵢ)                                               │
│     cos(θ) = ─────────────────────                                         │
│              √(Σaᵢ²) × √(Σbᵢ²)                                             │
│                                                                              │
│  3. Add Tag/Genre Bonus (max 5%):                                           │
│     Jaccard similarity on lastfmTags ∪ essentiaGenres                       │
│                                                                              │
│  4. Final Score = 0.95 × cosineSim + tagBonus                               │
│                                                                              │
│  5. Filter threshold: 40% (Enhanced) or 50% (Standard)                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Schema (What We Store Per Track)

### Database Schema (PostgreSQL + Prisma)

```sql
-- Track table audio analysis columns
model Track {
  -- Basic Info
  id            String   @id
  title         String
  albumId       String
  duration      Int      -- seconds
  filePath      String   -- relative path to audio file
  
  -- === RHYTHM ANALYSIS (Essentia) ===
  bpm           Float?   -- beats per minute (60-200 typical)
  beatsCount    Int?     -- total beats in track
  
  -- === TONALITY (Essentia) ===
  key           String?  -- musical key ("C", "F#", "Bb", etc.)
  keyScale      String?  -- "major" or "minor"
  keyStrength   Float?   -- confidence 0-1
  
  -- === ENERGY & DYNAMICS (Essentia) ===
  energy        Float?   -- overall energy 0-1 (RMS-based)
  loudness      Float?   -- average loudness in dB
  dynamicRange  Float?   -- dynamic range in dB
  
  -- === BASIC AUDIO FEATURES ===
  danceability      Float?   -- 0-1 how suitable for dancing
  valence           Float?   -- 0 (sad) to 1 (happy) - DERIVED
  arousal           Float?   -- 0 (calm) to 1 (energetic) - DERIVED
  
  -- === INSTRUMENTATION ===
  instrumentalness  Float?   -- 0-1 (1 = no vocals) - ML predicted
  acousticness      Float?   -- 0-1 (1 = acoustic)
  speechiness       Float?   -- 0-1 (1 = spoken word)
  
  -- === ML MOOD PREDICTIONS (Enhanced Mode) ===
  -- These are the core ML outputs from MusiCNN classifiers
  moodHappy         Float?   -- ML prediction 0-1 (probability of happy)
  moodSad           Float?   -- ML prediction 0-1 (probability of sad)
  moodRelaxed       Float?   -- ML prediction 0-1 (probability of relaxed)
  moodAggressive    Float?   -- ML prediction 0-1 (probability of aggressive)
  moodParty         Float?   -- ML prediction 0-1 (probability of party/upbeat)
  moodAcoustic      Float?   -- ML prediction 0-1 (probability of acoustic)
  moodElectronic    Float?   -- ML prediction 0-1 (probability of electronic)
  danceabilityMl    Float?   -- ML-based danceability (more accurate)
  
  -- === DERIVED TAGS ===
  moodTags          String[] -- ["aggressive", "happy", "chill", "workout"]
  essentiaGenres    String[] -- ["rock", "electronic", "jazz"]
  lastfmTags        String[] -- ["chill", "workout", "sad", "90s"]
  
  -- === ANALYSIS METADATA ===
  analysisStatus    String   -- pending, processing, completed, failed
  analysisMode      String?  -- 'standard' or 'enhanced'
  analysisVersion   String?  -- Essentia version used
  analyzedAt        DateTime?
}
```

---

## Core Algorithm: Feature Extraction (Python)

### analyzer.py - ML Feature Extraction

```python
def _extract_ml_features(self, audio_16k) -> Dict[str, Any]:
    """
    Extract features using Essentia MusiCNN + classification heads.
    
    Architecture:
    1. TensorflowPredictMusiCNN extracts embeddings from audio
    2. TensorflowPredict2D classification heads output predictions
    """
    result = {}
    
    # Step 1: Get embeddings from base MusiCNN model
    # Output shape: [frames, 200] - 200-dimensional embedding per frame
    embeddings = self.musicnn_model(audio_16k)
    
    # Step 2: Pass embeddings through classification heads
    # Each head outputs [frames, 2] where [:, 1] is probability of positive class
    
    # Collect raw predictions
    if 'mood_happy' in self.prediction_models:
        preds = self.prediction_models['mood_happy'](embeddings)
        result['moodHappy'] = float(np.mean(preds[:, 1]))
    
    if 'mood_sad' in self.prediction_models:
        preds = self.prediction_models['mood_sad'](embeddings)
        result['moodSad'] = float(np.mean(preds[:, 1]))
    
    if 'mood_relaxed' in self.prediction_models:
        preds = self.prediction_models['mood_relaxed'](embeddings)
        result['moodRelaxed'] = float(np.mean(preds[:, 1]))
    
    if 'mood_aggressive' in self.prediction_models:
        preds = self.prediction_models['mood_aggressive'](embeddings)
        result['moodAggressive'] = float(np.mean(preds[:, 1]))
    
    if 'mood_party' in self.prediction_models:
        preds = self.prediction_models['mood_party'](embeddings)
        result['moodParty'] = float(np.mean(preds[:, 1]))
    
    if 'mood_acoustic' in self.prediction_models:
        preds = self.prediction_models['mood_acoustic'](embeddings)
        result['moodAcoustic'] = float(np.mean(preds[:, 1]))
    
    if 'mood_electronic' in self.prediction_models:
        preds = self.prediction_models['mood_electronic'](embeddings)
        result['moodElectronic'] = float(np.mean(preds[:, 1]))
    
    # === VALENCE (derived from mood models) ===
    # Valence = emotional positivity: happy/party vs sad
    happy = result.get('moodHappy', 0.5)
    sad = result.get('moodSad', 0.5)
    party = result.get('moodParty', 0.5)
    result['valence'] = round(happy * 0.5 + party * 0.3 + (1 - sad) * 0.2, 3)
    
    # === AROUSAL (derived from mood models) ===
    # Arousal = energy level: aggressive/party/electronic vs relaxed/acoustic
    aggressive = result.get('moodAggressive', 0.5)
    relaxed = result.get('moodRelaxed', 0.5)
    acoustic = result.get('moodAcoustic', 0.5)
    electronic = result.get('moodElectronic', 0.5)
    result['arousal'] = round(
        aggressive * 0.35 + 
        party * 0.25 + 
        electronic * 0.2 + 
        (1 - relaxed) * 0.1 + 
        (1 - acoustic) * 0.1, 
        3
    )
    
    return result
```

---

## Core Algorithm: Cosine Similarity Matching (TypeScript)

### library.ts - Vibe Matching Implementation

```typescript
// === COSINE SIMILARITY SCORING ===
// Industry-standard approach: build feature vectors, compute cosine similarity
// Uses ALL 13 features for comprehensive matching

// Helper: Build normalized feature vector from track
const buildFeatureVector = (track: TrackFeatures): number[] => {
    return [
        // ML Mood predictions (7 features) - 0.5 default for missing
        track.moodHappy ?? 0.5,
        track.moodSad ?? 0.5,
        track.moodRelaxed ?? 0.5,
        track.moodAggressive ?? 0.5,
        track.moodParty ?? 0.5,
        track.moodAcoustic ?? 0.5,
        track.moodElectronic ?? 0.5,
        // Audio features (5 features)
        track.energy ?? 0.5,
        track.arousal ?? 0.5,
        track.danceabilityMl ?? track.danceability ?? 0.5,
        track.instrumentalness ?? 0.5,
        // BPM normalized to 0-1 (60-180 BPM range)
        Math.max(0, Math.min(1, ((track.bpm ?? 120) - 60) / 120)),
        // Key: major=1, minor=0, unknown=0.5
        track.keyScale === 'major' ? 1 : track.keyScale === 'minor' ? 0 : 0.5,
    ];
};

// Helper: Compute cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// Helper: Compute tag overlap bonus
const computeTagBonus = (
    sourceTags: string[], 
    sourceGenres: string[],
    trackTags: string[],
    trackGenres: string[]
): number => {
    const sourceSet = new Set([...sourceTags, ...sourceGenres].map(t => t.toLowerCase()));
    const trackSet = new Set([...trackTags, ...trackGenres].map(t => t.toLowerCase()));
    if (sourceSet.size === 0 || trackSet.size === 0) return 0;
    const overlap = [...sourceSet].filter(tag => trackSet.has(tag)).length;
    // Max 5% bonus for tag overlap
    return Math.min(0.05, overlap * 0.01);
};

// Score all candidate tracks
const scored = analyzedTracks.map(t => {
    const targetVector = buildFeatureVector(t);
    
    // Compute base cosine similarity
    let score = cosineSimilarity(sourceVector, targetVector);
    
    // Add tag/genre overlap bonus (max 5%)
    const tagBonus = computeTagBonus(
        sourceTrack.lastfmTags || [],
        sourceTrack.essentiaGenres || [],
        t.lastfmTags || [],
        t.essentiaGenres || []
    );
    
    // Final score: 95% cosine similarity + 5% tag bonus
    const finalScore = score * 0.95 + tagBonus;
    
    return { id: t.id, score: finalScore };
});

// Filter to good matches (>40% for Enhanced, >50% for Standard)
const minThreshold = isEnhancedAnalysis ? 0.40 : 0.50;
const goodMatches = scored
    .filter(t => t.score > minThreshold)
    .sort((a, b) => b.score - a.score);
```

---

## Feature Vector Breakdown

| Index | Feature | Range | Description | Weight Rationale |
|-------|---------|-------|-------------|------------------|
| 0 | moodHappy | 0-1 | ML probability of happy mood | Core mood dimension |
| 1 | moodSad | 0-1 | ML probability of sad mood | Core mood dimension |
| 2 | moodRelaxed | 0-1 | ML probability of relaxed mood | Core mood dimension |
| 3 | moodAggressive | 0-1 | ML probability of aggressive mood | Core mood dimension |
| 4 | moodParty | 0-1 | ML probability of party/upbeat | Core mood dimension |
| 5 | moodAcoustic | 0-1 | ML probability of acoustic sound | Instrumentation |
| 6 | moodElectronic | 0-1 | ML probability of electronic sound | Instrumentation |
| 7 | energy | 0-1 | RMS-based energy level | Audio characteristic |
| 8 | arousal | 0-1 | Derived energy/intensity | Composite dimension |
| 9 | danceability | 0-1 | ML or Essentia danceability | Rhythm characteristic |
| 10 | instrumentalness | 0-1 | Voice/instrumental ML detection | Instrumentation |
| 11 | normalizedBPM | 0-1 | (bpm - 60) / 120 | Tempo matching |
| 12 | keyMode | 0/0.5/1 | minor/unknown/major | Tonality |

---

## Valence & Arousal Derivation

Since Essentia doesn't have direct valence/arousal models, we derive them from mood predictions:

### Valence (Emotional Positivity)
```python
valence = moodHappy * 0.5 + moodParty * 0.3 + (1 - moodSad) * 0.2
```

**Rationale:**
- Happy mood is the strongest positive indicator (50% weight)
- Party/upbeat suggests positive energy (30% weight)
- Low sadness contributes to positivity (20% weight)

### Arousal (Energy Level)
```python
arousal = moodAggressive * 0.35 + moodParty * 0.25 + moodElectronic * 0.2 
        + (1 - moodRelaxed) * 0.1 + (1 - moodAcoustic) * 0.1
```

**Rationale:**
- Aggressive music is high-energy (35% weight)
- Party music has high arousal (25% weight)
- Electronic music tends to be energetic (20% weight)
- Low relaxation indicates higher energy (10% weight)
- Non-acoustic sound suggests higher energy (10% weight)

---

## Known Limitations & Edge Cases

### 1. Out-of-Distribution Audio
MusiCNN was trained on the Million Song Dataset (mostly pop/rock). For genres outside this distribution (classical, ambient, piano), the model sometimes outputs high values for ALL mood dimensions.

**Detection & Normalization:**
```python
core_moods = ['moodHappy', 'moodSad', 'moodRelaxed', 'moodAggressive']
core_values = [raw_moods[m][0] for m in core_moods if m in raw_moods]

if len(core_values) >= 4:
    min_mood = min(core_values)
    max_mood = max(core_values)
    
    # If all core moods are > 0.7 AND the range is small,
    # the predictions are likely unreliable (out-of-distribution audio)
    if min_mood > 0.7 and (max_mood - min_mood) < 0.3:
        # Normalize: scale so max becomes 0.8 and min becomes 0.2
        for mood_key in core_moods:
            old_val = raw_moods[mood_key][0]
            normalized = 0.2 + (old_val - min_mood) / (max_mood - min_mood) * 0.6
            raw_moods[mood_key] = normalized
```

### 2. Standard Mode Fallback
When ML models aren't available, heuristic estimates are used:

| Feature | Heuristic Formula |
|---------|-------------------|
| Valence | key_valence * 0.4 + bpm_valence * 0.25 + brightness * 0.2 + energy * 0.15 |
| Arousal | bpm_arousal * 0.35 + energy * 0.35 + brightness * 0.15 + compression * 0.15 |
| Instrumentalness | spectral_flatness * 0.6 + zcr_instrumental * 0.4 |
| Acousticness | dynamic_range / 12 |

### 3. Feature Vector Missing Values
Missing values default to 0.5 (neutral) to prevent bias:
```typescript
track.moodHappy ?? 0.5
```

---

## Open Questions for Review

1. **Feature Weighting:** Currently all 13 features have equal weight in cosine similarity. Should mood features (indices 0-6) have higher weight than audio features?

2. **Threshold Selection:** We use 40% similarity threshold for Enhanced mode. Is this too permissive? Too restrictive?

3. **Valence/Arousal Derivation:** Our formulas for deriving valence/arousal from mood predictions are hand-tuned. Are the weights reasonable?

4. **BPM Normalization:** We normalize BPM to 60-180 range. Should we use octave-aware BPM (treating 60 and 120 as similar)?

5. **Cross-Genre Matching:** The algorithm matches based on audio similarity regardless of genre. Should genre matching have more weight?

6. **Cold Start:** Tracks with missing analysis fall back to 0.5 for all features. Should they be excluded from matching?

---

## Dependencies

### Python (Audio Analyzer)
```
essentia==2.1b6.dev1110
essentia-tensorflow==2.1b6.dev1110
numpy>=1.21.0,<2.0.0
tensorflow==2.15.0
redis>=4.5.0
psycopg2-binary>=2.9.0
```

### MusiCNN Models (Essentia Model Zoo)
- `msd-musicnn-1.pb` - Base embedding model (~3MB)
- `mood_happy-msd-musicnn-1.pb` - Happy classifier
- `mood_sad-msd-musicnn-1.pb` - Sad classifier
- `mood_relaxed-msd-musicnn-1.pb` - Relaxed classifier
- `mood_aggressive-msd-musicnn-1.pb` - Aggressive classifier
- `mood_party-msd-musicnn-1.pb` - Party classifier
- `mood_acoustic-msd-musicnn-1.pb` - Acoustic classifier
- `mood_electronic-msd-musicnn-1.pb` - Electronic classifier
- `danceability-msd-musicnn-1.pb` - Danceability classifier
- `voice_instrumental-msd-musicnn-1.pb` - Voice/instrumental classifier

---

## References

- [Essentia TensorFlow Documentation](https://essentia.upf.edu/machine_learning.html)
- [MusiCNN Paper (Pons et al.)](https://arxiv.org/abs/1711.02520)
- [Essentia Model Zoo](https://essentia.upf.edu/models/)
- [Million Song Dataset](http://millionsongdataset.com/)

---

## File Locations

| Component | Path |
|-----------|------|
| Audio Analyzer | `services/audio-analyzer/analyzer.py` |
| Vibe Matching | `backend/src/routes/library.ts` (lines 3293-3580) |
| Database Schema | `backend/prisma/schema.prisma` |
| Standard Mode Docs | `docs/implementation-summaries/audio-analysis-standard-mode/README.md` |
| Enhanced Mode Docs | `docs/implementation-summaries/audio-analysis-standard-mode/ENHANCED_MODE.md` |
| Algorithm Overview | `docs/implementation-summaries/vibe-matching-overhaul/README.md` |

