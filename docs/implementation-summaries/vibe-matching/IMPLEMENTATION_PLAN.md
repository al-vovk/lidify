# Vibe Matching Implementation Plan

## Executive Summary

The current vibe matching system uses Essentia for audio analysis but only extracts **basic features**. Critical mood/emotion features are either placeholder values or poorly estimated. This document outlines a comprehensive plan to achieve Spotify-quality vibe matching while being conscious of performance on user hardware.

## Strategy Update (Latest)

**Default:** Enhanced mode (ML-powered, accurate)  
**Fallback:** Standard mode (lightweight, for troubleshooting or power saving)

**Approach:**
1. ✅ Pre-package all Essentia TensorFlow models in Docker image (~200MB)
2. 🔄 Fix Enhanced mode FIRST - make it actually use the ML models
3. ⏳ THEN create Standard mode as a lightweight fallback
4. Users can toggle to Standard mode to save CPU if needed

---

## Current State Analysis

### What Essentia IS Currently Extracting (Working)

| Feature | Status | Quality |
|---------|--------|---------|
| **BPM** | ✅ Working | Good - Uses `RhythmExtractor2013` |
| **Key** | ✅ Working | Good - Uses `KeyExtractor` |
| **KeyScale** | ✅ Working | Good - major/minor detection |
| **Energy** | ✅ Working | Moderate - Raw energy normalized |
| **Loudness** | ✅ Working | Good - dB measurement |
| **Dynamic Range** | ✅ Working | Good |
| **Danceability** | ✅ Working | Good - Uses `Danceability` algorithm |
| **Beats Count** | ✅ Working | Good |

### What's Broken or Placeholder

| Feature | Status | Problem |
|---------|--------|---------|
| **Valence** | ⚠️ Fake | Calculated as `(major/minor * 0.4) + (energy * 0.6)` - NOT actual emotional valence |
| **Arousal** | ⚠️ Fake | Calculated as `(BPM * 0.5) + (energy * 0.5)` - NOT actual arousal |
| **Instrumentalness** | ❌ Placeholder | Hardcoded to `0.5` |
| **Acousticness** | ⚠️ Estimate | Rough estimate from dynamic range |
| **Speechiness** | ❌ Placeholder | Hardcoded to `0.1` |
| **Mood Tags** | ⚠️ Derived | Generated from fake valence/arousal, not ML |
| **Genre Tags** | ❌ Empty | TensorFlow models not loaded |

### The Core Issue

```python
# Current valence calculation (analyzer.py lines 226-231)
key_valence = 0.6 if scale == 'major' else 0.4
energy_valence = result['energy']
result['valence'] = round((key_valence * 0.4 + energy_valence * 0.6), 3)
```

**"Fake Happy" by Paramore** (emotionally complex, about masking sadness):
- Major key → 0.6
- High energy → ~0.7
- Calculated valence: `(0.6 * 0.4) + (0.7 * 0.6) = 0.66` (appears "happy")

**"Summer Girl" by Jamiroquai** (genuinely upbeat funk):
- Major key → 0.6
- High energy → ~0.7
- Calculated valence: `(0.6 * 0.4) + (0.7 * 0.6) = 0.66` (appears "happy")

**Result: 97% match despite being completely different vibes!**

---

## How Spotify Does It

Spotify's audio analysis uses a combination of:

### 1. Low-Level Audio Features (Similar to what we have)
- Tempo/BPM
- Key/Mode
- Loudness
- Time signature

### 2. Mid-Level Features (We're missing these)
- **Spectral Centroid** - "brightness" of the sound
- **Spectral Rolloff** - frequency distribution
- **Zero Crossing Rate** - percussiveness
- **MFCCs** - Mel-frequency cepstral coefficients (timbral texture)
- **Chroma Features** - harmonic content

### 3. High-Level Features (We're faking these)
- **Valence** - Musical positiveness (0-1)
- **Arousal/Energy** - Intensity and activity
- **Instrumentalness** - Vocal presence prediction
- **Acousticness** - Acoustic vs electronic
- **Speechiness** - Presence of spoken words
- **Liveness** - Audience presence detection

### 4. Deep Learning Models
Spotify trains neural networks on millions of labeled tracks to predict:
- Mood categories
- Genre classification
- User preference patterns

---

## Two-Tier System

### Default: Enhanced Vibe Matching (ML-Powered)
**Status:** DEFAULT - Pre-packaged in Docker, just works  
**Target:** High accuracy, ~5-10 seconds per track

