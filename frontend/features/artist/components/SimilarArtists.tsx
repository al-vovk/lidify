"use client";

import Image from "next/image";
import { SimilarArtist } from "../types";
import { Music } from "lucide-react";
import { api } from "@/lib/api";

interface SimilarArtistsProps {
    similarArtists: SimilarArtist[];
    onNavigate: (artistId: string) => void;
}

export function SimilarArtists({
    similarArtists,
    onNavigate,
}: SimilarArtistsProps) {
    if (!similarArtists || similarArtists.length === 0) {
        return null;
    }

    return (
        <section>
            <h2 className="text-xl font-bold mb-4">
                Fans Also Like
            </h2>
            <div data-tv-section="similar-artists" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {similarArtists.map((artist, index) => {
                    const rawImage = artist.coverArt || artist.image;
                    const imageUrl = rawImage
                        ? api.getCoverArtUrl(rawImage, 300)
                        : null;
                    const matchPercentage = artist.weight
                        ? Math.round(artist.weight * 100)
                        : null;

                    return (
                        <div
                            key={artist.id || artist.name}
                            data-tv-card
                            data-tv-card-index={index}
                            tabIndex={0}
                            onClick={() => onNavigate(artist.mbid || artist.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onNavigate(artist.mbid || artist.id);
                                }
                            }}
                            className="bg-transparent hover:bg-white/5 transition-all p-3 rounded-md cursor-pointer group"
                        >
                            {/* Circular Artist Image */}
                            <div className="w-full aspect-square bg-[#282828] rounded-full mb-2.5 overflow-hidden relative shadow-lg">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={artist.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                        className="object-cover group-hover:scale-105 transition-transform"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Music className="w-12 h-12 text-gray-600" />
                                    </div>
                                )}
                            </div>

                            {/* Artist Name */}
                            <h3 className="text-sm font-semibold text-white truncate mb-0.5">
                                {artist.name}
                            </h3>

                            {/* Album Count */}
                            <p className="text-xs text-gray-400 truncate">
                                {artist.ownedAlbumCount &&
                                artist.ownedAlbumCount > 0
                                    ? `${artist.ownedAlbumCount}/${artist.albumCount} albums`
                                    : artist.albumCount && artist.albumCount > 0
                                    ? `${artist.albumCount} albums`
                                    : "Artist"}
                            </p>

                            {/* Match Percentage */}
                            {matchPercentage !== null && (
                                <p className="text-xs text-[#ecb200] mt-1">
                                    {matchPercentage}% match
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
