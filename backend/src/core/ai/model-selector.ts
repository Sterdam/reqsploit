import { AIMode, Plan } from '@prisma/client';
import { aiLogger } from '../../utils/logger.js';
import type { AIModel, AIAction } from '../../services/ai-pricing.service.js';

/**
 * Model Selection Service
 *
 * Intelligently selects the optimal AI model (Haiku 4.5 vs Sonnet 4.5)
 * based on AIMode, complexity, and user plan.
 *
 * SELECTION STRATEGY:
 * - EDUCATIONAL mode: Always use Sonnet for detailed explanations
 * - DEFAULT mode: Auto-select based on complexity
 * - ADVANCED mode: Prefer Sonnet for deep technical analysis
 * - FREE plan: Force Haiku only (regardless of mode)
 */

export interface ModelSelectionContext {
  mode: AIMode;
  action: AIAction;
  plan: Plan;
  userPreference?: AIModel; // Manual override
  complexity?: number; // 0-1 scale
}

export interface ModelSelectionResult {
  model: AIModel;
  reason: string;
  confidence: number; // 0-1 scale
}

export class ModelSelector {
  /**
   * Select optimal model based on context
   */
  selectModel(context: ModelSelectionContext): ModelSelectionResult {
    // 1. User preference override (if allowed for plan)
    if (context.userPreference) {
      if (context.plan === 'FREE' && context.userPreference === 'sonnet-4.5') {
        aiLogger.warn('FREE plan cannot use Sonnet, falling back to Haiku', {
          userId: 'unknown',
          plan: context.plan,
        });
        return {
          model: 'haiku-4.5',
          reason: 'FREE plan restricted to Haiku',
          confidence: 1,
        };
      }
      return {
        model: context.userPreference,
        reason: 'User manual selection',
        confidence: 1,
      };
    }

    // 2. FREE plan restriction
    if (context.plan === 'FREE') {
      return {
        model: 'haiku-4.5',
        reason: 'FREE plan: Haiku only',
        confidence: 1,
      };
    }

    // 3. Mode-based selection
    switch (context.mode) {
      case 'EDUCATIONAL':
        return this.selectForEducational(context);

      case 'DEFAULT':
        return this.selectForDefault(context);

      case 'ADVANCED':
        return this.selectForAdvanced(context);

      default:
        return {
          model: 'haiku-4.5',
          reason: 'Unknown mode, defaulting to Haiku',
          confidence: 0.5,
        };
    }
  }

  /**
   * EDUCATIONAL mode: Prioritize detailed explanations
   */
  private selectForEducational(context: ModelSelectionContext): ModelSelectionResult {
    // Educational mode should use Sonnet for comprehensive explanations
    // unless it's a very simple action
    const simpleActions: AIAction[] = ['quickScan', 'explain'];

    if (simpleActions.includes(context.action)) {
      return {
        model: 'haiku-4.5',
        reason: 'EDUCATIONAL: Simple explanation with Haiku',
        confidence: 0.7,
      };
    }

    return {
      model: 'sonnet-4.5',
      reason: 'EDUCATIONAL: Detailed explanation with Sonnet',
      confidence: 0.9,
    };
  }

  /**
   * DEFAULT mode: Balance cost and quality
   */
  private selectForDefault(context: ModelSelectionContext): ModelSelectionResult {
    // Use complexity score to decide
    const complexity = context.complexity || this.estimateComplexity(context.action);

    // High complexity actions need Sonnet
    if (complexity > 0.7) {
      return {
        model: 'sonnet-4.5',
        reason: 'DEFAULT: High complexity requires Sonnet',
        confidence: 0.85,
      };
    }

    // Medium complexity can use Haiku
    if (complexity > 0.4) {
      return {
        model: 'haiku-4.5',
        reason: 'DEFAULT: Medium complexity, Haiku sufficient',
        confidence: 0.8,
      };
    }

    // Low complexity definitely Haiku
    return {
      model: 'haiku-4.5',
      reason: 'DEFAULT: Low complexity, Haiku optimal',
      confidence: 0.9,
    };
  }

  /**
   * ADVANCED mode: Prioritize depth and accuracy
   */
  private selectForAdvanced(context: ModelSelectionContext): ModelSelectionResult {
    // Advanced mode prefers Sonnet for most actions
    // Only use Haiku for very simple tasks
    const simpleActions: AIAction[] = ['quickScan'];

    if (simpleActions.includes(context.action)) {
      return {
        model: 'haiku-4.5',
        reason: 'ADVANCED: Quick scan with Haiku',
        confidence: 0.7,
      };
    }

    return {
      model: 'sonnet-4.5',
      reason: 'ADVANCED: Deep technical analysis with Sonnet',
      confidence: 0.95,
    };
  }

  /**
   * Estimate complexity of an action (0-1 scale)
   */
  private estimateComplexity(action: AIAction): number {
    const complexityMap: Record<AIAction, number> = {
      quickScan: 0.2,
      explain: 0.3,
      securityCheck: 0.5,
      analyzeRequest: 0.6,
      analyzeResponse: 0.7,
      generatePayloads: 0.7,
      analyzeTransaction: 0.8,
      generateExploits: 0.85,
      deepScan: 0.9,
      generateDorks: 0.75,
      attackChain: 0.95,
    };

    return complexityMap[action] || 0.5;
  }

  /**
   * Get model recommendation with explanation
   */
  getRecommendation(context: ModelSelectionContext): {
    recommended: AIModel;
    alternative: AIModel;
    savings?: number; // Credits saved if using alternative
    reason: string;
  } {
    const selection = this.selectModel(context);
    const alternative = selection.model === 'haiku-4.5' ? 'sonnet-4.5' : 'haiku-4.5';

    // Calculate potential savings/cost difference
    // This would integrate with AIPricingService
    const savings =
      selection.model === 'haiku-4.5'
        ? Math.round(this.estimateComplexity(context.action) * 10) // Rough estimate
        : undefined;

    return {
      recommended: selection.model,
      alternative,
      savings,
      reason: selection.reason,
    };
  }

  /**
   * Validate if a model can be used with current plan
   */
  validateModelForPlan(model: AIModel, plan: Plan): { allowed: boolean; reason?: string } {
    if (plan === 'FREE' && model === 'sonnet-4.5') {
      return {
        allowed: false,
        reason: 'Sonnet 4.5 requires PRO or ENTERPRISE plan',
      };
    }

    return { allowed: true };
  }
}

// Export singleton instance
export const modelSelector = new ModelSelector();
