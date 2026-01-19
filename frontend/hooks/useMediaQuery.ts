import { useState, useEffect, useSyncExternalStore } from "react";

/**
 * Hook to check if a media query matches
 * Uses useSyncExternalStore for hydration-safe initial state
 */
export function useMediaQuery(query: string): boolean {
    // Use useSyncExternalStore for hydration-safe media query detection
    // This prevents the flash caused by useState(false) -> useEffect(true) pattern
    const matches = useSyncExternalStore(
        // Subscribe function
        (callback) => {
            if (typeof window === "undefined") return () => {};
            const media = window.matchMedia(query);
            media.addEventListener("change", callback);
            return () => media.removeEventListener("change", callback);
        },
        // Get client snapshot
        () => {
            if (typeof window === "undefined") return false;
            return window.matchMedia(query).matches;
        },
        // Get server snapshot (always false on server)
        () => false
    );

    return matches;
}

/**
 * Legacy implementation for reference - causes hydration flash
 * @deprecated Use the useSyncExternalStore version above
 */
export function useMediaQueryLegacy(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        // Create listener
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

        // Add listener
        if (media.addEventListener) {
            media.addEventListener("change", listener);
        } else {
            // Fallback for older browsers
            media.addListener(listener);
        }

        // Cleanup
        return () => {
            if (media.removeEventListener) {
                media.removeEventListener("change", listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [query]);

    return matches;
}

// Common breakpoints
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTablet = () => useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)");
export const useIsTV = () => useMediaQuery("(min-width: 1920px)");
export const useIsLargeTV = () => useMediaQuery("(min-width: 2560px)");