**Features (from Essentia TensorFlow Models):**
1. **Mood Predictions (real ML, not estimated):**
   - `mood_happy-discogs-effnet-1.pb` - Happiness/positivity 0-1
   - `mood_sad-discogs-effnet-1.pb` - Sadness 0-1
   - `mood_relaxed-discogs-effnet-1.pb` - Relaxation/calmness 0-1
   - `mood_aggressive-discogs-effnet-1.pb` - Aggression/intensity 0-1

2. **Audio Characteristics:**
   - `danceability-discogs-effnet-1.pb` - ML-based danceability
   - `voice_instrumental-discogs-effnet-1.pb` - Vocal detection (instrumentalness)

3. **Embeddings for Similarity:**
   - `discogs-effnet-bs64-1.pb` - Audio embeddings (neural "fingerprint")
   - Can be used for direct similarity comparison

4. **Spectral Features:**
   - Spectral Centroid (brightness)
   - MFCCs (timbral texture - 13 coefficients)

**Models Pre-packaged:** ~200MB in Docker image (no user download)  
**RAM Requirement:** ~500MB during analysis  
**CPU Requirement:** Any modern CPU (2015+)

### Fallback: Standard Vibe Matching (Lightweight)
**Status:** FALLBACK - For troubleshooting or power saving  
**Target:** Fast, <2 seconds per track, low CPU

**Features Used:**
- BPM (Essentia RhythmExtractor)
- Energy (Essentia Energy)
- Danceability (Essentia Danceability - non-ML version)
- Key/Scale (Essentia KeyExtractor)
- Spectral Centroid (cheap to compute)
- Last.fm mood tags
- Genre matching from tags

**When to use Standard mode:**
- Low-power devices (Raspberry Pi, older NAS)
- Troubleshooting if Enhanced mode has issues
- User preference to save CPU cycles

---

## Implementation Plan

### Phase 1: Pre-Package Models in Docker (Day 1)

#### 1.1 Update Dockerfile to Include Models

```dockerfile
# Download Essentia ML models during build (~200MB)
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    # Base embedding model (required for all predictions)
    curl -L -o /app/models/discogs-effnet-bs64-1.pb \
        "https://essentia.upf.edu/models/feature-extractors/discogs-effnet/discogs-effnet-bs64-1.pb" && \
    # Mood models
    curl -L -o /app/models/mood_happy-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/mood_happy/mood_happy-discogs-effnet-1.pb" && \
    curl -L -o /app/models/mood_sad-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/mood_sad/mood_sad-discogs-effnet-1.pb" && \
    curl -L -o /app/models/mood_relaxed-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/mood_relaxed/mood_relaxed-discogs-effnet-1.pb" && \
    curl -L -o /app/models/mood_aggressive-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/mood_aggressive/mood_aggressive-discogs-effnet-1.pb" && \
    # Danceability and voice/instrumental
    curl -L -o /app/models/danceability-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/danceability/danceability-discogs-effnet-1.pb" && \
    curl -L -o /app/models/voice_instrumental-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/voice_instrumental/voice_instrumental-discogs-effnet-1.pb" && \
    # Arousal/Valence models
    curl -L -o /app/models/arousal-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/mood_arousal/mood_arousal-discogs-effnet-1.pb" && \
    curl -L -o /app/models/valence-discogs-effnet-1.pb \
        "https://essentia.upf.edu/models/classification-heads/mood_valence/mood_valence-discogs-effnet-1.pb" && \
    apt-get purge -y curl && rm -rf /var/lib/apt/lists/*
```

### Phase 2: Implement Enhanced Analysis (Days 2-4)

#### 2.1 Rewrite analyzer.py with ML Models

