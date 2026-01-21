import { useSearchQuery, useDiscoverSearchQuery } from "@/hooks/useQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SearchResult, DiscoverResult } from "../types";
import { useMemo } from "react";

interface UseSearchDataProps {
    query: string;
}

interface UseSearchDataReturn {
    libraryResults: SearchResult | null;
    discoverResults: DiscoverResult[];
    isLibrarySearching: boolean;
    isDiscoverSearching: boolean;
    hasSearched: boolean;
}

export function useSearchData({ query }: UseSearchDataProps): UseSearchDataReturn {
    // Debounce query to prevent excessive API calls during typing
    const debouncedQuery = useDebouncedValue(query, 250);

    const {
        data: libraryResults,
        isLoading: isLibrarySearching,
        isFetching: isLibraryFetching
    } = useSearchQuery(debouncedQuery, "all", 20);

    const {
        data: discoverData,
        isLoading: isDiscoverSearching,
        isFetching: isDiscoverFetching
    } = useDiscoverSearchQuery(debouncedQuery, "all", 20);

    // Extract discover results
    const discoverResults = useMemo(() => {
        return discoverData?.results || [];
    }, [discoverData]);

    // Track if user has searched (use original query for immediate UI feedback)
    const hasSearched = query.trim().length >= 2;

    return {
        libraryResults: libraryResults || null,
        discoverResults,
        isLibrarySearching: isLibrarySearching || isLibraryFetching,
        isDiscoverSearching: isDiscoverSearching || isDiscoverFetching,
        hasSearched,
    };
}
