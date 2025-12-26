# Audio Analysis - Enhanced Mode (MusiCNN)

## Overview

Enhanced mode uses Essentia's TensorFlow integration with MusiCNN (Music Convolutional Neural Network) models to perform ML-based mood and audio classification. This provides significantly more accurate mood detection compared to the heuristic-based Standard mode.

## Architecture

```
                    ┌─────────────────┐
                    │  Audio File     │
                    │   (16kHz mono)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ TensorflowPredict│
                    │    MusiCNN      │
                    │  (Embeddings)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐
    │  Mood Happy   │ │  Mood Sad  │ │ Danceability│
    │ TensorFlow    │ │ TensorFlow │ │ TensorFlow  │
    │ Predict2D     │ │ Predict2D  │ │ Predict2D   │
    └───────┬───────┘ └─────┬──────┘ └──────┬──────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                    ┌───────▼───────┐
                    │ Derived Scores│
                    │ Valence/Arousal│
                    └───────────────┘
```

## Key Components

### 1. Base Model: MusiCNN

- **Model**: `msd-musicnn-1.pb` (~3MB)
- **Source**: [Essentia Model Zoo](https://essentia.upf.edu/models/autotagging/msd/)
- **Function**: Extracts 200-dimensional embeddings from audio
- **Algorithm**: `TensorflowPredictMusiCNN`

### 2. Classification Heads

Each classification head takes the MusiCNN embeddings and outputs probabilities:

| Model | File | Output |
|-------|------|--------|
| Mood Happy | `mood_happy-msd-musicnn-1.pb` | P(happy) |
| Mood Sad | `mood_sad-msd-musicnn-1.pb` | P(sad) |
| Mood Relaxed | `mood_relaxed-msd-musicnn-1.pb` | P(relaxed) |
| Mood Aggressive | `mood_aggressive-msd-musicnn-1.pb` | P(aggressive) |
| Mood Party | `mood_party-msd-musicnn-1.pb` | P(party) |
| Mood Acoustic | `mood_acoustic-msd-musicnn-1.pb` | P(acoustic) |
| Mood Electronic | `mood_electronic-msd-musicnn-1.pb` | P(electronic) |
| Danceability | `danceability-msd-musicnn-1.pb` | P(danceable) |
| Voice/Instrumental | `voice_instrumental-msd-musicnn-1.pb` | P(instrumental) |

### 3. Derived Features

Valence and Arousal are derived from the mood predictions:

```python
# Valence = emotional positivity
valence = happy * 0.5 + party * 0.3 + (1 - sad) * 0.2

# Arousal = energy level
arousal = aggressive * 0.35 + party * 0.25 + electronic * 0.2 
        + (1 - relaxed) * 0.1 + (1 - acoustic) * 0.1
```

## Docker Configuration

### Dockerfile

```dockerfile
FROM ubuntu:20.04

# Install essentia-tensorflow (includes TensorFlow + MusiCNN support)
RUN pip3 install --no-cache-dir essentia-tensorflow

# Download MusiCNN models
RUN curl -L -o /app/models/msd-musicnn-1.pb \
    "https://essentia.upf.edu/models/autotagging/msd/msd-musicnn-1.pb"

# Classification heads
RUN curl -L -o /app/models/mood_happy-msd-musicnn-1.pb \
    "https://essentia.upf.edu/models/classification-heads/mood_happy/mood_happy-msd-musicnn-1.pb"
# ... (other models)
```

### Requirements

- **Ubuntu 20.04** (for Python 3.8 compatibility)
- **essentia-tensorflow** pip package
- **~10MB** for all models combined

## Usage in Code

```python
from essentia.standard import TensorflowPredictMusiCNN, TensorflowPredict2D

# Load base embedding model
musicnn = TensorflowPredictMusiCNN(
    graphFilename='/app/models/msd-musicnn-1.pb',
    output="model/dense/BiasAdd"  # Embedding output layer
)

# Load classification head
mood_happy = TensorflowPredict2D(
    graphFilename='/app/models/mood_happy-msd-musicnn-1.pb',
    output="model/Softmax"
)

# Process audio
audio = es.MonoLoader(filename=path, sampleRate=16000)()
embeddings = musicnn(audio)  # Shape: [frames, 200]
predictions = mood_happy(embeddings)  # Shape: [frames, 2]
happy_score = float(np.mean(predictions[:, 1]))  # Average over frames
```

## Output Fields

Enhanced mode produces these additional fields:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| moodHappy | float | 0-1 | ML probability of happy mood |
| moodSad | float | 0-1 | ML probability of sad mood |
| moodRelaxed | float | 0-1 | ML probability of relaxed mood |
| moodAggressive | float | 0-1 | ML probability of aggressive mood |
| moodParty | float | 0-1 | ML probability of party mood |
| moodAcoustic | float | 0-1 | ML probability of acoustic sound |
| moodElectronic | float | 0-1 | ML probability of electronic sound |
| danceabilityMl | float | 0-1 | ML danceability score |
| valence | float | 0-1 | Derived emotional positivity |
| arousal | float | 0-1 | Derived energy level |
| acousticness | float | 0-1 | From moodAcoustic |
| instrumentalness | float | 0-1 | ML voice/instrumental detection |

## Comparison: Standard vs Enhanced

| Feature | Standard Mode | Enhanced Mode |
|---------|---------------|---------------|
| Mood Detection | Heuristic (key/BPM/energy) | ML (MusiCNN) |
| Accuracy | Approximate | Research-grade |
| Speed | Fast (~100ms) | Moderate (~500ms) |
| Dependencies | Essentia core | Essentia + TensorFlow |
| Model Size | 0 | ~10MB |
| Python Version | Any | 3.7-3.9 (for pip) |

## Fallback Behavior

If Enhanced mode fails to initialize (missing models, TensorFlow errors), the analyzer automatically falls back to Standard mode:

```python
if self.enhanced_mode and self.musicnn_model:
    ml_features = self._extract_ml_features(audio_16k)
    result.update(ml_features)
else:
    self._apply_standard_estimates(result, scale, bpm)
```

## References

- [Essentia TensorFlow Documentation](https://essentia.upf.edu/machine_learning.html)
- [MusiCNN Paper](https://arxiv.org/abs/1711.02520)
- [Essentia Model Zoo](https://essentia.upf.edu/models/)