```python
class AudioAnalyzer:
    """Enhanced audio analysis using Essentia TensorFlow models"""
    
    def __init__(self):
        self.models_loaded = False
        self.embedding_model = None
        self.mood_models = {}
        
        if ESSENTIA_AVAILABLE:
            self._init_essentia()
            self._load_ml_models()
    
    def _load_ml_models(self):
        """Load TensorFlow models for enhanced analysis"""
        try:
            from essentia.standard import (
                TensorflowPredictEffnetDiscogs,
                TensorflowPredict2D
            )
            
            # Load embedding extractor (base for all predictions)
            embedding_path = '/app/models/discogs-effnet-bs64-1.pb'
            if os.path.exists(embedding_path):
                self.embedding_model = TensorflowPredictEffnetDiscogs(
                    graphFilename=embedding_path,
                    output="PartitionedCall:1"
                )
                logger.info("Loaded embedding model")
            
            # Load mood prediction models
            mood_models = {
                'happy': '/app/models/mood_happy-discogs-effnet-1.pb',
                'sad': '/app/models/mood_sad-discogs-effnet-1.pb',
                'relaxed': '/app/models/mood_relaxed-discogs-effnet-1.pb',
                'aggressive': '/app/models/mood_aggressive-discogs-effnet-1.pb',
                'danceability': '/app/models/danceability-discogs-effnet-1.pb',
                'voice_instrumental': '/app/models/voice_instrumental-discogs-effnet-1.pb',
                'arousal': '/app/models/arousal-discogs-effnet-1.pb',
                'valence': '/app/models/valence-discogs-effnet-1.pb',
            }
            
            for name, path in mood_models.items():
                if os.path.exists(path):
                    self.mood_models[name] = TensorflowPredict2D(
                        graphFilename=path,
                        output="model/Softmax"
                    )
                    logger.info(f"Loaded {name} model")
            
            self.models_loaded = len(self.mood_models) > 0
            logger.info(f"ML models loaded: {self.models_loaded} ({len(self.mood_models)} models)")
            
        except Exception as e:
            logger.warning(f"Could not load ML models: {e}")
            self.models_loaded = False
    
    def analyze(self, file_path: str) -> Dict[str, Any]:
        """Full analysis with ML models if available"""
        result = self._extract_basic_features(file_path)
        
        if self.models_loaded:
            ml_features = self._extract_ml_features(file_path)
            result.update(ml_features)
            result['analysisMode'] = 'enhanced'
        else:
            # Fallback to estimated values
            result.update(self._estimate_mood_features(result))
            result['analysisMode'] = 'standard'
        
        return result
    
    def _extract_ml_features(self, file_path: str) -> Dict[str, Any]:
        """Extract features using TensorFlow models"""
        result = {}
        
        # Load audio at 16kHz for ML models
        audio = self.load_audio(file_path, sample_rate=16000)
        if audio is None:
            return result
        
        # Get embeddings
        embeddings = self.embedding_model(audio)
        
        # Mood predictions
        if 'happy' in self.mood_models:
            preds = self.mood_models['happy'](embeddings)
            result['moodHappy'] = float(np.mean(preds[:, 1]))  # Probability of "happy"
        
        if 'sad' in self.mood_models:
            preds = self.mood_models['sad'](embeddings)
            result['moodSad'] = float(np.mean(preds[:, 1]))
        
        if 'relaxed' in self.mood_models:
            preds = self.mood_models['relaxed'](embeddings)
            result['moodRelaxed'] = float(np.mean(preds[:, 1]))
        
        if 'aggressive' in self.mood_models:
            preds = self.mood_models['aggressive'](embeddings)
            result['moodAggressive'] = float(np.mean(preds[:, 1]))
        
        # Real valence and arousal from dedicated models
        if 'valence' in self.mood_models:
            preds = self.mood_models['valence'](embeddings)
            result['valence'] = float(np.mean(preds[:, 1]))
        
        if 'arousal' in self.mood_models:
            preds = self.mood_models['arousal'](embeddings)
            result['arousal'] = float(np.mean(preds[:, 1]))
        
        # Instrumentalness from voice/instrumental model
        if 'voice_instrumental' in self.mood_models:
            preds = self.mood_models['voice_instrumental'](embeddings)
            result['instrumentalness'] = float(np.mean(preds[:, 1]))  # 1 = instrumental
        
        # ML-based danceability
        if 'danceability' in self.mood_models:
            preds = self.mood_models['danceability'](embeddings)
            result['danceabilityMl'] = float(np.mean(preds[:, 1]))
        
        return result
```

### Phase 3: Update Database Schema (Day 3)

#### 3.1 Add New Feature Columns

```prisma
model Track {
  // ... existing fields ...
  
  // ML-based mood predictions (Enhanced mode)
  moodHappy       Float?  // ML prediction 0-1
  moodSad         Float?  // ML prediction 0-1
  moodRelaxed     Float?  // ML prediction 0-1
  moodAggressive  Float?  // ML prediction 0-1
  danceabilityMl  Float?  // ML-based danceability
  
  // Analysis metadata
  analysisMode    String? // 'standard' or 'enhanced'
}
```

### Phase 4: Update Vibe Matching Algorithm (Day 4)

#### 4.1 Use Real Mood Predictions in Matching

