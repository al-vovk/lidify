import { useState, useEffect } from "react";

/**
 * Debounce a value by the specified delay.
 * Returns the debounced value which updates after the delay has passed
 * without the input value changing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 250ms)
 * @returns The debounced value
 *
 * @example
 * const debouncedQuery = useDebouncedValue(query, 250);
 * // debouncedQuery updates 250ms after query stops changing
 */
export function useDebouncedValue<T>(value: T, delay: number = 250): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
