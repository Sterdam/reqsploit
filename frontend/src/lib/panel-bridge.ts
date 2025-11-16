/**
 * Panel Bridge - Inter-panel communication system
 * Enables workflows like Intercept → Repeater, Repeater → Intruder
 */

import { RepeaterRequest } from '../stores/repeaterStore';
import { AISuggestion } from '../stores/aiStore';

/**
 * Panel Types
 */
export type PanelType = 'intercept' | 'history' | 'repeater' | 'decoder' | 'intruder';

/**
 * Workflow Action Types
 */
export type WorkflowAction =
  | 'send_to_repeater'
  | 'send_to_intruder'
  | 'add_to_notes'
  | 'batch_to_repeater'
  | 'apply_suggestion';

/**
 * Workflow Event
 */
export interface WorkflowEvent {
  action: WorkflowAction;
  source: PanelType;
  target: PanelType;
  data: any;
  timestamp: string;
}

/**
 * Event Bus for cross-panel communication
 */
class PanelBridge {
  private listeners: Map<WorkflowAction, Set<(event: WorkflowEvent) => void>> = new Map();
  private history: WorkflowEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to workflow events
   */
  on(action: WorkflowAction, callback: (event: WorkflowEvent) => void): () => void {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set());
    }
    this.listeners.get(action)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(action)?.delete(callback);
    };
  }

  /**
   * Emit workflow event
   */
  emit(action: WorkflowAction, source: PanelType, target: PanelType, data: any): void {
    const event: WorkflowEvent = {
      action,
      source,
      target,
      data,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    const callbacks = this.listeners.get(action);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event));
    }

    console.log(`📋 Panel Bridge: ${source} → ${target} (${action})`, data);
  }

  /**
   * Get workflow history
   */
  getHistory(filter?: { action?: WorkflowAction; source?: PanelType; target?: PanelType }): WorkflowEvent[] {
    if (!filter) return [...this.history];

    return this.history.filter((event) => {
      if (filter.action && event.action !== filter.action) return false;
      if (filter.source && event.source !== filter.source) return false;
      if (filter.target && event.target !== filter.target) return false;
      return true;
    });
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsBySource: Record<string, number>;
    eventsByTarget: Record<string, number>;
  } {
    const stats = {
      totalEvents: this.history.length,
      eventsByAction: {} as Record<string, number>,
      eventsBySource: {} as Record<string, number>,
      eventsByTarget: {} as Record<string, number>,
    };

    this.history.forEach((event) => {
      stats.eventsByAction[event.action] = (stats.eventsByAction[event.action] || 0) + 1;
      stats.eventsBySource[event.source] = (stats.eventsBySource[event.source] || 0) + 1;
      stats.eventsByTarget[event.target] = (stats.eventsByTarget[event.target] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
export const panelBridge = new PanelBridge();

/**
 * Workflow Helper Functions
 */

/**
 * Send request to Repeater
 */
export function sendToRepeater(request: RepeaterRequest, source: PanelType = 'intercept'): void {
  panelBridge.emit('send_to_repeater', source, 'repeater', { request });
}

/**
 * Send payloads to Intruder
 */
export function sendToIntruder(
  payloads: string[],
  targetRequest: RepeaterRequest,
  source: PanelType = 'repeater'
): void {
  panelBridge.emit('send_to_intruder', source, 'intruder', {
    payloads,
    targetRequest,
  });
}

/**
 * Add finding to notes
 */
export function addToNotes(content: string, source: PanelType, metadata?: any): void {
  panelBridge.emit('add_to_notes', source, 'history', {
    content,
    metadata,
  });
}

/**
 * Batch send requests to Repeater
 */
export function batchToRepeater(requests: RepeaterRequest[], source: PanelType = 'history'): void {
  panelBridge.emit('batch_to_repeater', source, 'repeater', {
    requests,
  });
}

/**
 * Apply AI suggestion to request
 */
export function applySuggestion(
  suggestion: AISuggestion,
  targetRequest: RepeaterRequest,
  source: PanelType
): void {
  panelBridge.emit('apply_suggestion', source, 'intercept', {
    suggestion,
    targetRequest,
  });
}
