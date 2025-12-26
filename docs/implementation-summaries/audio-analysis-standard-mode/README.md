# Audio Analysis: Standard Mode (Heuristic Approach)

## Overview

The Lidify audio analyzer has two modes:
- **Enhanced Mode**: Uses TensorFlow ML models for accurate mood/valence/arousal predictions
- **Standard Mode**: Uses signal processing heuristics when ML models aren't available

This document covers the **Standard Mode** implementation for code review.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Container                              │
│  lidify_audio_analyzer                                          │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Redis     │◄───│  Worker     │───►│   PostgreSQL        │  │
│  │  Job Queue  │    │  Loop       │    │   Track Table       │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────────┘  │
│                            │                                     │
│                     ┌──────▼──────┐                             │
│                     │ AudioAnalyzer│                             │
│                     │   Class      │                             │
│                     └──────┬──────┘                             │
│                            │                                     │
│           ┌────────────────┼────────────────┐                   │
│           ▼                ▼                ▼                   │
│   ┌───────────────┐ ┌─────────────┐ ┌──────────────────┐       │
│   │ Basic Features│ │ Spectral    │ │ Heuristic        │       │
│   │ (BPM, Key)    │ │ Analysis    │ │ Mood Estimation  │       │
│   └───────────────┘ └─────────────┘ └──────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
services/audio-analyzer/
├── analyzer.py          # Main analyzer code (870 lines)
├── requirements.txt     # Python dependencies
└── Dockerfile          # Container build configuration
```

---

## Key Classes

### 1. `AudioAnalyzer` (Line 130-660)

Main analysis class with two modes:

```python
class AudioAnalyzer:
    def __init__(self):
        self.enhanced_mode = False  # Falls back to Standard if ML unavailable
        self._init_essentia()       # Initialize signal processing algorithms
        self._load_ml_models()      # Attempt to load ML models
```

### 2. `AnalysisWorker` (Line 663-847)

Redis queue worker that:
1. Polls for pending tracks from `audio:analysis:queue`
2. Falls back to scanning `Track` table for `analysisStatus = 'pending'`
3. Processes tracks and updates database

---

## Standard Mode: Heuristic Calculations

### Input Features (Always Extracted)

| Feature | Essentia Algorithm | Description |
|---------|-------------------|-------------|
| BPM | `RhythmExtractor2013` | Beats per minute |
| Key/Scale | `KeyExtractor` | Musical key (C, D#, etc.) and mode (major/minor) |
| Loudness | `Loudness` | Perceived loudness in dB |
| Dynamic Range | `DynamicComplexity` | Difference between quiet and loud parts |
| Danceability | `Danceability` | How suitable for dancing (0-1) |
| RMS Energy | `RMS` | Root Mean Square amplitude per frame |
| Spectral Centroid | `Centroid` | "Brightness" - center of spectral mass |
| Spectral Flatness | `FlatnessDB` | Noise-like vs tonal content |
| Zero-Crossing Rate | `ZeroCrossingRate` | Rate of signal sign changes |

### Frame-Based Processing (Lines 328-365)

```python
frame_size = 2048
hop_size = 1024

for i in range(0, len(audio_44k) - frame_size, hop_size):
    frame = audio_44k[i:i + frame_size]
    windowed = self.windowing(frame)
    spectrum = self.spectrum(windowed)
    
    rms_values.append(self.rms(frame))
    zcr_values.append(self.zcr(frame))
    spectral_centroid_values.append(self.spectral_centroid(spectrum))
    spectral_flatness_values.append(self.spectral_flatness(spectrum))
```

---

## Heuristic Formulas

### Energy (Line 347-353)

**Problem Solved**: Previous implementation used `es.Energy()` which returns sum of squared samples (huge number), normalized incorrectly as `energy / 100`.

**Current Implementation**:
```python
avg_rms = np.mean(rms_values)
energy = min(1.0, avg_rms * 3)  # RMS typically 0.0-0.5, scale to 0-1
```

---

### Valence (Happiness/Positivity) - Lines 495-518

**Formula**:
```
valence = key_valence * 0.40 
        + bpm_valence * 0.25 
        + brightness_valence * 0.20 
        + energy * 0.15