```typescript
// In library.ts - Enhanced vibe matching
const scored = analyzedTracks.map(t => {
    let score = 0;
    let factors = 0;
    
    // === MOOD MATCHING (50% total - the heart of vibe) ===
    
    // Happy mood (15%)
    if (sourceTrack.moodHappy !== null && t.moodHappy !== null) {
        score += (1 - Math.abs(sourceTrack.moodHappy - t.moodHappy)) * 0.15;
        factors += 0.15;
    }
    
    // Sad mood (10%)
    if (sourceTrack.moodSad !== null && t.moodSad !== null) {
        score += (1 - Math.abs(sourceTrack.moodSad - t.moodSad)) * 0.10;
        factors += 0.10;
    }
    
    // Relaxed mood (10%)
    if (sourceTrack.moodRelaxed !== null && t.moodRelaxed !== null) {
        score += (1 - Math.abs(sourceTrack.moodRelaxed - t.moodRelaxed)) * 0.10;
        factors += 0.10;
    }
    
    // Aggressive mood (10%)
    if (sourceTrack.moodAggressive !== null && t.moodAggressive !== null) {
        score += (1 - Math.abs(sourceTrack.moodAggressive - t.moodAggressive)) * 0.10;
        factors += 0.10;
    }
    
    // Valence - overall positivity (5%)
    if (sourceTrack.valence !== null && t.valence !== null) {
        score += (1 - Math.abs(sourceTrack.valence - t.valence)) * 0.05;
        factors += 0.05;
    }
    
    // === AUDIO CHARACTERISTICS (35% total) ===
    
    // BPM (15%) - within ±15 BPM is good
    if (sourceTrack.bpm && t.bpm) {
        const bpmDiff = Math.abs(sourceTrack.bpm - t.bpm);
        score += Math.max(0, 1 - bpmDiff / 30) * 0.15;
        factors += 0.15;
    }
    
    // Energy (10%)
    if (sourceTrack.energy !== null && t.energy !== null) {
        score += (1 - Math.abs(sourceTrack.energy - t.energy)) * 0.10;
        factors += 0.10;
    }
    
    // Danceability - prefer ML version (10%)
    const srcDance = sourceTrack.danceabilityMl ?? sourceTrack.danceability;
    const tDance = t.danceabilityMl ?? t.danceability;
    if (srcDance !== null && tDance !== null) {
        score += (1 - Math.abs(srcDance - tDance)) * 0.10;
        factors += 0.10;
    }
    
    // === GENRE/TAGS (15% total) ===
    
    // Genre/tag overlap (10%)
    const sourceGenres = [...(sourceTrack.lastfmTags || []), ...(sourceTrack.essentiaGenres || [])];
    const trackGenres = [...(t.lastfmTags || []), ...(t.essentiaGenres || [])];
    if (sourceGenres.length > 0 && trackGenres.length > 0) {
        const overlap = sourceGenres.filter(g => trackGenres.includes(g)).length;
        const maxOverlap = Math.max(sourceGenres.length, trackGenres.length);
        score += (overlap / maxOverlap) * 0.10;
        factors += 0.10;
    }
    
    // Key compatibility (5%)
    if (sourceTrack.keyScale && t.keyScale) {
        score += (sourceTrack.keyScale === t.keyScale ? 1 : 0.5) * 0.05;
        factors += 0.05;
    }
    
    const finalScore = factors > 0 ? score / factors : 0;
    return { id: t.id, score: finalScore };
});
```

### Phase 5: Create Standard Mode Fallback (Day 5)

After Enhanced mode is working, implement Standard mode:
- Same algorithm structure but skip ML features
- Use estimated valence (improved heuristics)
- Lower weights on mood matching since it's estimated
- Higher weights on BPM, energy, genre tags

### Phase 6: Settings & UI (Day 6)

#### 6.1 Add Settings Toggle

```typescript
// System settings - Enhanced is DEFAULT
{
  audioAnalysis: {
    vibeMatchingMode: 'enhanced' | 'standard',  // Default: 'enhanced'
    reanalyzeOnModeChange: boolean,  // Default: false
  }
}
```

#### 6.2 Settings UI

```
Audio Analysis
├── Vibe Matching Mode
│   ├── ● Enhanced (Recommended - Default)
│   │   └── Uses ML models for accurate mood detection
│   └── ○ Standard (Power Saver)
│       └── Faster, uses basic audio features only
│
├── Analysis Status
│   └── "1,234 / 1,500 tracks analyzed (Enhanced mode)"
│
└── [Re-analyze Library] button
    └── "Re-analyze all tracks with current settings"
```

