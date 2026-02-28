/**
 * Offline queue mechanism for optimistic UI interactions to save progress.
 * Serializes save mutations to localStorage and flushes when coming back online.
 */

const OFFLINE_QUEUE_KEY = "grit_offline_sync_queue";

export interface QueueItem {
    id: string;
    mutationKey: string;
    payload: any;
    timestamp: number;
}

/**
 * Pushes a new mutation into the offline queue
 */
export const enqueueMutation = (mutationKey: string, payload: any): void => {
    if (typeof window === "undefined") return;

    const currentQueueStr = localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]";
    const queue: QueueItem[] = JSON.parse(currentQueueStr);

    queue.push({
        id: crypto.randomUUID(),
        mutationKey,
        payload,
        timestamp: Date.now(),
    });

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

/**
 * Returns all queued mutations, but does not clear them
 */
export const getOfflineQueue = (): QueueItem[] => {
    if (typeof window === "undefined") return [];
    const currentQueueStr = localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]";
    try {
        return JSON.parse(currentQueueStr);
    } catch {
        return [];
    }
};

/**
 * Clears the queue from localStorage (called after successful flush)
 */
export const clearOfflineQueue = (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

/**
 * Helper fn that apps should call when connection restores
 * Given an executeFn (like a tRPC caller), it will sequentially run the updates
 */
export const flushQueue = async (executeFn: (item: QueueItem) => Promise<void>) => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Flushing ${queue.length} offline actions to server...`);

    for (const item of queue) {
        try {
            await executeFn(item);
        } catch (e) {
            console.error("Failed to sync offline item:", item, e);
            // Depending on robustness needs, you might keep failed items in queue
            // For simplicity, we just log the failure.
        }
    }

    // Clear if we generally succeeded
    clearOfflineQueue();
};
