import { useCallback, useRef } from 'react';

/**
 * Hook to throttle callback executions
 * Useful for high-frequency events like WebSocket updates
 *
 * @param callback - Function to throttle
 * @param delay - Delay in milliseconds between executions
 * @returns Throttled version of the callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      // If enough time has passed, execute immediately
      if (timeSinceLastRun >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        // Otherwise, schedule execution
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook to batch multiple events and execute callback once with all accumulated data
 * Perfect for WebSocket events that fire rapidly
 *
 * @param callback - Function to call with batched data
 * @param delay - Delay in milliseconds to wait before batching
 * @returns Function to add items to the batch
 */
export function useBatchedCallback<T>(
  callback: (items: T[]) => void,
  delay: number = 100
): (item: T) => void {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (item: T) => {
      batchRef.current.push(item);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (batchRef.current.length > 0) {
          callback([...batchRef.current]);
          batchRef.current = [];
        }
      }, delay);
    },
    [callback, delay]
  );
}