### Phase 7: Testing & Validation (Day 7)

#### 7.1 Test Cases

| Source Track | Bad Match (Current) | Expected Good Match |
|--------------|---------------------|---------------------|
| "Fake Happy" (Paramore) | "Summer Girl" (Jamiroquai) 97% | Other emo/pop-punk <60% |
| "Creep" (Radiohead) | Fast dance track | Other melancholic rock |
| "Uptown Funk" | Slow ballad | Other high-energy funk/pop |

#### 7.2 Performance Testing
- Analyze 100 tracks, measure time
- Memory usage during analysis
- Queue handling under load

---

## Database Schema Updates

```prisma
model Track {
  // ... existing fields ...
  
  // ML-based mood predictions (Enhanced mode)
  moodHappy         Float?  // ML prediction 0-1
  moodSad           Float?  // ML prediction 0-1
  moodRelaxed       Float?  // ML prediction 0-1
  moodAggressive    Float?  // ML prediction 0-1
  danceabilityMl    Float?  // ML-based danceability
  
  // Analysis metadata
  analysisMode      String? // 'standard' or 'enhanced'
}
```

---

## Performance Benchmarks (Estimated)

| Operation | Standard Mode | Enhanced Mode |
|-----------|---------------|---------------|
| Analysis per track | 1-2 sec | 5-10 sec |
| RAM usage | ~100MB | ~500MB |
| Models in Docker | N/A | ~200MB (pre-packaged) |
| Vibe match query | <100ms | <100ms |
| Full library (1000 tracks) | ~30 min | ~2-3 hours |

---

## Files to Modify

| File | Changes |
|------|---------|
| `services/audio-analyzer/Dockerfile` | Add model downloads during build |
| `services/audio-analyzer/analyzer.py` | Implement ML model loading and prediction |
| `backend/prisma/schema.prisma` | Add mood prediction columns |
| `backend/src/routes/library.ts` | Update vibe matching algorithm weights |
| `frontend/features/settings/` | Add analysis mode toggle (default: enhanced) |
| `frontend/components/player/VibeGraph.tsx` | Display mood predictions |

---

## Success Metrics

After implementation, "Fake Happy" and "Summer Girl" should:
- Match at **<50%** (different emotional content, different genre)

Better matches for "Fake Happy" would be:
- Other Paramore songs (same artist = genre/production match)
- Emo/pop-punk with similar emotional complexity
- Songs with high energy but mixed emotional signals

---

## Implementation Order (Enhanced First)

### Week 1: Get Enhanced Mode Working
1. [x] Create implementation plan (this document)
2. [x] Update Dockerfile to pre-package ML models (~200MB)
3. [x] Rewrite analyzer.py with TensorFlow model loading
4. [x] Add new database columns for mood predictions (moodHappy, moodSad, etc.)
5. [x] Update vibe matching algorithm with ML mood weights
6. [x] Update programmatic playlists to use ML mood predictions
7. [ ] Run Prisma migration to apply schema changes
8. [ ] Rebuild audio-analyzer Docker container
9. [ ] Test ML analysis on sample tracks

### Week 2: Polish & Fallback
10. [ ] Test accuracy with diverse track pairs
11. [ ] Add settings UI (Enhanced = default)
12. [ ] Implement Standard mode as explicit fallback option
13. [ ] Update VibeGraph to show mood predictions
14. [ ] Documentation and testing

---

## Quick Reference: Models to Include

| Model | File | Purpose | Size |
|-------|------|---------|------|
| Embeddings | `discogs-effnet-bs64-1.pb` | Base model for all predictions | ~85MB |
| Happy | `mood_happy-discogs-effnet-1.pb` | Happiness detection | ~15MB |
| Sad | `mood_sad-discogs-effnet-1.pb` | Sadness detection | ~15MB |
| Relaxed | `mood_relaxed-discogs-effnet-1.pb` | Relaxation detection | ~15MB |
| Aggressive | `mood_aggressive-discogs-effnet-1.pb` | Aggression detection | ~15MB |
| Arousal | `mood_arousal-discogs-effnet-1.pb` | Energy/calm scale | ~15MB |
| Valence | `mood_valence-discogs-effnet-1.pb` | Positive/negative | ~15MB |
| Danceability | `danceability-discogs-effnet-1.pb` | ML danceability | ~15MB |
| Voice/Instrumental | `voice_instrumental-discogs-effnet-1.pb` | Vocal detection | ~15MB |

**Total:** ~200MB (one-time addition to Docker image)

