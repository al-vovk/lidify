import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

export type JobType = "scan" | "discover";

export interface JobStatus {
    status: "waiting" | "active" | "completed" | "failed" | "delayed";
    progress: number;
    result?: any;
    error?: string;
}

export function useJobStatus(
    jobId: string | null,
    jobType: JobType,
    options?: {
        pollInterval?: number;
        onComplete?: (result: any) => void;
        onError?: (error: string) => void;
    }
) {
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const pollInterval = options?.pollInterval || 5000;
    const cancelledRef = useRef(false);

    // Store latest options in ref to avoid stale closures
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const checkStatus = useCallback(async () => {
        if (!jobId || cancelledRef.current) return;

        try {
            let statusData;
            if (jobType === "scan") {
                statusData = await api.getScanStatus(jobId);
            } else if (jobType === "discover") {
                statusData = await api.getDiscoverGenerationStatus(jobId);
            }

            if (!statusData || cancelledRef.current) return;

            setJobStatus(statusData as JobStatus);

            if (statusData.status === "completed") {
                setIsPolling(false);
                if (optionsRef.current?.onComplete && statusData.result) {
                    optionsRef.current.onComplete(statusData.result);
                }
            } else if (statusData.status === "failed") {
                setIsPolling(false);
                if (optionsRef.current?.onError) {
                    const errorMsg =
                        statusData.result?.error ||
                        "Job failed with unknown error";
                    optionsRef.current.onError(errorMsg);
                }
            }
        } catch (error: any) {
            if (cancelledRef.current) return;
            console.error("Error checking job status:", error);
            setIsPolling(false);
            if (optionsRef.current?.onError) {
                optionsRef.current.onError(error.message || "Failed to check job status");
            }
        }
    }, [jobId, jobType]);

    // Start polling when jobId is set
    useEffect(() => {
        if (jobId) {
            setIsPolling(true);
        }
    }, [jobId]);

    // Poll for status updates
    useEffect(() => {
        if (!isPolling || !jobId) return;

        cancelledRef.current = false;

        checkStatus();

        const interval = setInterval(checkStatus, pollInterval);

        return () => {
            cancelledRef.current = true;
            clearInterval(interval);
        };
    }, [isPolling, jobId, checkStatus, pollInterval]);

    return {
        jobStatus,
        isPolling,
        checkStatus,
    };
}
