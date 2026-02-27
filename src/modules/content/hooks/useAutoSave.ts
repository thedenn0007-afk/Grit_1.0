"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { trpc } from "../../../lib/trpc/client";
import { useOfflineQueue } from "../../shared/hooks/useOfflineQueue";
import type { AdaptationSignals } from "../../../lib/adaptive-engine/calculator";

/**
 * Interface for auto-save return values
 */
export interface UseAutoSaveReturn {
  save: (position: number, signals?: AdaptationSignals) => void;
  isSaving: boolean;
  lastSavedPosition: number | null;
  error: Error | null;
}

/**
 * Hook for debounced auto-save of scroll position with signals
 * - Debounced 5-second save
 * - Calls trpc.content.saveProgress.mutate() with position data and signals
 * - On error: queues to useOfflineQueue for later retry
 */
export function useAutoSave(subtopicId: string): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedPosition, setLastSavedPosition] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPositionRef = useRef<number | null>(null);
  const pendingSignalsRef = useRef<AdaptationSignals | undefined>(undefined);

  // Offline queue
  const { addToQueue, isOnline } = useOfflineQueue();

  // tRPC mutation for saving progress with signals
  const saveMutation = trpc.content.saveProgress.useMutation({
    onMutate: () => {
      setIsSaving(true);
      setError(null);
    },
    onSuccess: () => {
      setIsSaving(false);
      if (pendingPositionRef.current !== null) {
        setLastSavedPosition(pendingPositionRef.current);
      }
    },
    onError: (err: unknown) => {
      setIsSaving(false);
      const errorMessage = err instanceof Error ? err.message : "Failed to save progress";
      setError(new Error(errorMessage));

      // Queue to offline queue if save failed
      if (pendingPositionRef.current !== null) {
        addToQueue({
          url: "/api/trpc/content.saveProgress",
          method: "POST",
          body: JSON.stringify({
            subtopicId,
            position: pendingPositionRef.current,
            timestamp: Date.now(),
            signals: pendingSignalsRef.current,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    },
  });

  /**
   * Save function - debounced 5 seconds
   */
  const save = useCallback(
    (position: number, signals?: AdaptationSignals): void => {
      pendingPositionRef.current = position;
      pendingSignalsRef.current = signals;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new debounce timeout
      timeoutRef.current = setTimeout(() => {
        if (isOnline) {
          // Save via tRPC if online
          saveMutation.mutate({
            subtopicId,
            position,
            timestamp: Date.now(),
            signals,
          });
        } else {
          // Queue for later if offline
          addToQueue({
            url: "/api/trpc/content.saveProgress",
            method: "POST",
            body: JSON.stringify({
              subtopicId,
              position,
              timestamp: Date.now(),
              signals,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
          setLastSavedPosition(position);
        }
      }, 5000);
    },
    [subtopicId, isOnline, addToQueue, saveMutation]
  );

  /**
   * Immediate save function - bypasses debounce
   */
  const saveImmediate = useCallback(
    (position: number, signals?: AdaptationSignals): void => {
      // Clear any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      pendingPositionRef.current = position;
      pendingSignalsRef.current = signals;

      if (isOnline) {
        saveMutation.mutate({
          subtopicId,
          position,
          timestamp: Date.now(),
          signals,
        });
      } else {
        addToQueue({
          url: "/api/trpc/content.saveProgress",
          method: "POST",
          body: JSON.stringify({
            subtopicId,
            position,
            timestamp: Date.now(),
            signals,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        setLastSavedPosition(position);
      }
    },
    [subtopicId, isOnline, addToQueue, saveMutation]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    isSaving,
    lastSavedPosition,
    error,
  };
}

export default useAutoSave;
