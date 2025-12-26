"use client";

import { SettingsSection, SettingsRow, SettingsSelect } from "../ui";
import { SystemSettings } from "../../types";

interface DownloadPreferencesSectionProps {
    settings: SystemSettings;
    onUpdate: (updates: Partial<SystemSettings>) => void;
}

export function DownloadPreferencesSection({
    settings,
    onUpdate,
}: DownloadPreferencesSectionProps) {
    return (
        <SettingsSection
            id="download-preferences"
            title="Download Preferences"
            description="Configure how music is downloaded for playlists and discovery"
        >
            <SettingsRow
                label="Primary Download Source"
                description="Choose how to download music for imported playlists"
            >
                <SettingsSelect
                    value={settings.downloadSource || "soulseek"}
                    onChange={(v) =>
                        onUpdate({ downloadSource: v as "soulseek" | "lidarr" })
                    }
                    options={[
                        { value: "soulseek", label: "Soulseek (Per-track)" },
                        { value: "lidarr", label: "Lidarr (Full albums)" },
                    ]}
                />
            </SettingsRow>

            {settings.downloadSource === "soulseek" && (
                <SettingsRow
                    label="When Soulseek Fails"
                    description="What to do if a track can't be found on Soulseek"
                >
                    <SettingsSelect
                        value={settings.soulseekFallback || "none"}
                        onChange={(v) =>
                            onUpdate({
                                soulseekFallback: v as "none" | "lidarr",
                            })
                        }
                        options={[
                            { value: "none", label: "Skip track" },
                            {
                                value: "lidarr",
                                label: "Download full album via Lidarr",
                            },
                        ]}
                    />
                </SettingsRow>
            )}
        </SettingsSection>
    );
}
