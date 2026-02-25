/**
 * ReqSploit Request Executor
 * Client-side HTTP request execution for Repeater + Intruder.
 * Uses fetch() from extension background (NO CORS restrictions).
 */

import type {
  ExecuteRequestOptions,
  ExecuteRequestResult,
  BatchExecuteOptions,
  ExtIntruderResultPayload,
} from './types';

export class RequestExecutor {
  /**
   * Execute a single HTTP request and return full response with timing
   */
  async executeRequest(options: ExecuteRequestOptions): Promise<ExecuteRequestResult> {
    const { method, url, headers, body, timeout = 30000, followRedirects = true } = options;
    const startTime = performance.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
        signal: controller.signal,
        redirect: followRedirects ? 'follow' : 'manual',
      });

      const responseTime = Math.round(performance.now() - startTime);
      const responseBody = await response.text();

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        statusCode: response.status,
        statusMessage: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        responseTime,
      };
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);

      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          statusCode: 0,
          statusMessage: `Request timeout after ${timeout}ms`,
          headers: {},
          body: '',
          responseTime,
        };
      }

      return {
        statusCode: 0,
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
        headers: {},
        body: '',
        responseTime,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Execute a batch of requests with concurrency control and delay (for Intruder campaigns)
   */
  async executeBatch(options: BatchExecuteOptions): Promise<void> {
    const { requests, concurrency, delayMs, onResult, onError, signal } = options;

    let activeCount = 0;
    let index = 0;
    const queue = [...requests];

    const processNext = async (): Promise<void> => {
      while (queue.length > 0 && activeCount < concurrency) {
        if (signal?.aborted) return;

        const request = queue.shift()!;
        activeCount++;

        // Add delay between requests if configured
        if (delayMs > 0 && index > 0) {
          await this.sleep(delayMs);
        }

        index++;

        // Execute without awaiting to allow concurrency
        this.executeRequest({
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          timeout: 30000,
        })
          .then((result) => {
            const intruderResult: ExtIntruderResultPayload = {
              campaignId: '', // Will be set by caller
              index: request.index,
              payloads: request.payloads,
              statusCode: result.statusCode,
              responseLength: result.body.length,
              responseTime: result.responseTime,
              body: result.body,
              headers: result.headers,
            };

            onResult(intruderResult);
          })
          .catch((error) => {
            onError(request.index, error instanceof Error ? error.message : 'Unknown error');
          })
          .finally(() => {
            activeCount--;
            processNext();
          });
      }
    };

    // Start processing with concurrency limit
    const starters = [];
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      starters.push(processNext());
    }

    await Promise.all(starters);

    // Wait for all active requests to complete
    while (activeCount > 0) {
      await this.sleep(100);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
