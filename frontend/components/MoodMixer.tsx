"use client";

import { useState, useEffect } from "react";
import { api, MoodPreset, MoodMixParams } from "@/lib/api";
import { useAudioControls } from "@/lib/audio-controls-context";
import { Track } from "@/lib/audio-state-context";
import { Play, Loader2, AudioWaveform, Sliders, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface MoodMixerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MoodMixer({ isOpen, onClose }: MoodMixerProps) {
    const { playTracks } = useAudioControls();
    const [presets, setPresets] = useState<MoodPreset[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [showCustom, setShowCustom] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Custom sliders state - basic audio features
    const [customParams, setCustomParams] = useState<{
        valence: [number, number];
        energy: [number, number];
        danceability: [number, number];
        bpm: [number, number];
    }>({
        valence: [0, 100],
        energy: [0, 100],
        danceability: [0, 100],
        bpm: [60, 180],
    });

    // ML mood sliders state (Advanced mode)
    const [mlMoods, setMlMoods] = useState<{
        moodHappy: [number, number];
        moodSad: [number, number];
        moodRelaxed: [number, number];
        moodAggressive: [number, number];
        moodParty: [number, number];
        moodAcoustic: [number, number];
        moodElectronic: [number, number];
    }>({
        moodHappy: [0, 100],
        moodSad: [0, 100],
        moodRelaxed: [0, 100],
        moodAggressive: [0, 100],
        moodParty: [0, 100],
        moodAcoustic: [0, 100],
        moodElectronic: [0, 100],
    });

    // Handle visibility animation
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            loadPresets();
        } else {
            // Delay hiding to allow exit animation
            const timeout = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    const loadPresets = async () => {
        try {
            const data = await api.getMoodPresets();
            setPresets(data);
        } catch (error) {
            console.error("Failed to load mood presets:", error);
            toast.error("Failed to load mood presets");
        } finally {
            setLoading(false);
        }
    };

    const generateMix = async (preset: MoodPreset) => {
        setGenerating(preset.id);
        try {
            const mix = await api.generateMoodMix({
                ...preset.params,
                limit: 15,
            });

            if (mix.tracks && mix.tracks.length > 0) {
                const tracks: Track[] = mix.tracks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    artist: {
                        name: t.album?.artist?.name || "Unknown Artist",
                        id: t.album?.artist?.id,
                    },
                    album: {
                        title: t.album?.title || "Unknown Album",
                        coverArt: t.album?.coverUrl,
                        id: t.albumId,
                    },
                    duration: t.duration,
                }));

                playTracks(tracks, 0);
                toast.success(`Your ${preset.name} Mix`, {
                    description: `Playing ${tracks.length} tracks`,
                });

                // Save these params as user's mood mix preferences (include preset name for mix title)
                try {
                    await api.post('/mixes/mood/save-preferences', {
                        ...preset.params,
                        limit: 15,
                        presetName: preset.name
                    });
                } catch (err) {
                    console.error("Failed to save mood preferences:", err);
                }

                // Notify other components to refresh mixes
                window.dispatchEvent(new CustomEvent("mix-generated"));
                window.dispatchEvent(new CustomEvent("mixes-updated"));
                onClose();
            } else {
                toast.error("Not enough matching tracks", {
                    description:
                        "Try a different mood or wait for more analysis",
                });
            }
        } catch (error: any) {
            console.error("Failed to generate mood mix:", error);
            toast.error(error?.error || "Failed to generate mix");
        } finally {
            setGenerating(null);
        }
    };

    const generateCustomMix = async () => {
        setGenerating("custom");
        try {
            const params: MoodMixParams = {
                valence: {
                    min: customParams.valence[0] / 100,
                    max: customParams.valence[1] / 100,
                },
                energy: {
                    min: customParams.energy[0] / 100,
                    max: customParams.energy[1] / 100,
                },
                danceability: {
                    min: customParams.danceability[0] / 100,
                    max: customParams.danceability[1] / 100,
                },
                bpm: { min: customParams.bpm[0], max: customParams.bpm[1] },
                limit: 15,
            };

            // Add ML mood params if advanced mode is enabled
            if (showAdvanced) {
                params.moodHappy = {
                    min: mlMoods.moodHappy[0] / 100,
                    max: mlMoods.moodHappy[1] / 100,
                };
                params.moodSad = {
                    min: mlMoods.moodSad[0] / 100,
                    max: mlMoods.moodSad[1] / 100,
                };
                params.moodRelaxed = {
                    min: mlMoods.moodRelaxed[0] / 100,
                    max: mlMoods.moodRelaxed[1] / 100,
                };
                params.moodAggressive = {
                    min: mlMoods.moodAggressive[0] / 100,
                    max: mlMoods.moodAggressive[1] / 100,
                };
                params.moodParty = {
                    min: mlMoods.moodParty[0] / 100,
                    max: mlMoods.moodParty[1] / 100,
                };
                params.moodAcoustic = {
                    min: mlMoods.moodAcoustic[0] / 100,
                    max: mlMoods.moodAcoustic[1] / 100,
                };
                params.moodElectronic = {
                    min: mlMoods.moodElectronic[0] / 100,
                    max: mlMoods.moodElectronic[1] / 100,
                };
            }

            const mix = await api.generateMoodMix(params);

            if (mix.tracks && mix.tracks.length > 0) {
                const tracks: Track[] = mix.tracks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    artist: {
                        name: t.album?.artist?.name || "Unknown Artist",
                        id: t.album?.artist?.id,
                    },
                    album: {
                        title: t.album?.title || "Unknown Album",
                        coverArt: t.album?.coverUrl,
                        id: t.albumId,
                    },
                    duration: t.duration,
                }));

                playTracks(tracks, 0);
                toast.success("Your Custom Mix", {
                    description: `Playing ${tracks.length} tracks`,
                });

                // Save these params as user's mood mix preferences
                try {
                    await api.post('/mixes/mood/save-preferences', {
                        ...params,
                        presetName: "Custom"
                    });
                } catch (err) {
                    console.error("Failed to save mood preferences:", err);
                }

                // Notify other components to refresh mixes
                window.dispatchEvent(new CustomEvent("mix-generated"));
                window.dispatchEvent(new CustomEvent("mixes-updated"));
                onClose();
            } else {
                toast.error("Not enough matching tracks", {
                    description: "Try widening your parameters",
                });
            }
        } catch (error: any) {
            console.error("Failed to generate custom mix:", error);
            toast.error(error?.error || "Failed to generate mix");
        } finally {
            setGenerating(null);
        }
    };

    if (!isVisible && !isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 bg-black/80  flex items-center justify-center p-4 transition-opacity duration-200 ${
                isOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
        >
            <div
                className={`bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/10 shadow-2xl transition-all duration-200 ${
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ecb200] to-amber-600 flex items-center justify-center">
                            <AudioWaveform className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Mood Mixer
                            </h2>
                            <p className="text-sm text-gray-400">
                                Generate a mix based on your vibe
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#ecb200]" />
                        </div>
                    ) : (
                        <>
                            {/* Toggle between presets and custom */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setShowCustom(false)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                                        !showCustom
                                            ? "bg-[#ecb200] text-black"
                                            : "bg-white/5 text-white/70 hover:bg-white/10"
                                    }`}
                                >
                                    <AudioWaveform className="w-4 h-4 inline-block mr-2" />
                                    Quick Moods
                                </button>
                                <button
                                    onClick={() => setShowCustom(true)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                                        showCustom
                                            ? "bg-[#ecb200] text-black"
                                            : "bg-white/5 text-white/70 hover:bg-white/10"
                                    }`}
                                >
                                    <Sliders className="w-4 h-4 inline-block mr-2" />
                                    Custom Mix
                                </button>
                            </div>

                            {!showCustom ? (
                                /* Preset Grid */
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => generateMix(preset)}
                                            disabled={generating !== null}
                                            className={`
                                                relative group p-4 rounded-xl overflow-hidden
                                                bg-gradient-to-br ${preset.color}
                                                border border-white/10 hover:border-white/20
                                                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                text-left
                                            `}
                                        >
                                            <div className="relative z-10 flex flex-col justify-end h-full">
                                                <h3 className="font-semibold text-white text-sm">
                                                    {preset.name}
                                                </h3>
                                            </div>

                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                {generating === preset.id ? (
                                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-[#ecb200] flex items-center justify-center shadow-lg">
                                                        <Play
                                                            className="w-6 h-6 text-black ml-0.5"
                                                            fill="currentColor"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                /* Custom Sliders */
                                <div className="space-y-6">
                                    <SliderControl
                                        label="Happiness"
                                        value={customParams.valence}
                                        onChange={(v) =>
                                            setCustomParams((p) => ({
                                                ...p,
                                                valence: v,
                                            }))
                                        }
                                        min={0}
                                        max={100}
                                        lowLabel="Sad"
                                        highLabel="Happy"
                                    />
                                    <SliderControl
                                        label="Energy"
                                        value={customParams.energy}
                                        onChange={(v) =>
                                            setCustomParams((p) => ({
                                                ...p,
                                                energy: v,
                                            }))
                                        }
                                        min={0}
                                        max={100}
                                        lowLabel="Calm"
                                        highLabel="Energetic"
                                    />
                                    <SliderControl
                                        label="Danceability"
                                        value={customParams.danceability}
                                        onChange={(v) =>
                                            setCustomParams((p) => ({
                                                ...p,
                                                danceability: v,
                                            }))
                                        }
                                        min={0}
                                        max={100}
                                        lowLabel="Static"
                                        highLabel="Groovy"
                                    />
                                    <SliderControl
                                        label="Tempo (BPM)"
                                        value={customParams.bpm}
                                        onChange={(v) =>
                                            setCustomParams((p) => ({
                                                ...p,
                                                bpm: v,
                                            }))
                                        }
                                        min={60}
                                        max={180}
                                        lowLabel="Slow"
                                        highLabel="Fast"
                                        showValues
                                    />

                                    {/* Advanced Mode Toggle */}
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-sm text-white/70"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Sliders className="w-4 h-4" />
                                            ML Mood Controls
                                        </span>
                                        {showAdvanced ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>

                                    {/* ML Mood Sliders (Advanced Mode) */}
                                    {showAdvanced && (
                                        <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                            <p className="text-xs text-gray-400 mb-2">
                                                Fine-tune using ML-detected mood predictions
                                            </p>
                                            <SliderControl
                                                label="Happy"
                                                value={mlMoods.moodHappy}
                                                onChange={(v) =>
                                                    setMlMoods((p) => ({ ...p, moodHappy: v }))
                                                }
                                                min={0}
                                                max={100}
                                                lowLabel="Low"
                                                highLabel="High"
                                            />
                                            <SliderControl
                                                label="Sad"
                                                value={mlMoods.moodSad}
                                                onChange={(v) =>
                                                    setMlMoods((p) => ({ ...p, moodSad: v }))
                                                }
                                                min={0}
                                                max={100}
                                                lowLabel="Low"
                                                highLabel="High"
                                            />
                                            <SliderControl
                                                label="Relaxed"
                                                value={mlMoods.moodRelaxed}
                                                onChange={(v) =>
                                                    setMlMoods((p) => ({ ...p, moodRelaxed: v }))
                                                }
                                                min={0}
                                                max={100}
                                                lowLabel="Low"
                                                highLabel="High"
                                            />
                                            <SliderControl
                                                label="Aggressive"
                                                value={mlMoods.moodAggressive}
                                                onChange={(v) =>
                                                    setMlMoods((p) => ({ ...p, moodAggressive: v }))
                                                }
                                                min={0}
                                                max={100}
                                                lowLabel="Low"
                                                highLabel="High"
                                            />
                                            <SliderControl
                                                label="Party"
                                                value={mlMoods.moodParty}
                                                onChange={(v) =>
                                                    setMlMoods((p) => ({ ...p, moodParty: v }))
                                                }
                                                min={0}
                                                max={100}
                                                lowLabel="Low"
                                                highLabel="High"
                                            />
                                            <SliderControl
                                                label="Acoustic"
                                                value={mlMoods.moodAcoustic}
                                                onChange={(v) =>
                                                    setMlMoods((p) => ({ ...p, moodAcoustic: v }))
                                                }
                                                min={0}
                                                max={100}
                                                lowLabel="Low"
                                                highLabel="High"
                                            />
                                            <SliderControl
                                                label="Electronic"
                                                value={mlMoods.moodElectronic}
                                                onChange={(v) =>
                                                    setMlMoods((p) => ({ ...p, moodElectronic: v }))
                                                }
                                                min={0}
                                                max={100}
                                                lowLabel="Low"
                                                highLabel="High"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={generateCustomMix}
                                        disabled={generating !== null}
                                        className="w-full py-3 px-4 rounded-lg bg-[#ecb200] text-black font-semibold hover:bg-[#d4a000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {generating === "custom" ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Play
                                                    className="w-5 h-5"
                                                    fill="currentColor"
                                                />
                                                Generate Mix
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface SliderControlProps {
    label: string;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    min: number;
    max: number;
    lowLabel: string;
    highLabel: string;
    showValues?: boolean;
}

function SliderControl({
    label,
    value,
    onChange,
    min,
    max,
    lowLabel,
    highLabel,
    showValues,
}: SliderControlProps) {
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), value[1] - 1);
        onChange([newMin, value[1]]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), value[0] + 1);
        onChange([value[0], newMax]);
    };

    const percentage = ((value[0] - min) / (max - min)) * 100;
    const width = ((value[1] - value[0]) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{label}</span>
                {showValues && (
                    <span className="text-xs text-gray-400">
                        {value[0]} - {value[1]}
                    </span>
                )}
            </div>

            <div className="relative h-2">
                {/* Track background - pointer-events-none so inputs receive clicks */}
                <div className="absolute inset-0 bg-white/10 rounded-full pointer-events-none" />

                {/* Active range - pointer-events-none so inputs receive clicks */}
                <div
                    className="absolute h-full bg-gradient-to-r from-[#ecb200] to-amber-500 rounded-full pointer-events-none"
                    style={{ left: `${percentage}%`, width: `${width}%` }}
                />

                {/* Min slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value[0]}
                    onChange={handleMinChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    style={{ pointerEvents: "auto" }}
                />

                {/* Max slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value[1]}
                    onChange={handleMaxChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                    style={{ pointerEvents: "auto" }}
                />

                {/* Thumb indicators */}
                <div
                    className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/4 pointer-events-none border-2 border-[#ecb200]"
                    style={{ left: `calc(${percentage}% - 8px)` }}
                />
                <div
                    className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/4 pointer-events-none border-2 border-[#ecb200]"
                    style={{ left: `calc(${percentage + width}% - 8px)` }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
                <span>{lowLabel}</span>
                <span>{highLabel}</span>
            </div>
        </div>
    );
}