```

**Components**:

| Component | Weight | Calculation | Rationale |
|-----------|--------|-------------|-----------|
| Key Valence | 40% | Major = 0.65, Minor = 0.35 | Major keys sound happier |
| BPM Valence | 25% | Fast (≥120) → 0.8, Slow (≤80) → 0.2 | Fast tempo = upbeat |
| Brightness | 20% | `spectral_centroid * 1.5` | Bright sounds feel positive |
| Energy | 15% | RMS energy (0-1) | Loud = energetic/positive |

**Code**:
```python
# Key contribution
key_valence = 0.65 if scale == 'major' else 0.35

# BPM contribution
if bpm >= 120:
    bpm_valence = min(0.8, 0.5 + (bpm - 120) / 200)
elif bpm <= 80:
    bpm_valence = max(0.2, 0.5 - (80 - bpm) / 100)
else:
    bpm_valence = 0.5

# Brightness contribution
brightness_valence = min(1.0, spectral_centroid * 1.5)

# Final weighted sum
result['valence'] = round(
    key_valence * 0.4 + 
    bpm_valence * 0.25 + 
    brightness_valence * 0.2 + 
    energy * 0.15, 
    3
)
```

---

### Arousal (Energy/Intensity) - Lines 520-543

**Formula**:
```
arousal = bpm_arousal * 0.35 
        + energy_arousal * 0.35 
        + brightness_arousal * 0.15 
        + compression_arousal * 0.15
```

**Components**:

| Component | Weight | Calculation | Rationale |
|-----------|--------|-------------|-----------|
| BPM Arousal | 35% | `(bpm - 60) / 140` mapped to 0.1-0.9 | Fast = high energy |
| Energy | 35% | RMS energy (0-1) | Loud = intense |
| Brightness | 15% | `spectral_centroid * 1.2` | Bright = energetic |
| Compression | 15% | `1 - (dynamic_range / 20)` | Compressed = intense/modern |

**Code**:
```python
# BPM contribution (60-180 BPM → 0.1-0.9)
bpm_arousal = min(0.9, max(0.1, (bpm - 60) / 140))

# Energy is direct intensity indicator
energy_arousal = energy

# Low dynamic range = compressed = more intense
compression_arousal = max(0, min(1.0, 1 - (dynamic_range / 20)))

# Brightness adds perceived energy
brightness_arousal = min(1.0, spectral_centroid * 1.2)

result['arousal'] = round(
    bpm_arousal * 0.35 + 
    energy_arousal * 0.35 + 
    brightness_arousal * 0.15 + 
    compression_arousal * 0.15, 
    3
)
```

---

### Instrumentalness - Lines 545-563

**Approach**: Estimate likelihood of vocals vs instrumental based on spectral characteristics.

**Formula**:
```
instrumentalness = flatness_normalized * 0.6 + zcr_instrumental * 0.4
```

**Components**:

| Component | Weight | Calculation | Rationale |
|-----------|--------|-------------|-----------|
| Spectral Flatness | 60% | `(flatness + 40) / 40` | Noise-like (0dB) = instrumental; Tonal (-60dB) = vocals |
| ZCR Pattern | 40% | Low (<0.05) = 0.7; High (>0.15) = 0.4 | Sustained tones = instrumental |

**Code**:
```python
# Spectral flatness: -40dB to 0dB → 0 to 1
flatness_normalized = min(1.0, max(0, (spectral_flatness + 40) / 40))

# ZCR patterns
if zcr < 0.05:
    zcr_instrumental = 0.7   # Sustained instrumental tones
elif zcr > 0.15:
    zcr_instrumental = 0.4   # Could be speech or percussion
else:
    zcr_instrumental = 0.5   # Uncertain

result['instrumentalness'] = round(
    flatness_normalized * 0.6 + zcr_instrumental * 0.4,
    3
)
```

---

### Acousticness - Line 565-568

**Simple heuristic**: High dynamic range suggests acoustic recording (natural dynamics preserved).

```python
result['acousticness'] = round(min(1.0, dynamic_range / 12), 3)
```

| Dynamic Range | Acousticness | Interpretation |
|---------------|--------------|----------------|
| < 6 dB | < 0.5 | Heavily compressed (electronic/pop) |
| 6-12 dB | 0.5-1.0 | Moderate (mixed) |
| > 12 dB | 1.0 | High dynamic range (acoustic/classical) |

---

### Speechiness - Lines 570-575

**Approach**: Speech has characteristic ZCR + spectral centroid patterns.

```python
if zcr > 0.08 and zcr < 0.2 and spectral_centroid > 0.1 and spectral_centroid < 0.4:
    result['speechiness'] = round(min(0.5, zcr * 3), 3)
else:
    result['speechiness'] = 0.1
