/**
 * Debug hook to log component renders and their causes
 * Usage: useRenderLogger('ComponentName', { prop1, prop2, state1 });
 */

import { useRef, useEffect } from 'react';

export function useRenderLogger(
    componentName: string,
    props: Record<string, unknown> = {},
    enabled = true
) {
    const renderCount = useRef(0);
    const prevProps = useRef<Record<string, unknown>>({});
    const lastRenderTime = useRef(performance.now());

    useEffect(() => {
        if (!enabled) return;

        renderCount.current++;
        const now = performance.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        // Find which props changed
        const changedProps: string[] = [];
        for (const key of Object.keys(props)) {
            if (prevProps.current[key] !== props[key]) {
                changedProps.push(key);
            }
        }
        prevProps.current = { ...props };

        // Log with timing info
        const style = timeSinceLastRender < 100
            ? 'color: red; font-weight: bold'
            : 'color: gray';

        console.log(
            `%c[RENDER] ${componentName} #${renderCount.current} (+${timeSinceLastRender.toFixed(0)}ms)`,
            style,
            changedProps.length > 0 ? `Changed: ${changedProps.join(', ')}` : 'Initial/Unknown'
        );

        // Warn on rapid re-renders (potential performance issue)
        if (timeSinceLastRender < 100 && renderCount.current > 1) {
            console.warn(
                `[PERF WARNING] ${componentName} re-rendered within ${timeSinceLastRender.toFixed(0)}ms!`,
                'Changed props:', changedProps
            );
        }
    });
}

/**
 * Hook to measure and log expensive operations
 * Usage: const measure = usePerfMeasure('OperationName');
 *        measure.start(); doExpensiveThing(); measure.end();
 */
export function usePerfMeasure(name: string) {
    const startTime = useRef(0);

    return {
        start: () => {
            startTime.current = performance.now();
        },
        end: () => {
            const duration = performance.now() - startTime.current;
            if (duration > 16) { // More than one frame (60fps = 16.67ms)
                console.warn(`[SLOW] ${name} took ${duration.toFixed(1)}ms`);
            }
        }
    };
}
