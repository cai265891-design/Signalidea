import { useState, useEffect, useRef, useCallback } from "react";
import type { PipelineJobStatus } from "~/types/pipeline";

interface UsePipelinePollingOptions {
  jobId: number | null;
  enabled?: boolean;
  onComplete?: (status: PipelineJobStatus) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for polling Pipeline status
 *
 * Features:
 * - Automatic polling with smart intervals
 * - Stops when pipeline completes or fails
 * - Supports localStorage persistence for recovery
 * - Cleanup on unmount
 */
export function usePipelinePolling({
  jobId,
  enabled = true,
  onComplete,
  onError,
}: UsePipelinePollingOptions) {
  const [status, setStatus] = useState<PipelineJobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const hasCompletedRef = useRef(false);

  /**
   * Fetch pipeline status
   */
  const fetchStatus = useCallback(async () => {
    if (!jobId || !enabled || hasCompletedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/pipeline/status/${jobId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }

      const data: PipelineJobStatus = await response.json();
      setStatus(data);

      // Check if completed
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        hasCompletedRef.current = true;
        stopPolling();

        if (onComplete) {
          onComplete(data);
        }
      }

      pollCountRef.current++;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [jobId, enabled, onComplete, onError]);

  /**
   * Get smart polling interval based on elapsed time
   */
  const getPollingInterval = useCallback(() => {
    const pollCount = pollCountRef.current;

    // First 10 polls (0-30s): 3 seconds
    if (pollCount < 10) return 3000;

    // Next 20 polls (30s-2min): 5 seconds
    if (pollCount < 30) return 5000;

    // After 2 minutes: 10 seconds
    return 10000;
  }, []);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (!jobId || !enabled) return;

    // Immediate first fetch
    fetchStatus();

    // Setup interval
    intervalRef.current = setInterval(() => {
      fetchStatus();

      // Update interval dynamically
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(fetchStatus, getPollingInterval());
      }
    }, getPollingInterval());
  }, [jobId, enabled, fetchStatus, getPollingInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Manual refresh
   */
  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Setup polling on mount/jobId change
   */
  useEffect(() => {
    if (jobId && enabled && !hasCompletedRef.current) {
      pollCountRef.current = 0;
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [jobId, enabled, startPolling, stopPolling]);

  /**
   * Save to localStorage for recovery
   */
  useEffect(() => {
    if (jobId && status && status.status !== "COMPLETED" && status.status !== "FAILED") {
      localStorage.setItem("currentPipelineJobId", jobId.toString());
      localStorage.setItem("currentPipelineStatus", JSON.stringify(status));
    } else if (status?.status === "COMPLETED" || status?.status === "FAILED") {
      localStorage.removeItem("currentPipelineJobId");
      localStorage.removeItem("currentPipelineStatus");
    }
  }, [jobId, status]);

  return {
    status,
    isLoading,
    error,
    refresh,
    stopPolling,
  };
}

/**
 * Helper: Recover from localStorage
 */
export function recoverPipelineJob(): number | null {
  if (typeof window === "undefined") return null;

  const savedJobId = localStorage.getItem("currentPipelineJobId");
  return savedJobId ? parseInt(savedJobId, 10) : null;
}
