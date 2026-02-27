"use client";

import { useEffect, useState, useCallback } from "react";

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
  timestamp: number;
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedRequest[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    // Load queue from localStorage
    const saved = localStorage.getItem("offlineQueue");
    if (saved) setQueue(JSON.parse(saved));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveQueue = useCallback((newQueue: QueuedRequest[]) => {
    setQueue(newQueue);
    localStorage.setItem("offlineQueue", JSON.stringify(newQueue));
  }, []);

  const addToQueue = useCallback((request: Omit<QueuedRequest, "id" | "timestamp">) => {
    const newRequest: QueuedRequest = {
      ...request,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    saveQueue([...queue, newRequest]);
  }, [queue, saveQueue]);

  const processQueue = useCallback(async () => {
    if (queue.length === 0) return;

    const failed: QueuedRequest[] = [];

    for (const request of queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        if (!response.ok) throw new Error("Request failed");
      } catch {
        failed.push(request);
      }
    }

    saveQueue(failed);
  }, [queue, saveQueue]);

  const clearQueue = useCallback(() => {
    saveQueue([]);
  }, [saveQueue]);

  return {
    isOnline,
    queueLength: queue.length,
    addToQueue,
    processQueue,
    clearQueue,
  };
}

export default useOfflineQueue;