```

| Condition | Result |
|-----------|--------|
| ZCR 0.08-0.2 AND centroid 0.1-0.4 | Speech-like (up to 0.5) |
| Outside range | Low speechiness (0.1) |

---

## Mood Tag Generation (Lines 581-660)

Tags are derived from computed features:

| Condition | Tags Added |
|-----------|------------|
| `arousal >= 0.7` | energetic, upbeat |
| `arousal <= 0.3` | calm, peaceful |
| `valence >= 0.7` | happy, uplifting |
| `valence <= 0.3` | sad, melancholic |
| `danceability >= 0.7` | dance, groovy |
| `bpm >= 140` | fast |
| `bpm <= 80` | slow |
| `keyScale == 'minor'` (and not happy) | moody |
| `arousal >= 0.7 AND bpm >= 120` | workout |
| `arousal <= 0.4 AND valence <= 0.4` | atmospheric |
| `arousal <= 0.3 AND bpm <= 90` | chill |

---

## Output Schema

```typescript
interface AnalysisResult {
  // Basic features
  bpm: number;              // 60-200 typical
  beatsCount: number;       // Total beat count
  key: string;              // "C", "D#", etc.
  keyScale: string;         // "major" or "minor"
  keyStrength: number;      // 0-1 confidence
  
  // Energy metrics
  energy: number;           // 0-1 (RMS-based)
  loudness: number;         // dB
  dynamicRange: number;     // dB
  
  // Heuristic estimates
  danceability: number;     // 0-1
  valence: number;          // 0-1 (happiness)
  arousal: number;          // 0-1 (energy)
  instrumentalness: number; // 0-1
  acousticness: number;     // 0-1
  speechiness: number;      // 0-1
  
  // Derived
  moodTags: string[];       // ["calm", "peaceful", "chill"]
  analysisMode: "standard"; // Always "standard" for this mode
}
```

---

## Database Update (Lines 766-822)

All features are persisted to the `Track` table:

```sql
UPDATE "Track"
SET
    bpm = %s,
    "beatsCount" = %s,
    key = %s,
    "keyScale" = %s,
    "keyStrength" = %s,
    energy = %s,
    loudness = %s,
    "dynamicRange" = %s,
    danceability = %s,
    valence = %s,
    arousal = %s,
    instrumentalness = %s,
    acousticness = %s,
    speechiness = %s,
    "moodTags" = %s,
    "analysisMode" = 'standard',
    "analysisStatus" = 'completed',
    "analysisVersion" = %s,
    "analyzedAt" = %s
WHERE id = %s
```

---

## Known Limitations

### Standard Mode vs ML Models

| Aspect | Standard Mode | Enhanced Mode (ML) |
|--------|--------------|-------------------|
| Valence accuracy | ~60% correlation | ~85% correlation |
| Arousal accuracy | ~65% correlation | ~88% correlation |
| Mood detection | Rule-based | Neural network |
| Processing speed | Fast (~1-2 sec) | Slower (~5-10 sec) |
| Dependencies | Essentia only | Essentia + TensorFlow |

### Edge Cases

1. **Ambient music**: Low BPM detection reliability
2. **Classical**: Variable tempo causes BPM averaging issues
3. **Spoken word**: May be misclassified as low-energy music
4. **Electronic/EDM**: Compression detection may overestimate arousal

---

## Dependencies

```
# requirements.txt
essentia==2.1b6.dev1110
essentia-tensorflow==2.1b6.dev1110
numpy>=1.21.0,<2.0.0
tensorflow==2.15.0
redis>=4.5.0
psycopg2-binary>=2.9.0
```

---

## Testing

Run single file analysis:
```bash
docker exec lidify_audio_analyzer python3 analyzer.py --test /music/path/to/song.mp3
```

Example output:
```json
{
  "bpm": 128.5,
  "beatsCount": 256,
  "key": "C",
  "keyScale": "minor",
  "keyStrength": 0.723,
  "energy": 0.65,
  "loudness": -8.2,
  "dynamicRange": 7.5,
  "danceability": 0.72,
  "valence": 0.42,
  "arousal": 0.68,
  "instrumentalness": 0.35,
  "acousticness": 0.625,
  "speechiness": 0.1,
  "moodTags": ["energetic", "upbeat", "moody", "dance"],
  "analysisMode": "standard"
}
```

---

## Related Files

- `services/audio-analyzer/Dockerfile` - Container build
- `backend/src/services/vibeMatching.ts` - Uses these features for song matching
- `prisma/schema.prisma` - Track table schema with analysis columns



