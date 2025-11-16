import { PrismaClient, Plan, AIMode } from '@prisma/client';
import { aiLogger } from '../utils/logger.js';
import { AIServiceError } from '../utils/errors.js';

/**
 * AI Pricing & Token Management Service
 *
 * Handles token calculation, tracking, and deduction for AI features.
 *
 * PRICING STRATEGY:
 * - Token-based system with 4x margin on Claude API usage
 * - Sonnet 4.5: $3/MTok input, $15/MTok output (12x more expensive than Haiku)
 * - Haiku 4.5: $0.25/MTok input, $1.25/MTok output
 *
 * PLANS:
 * - FREE: 10,000 tokens/month (Haiku only)
 * - PRO: $29/month, 200,000 tokens/month
 * - ENTERPRISE: $99/month, 1,000,000 tokens/month
 */

export type AIModel = 'haiku-4.5' | 'sonnet-4.5' | 'auto';

export type AIAction =
  | 'analyzeRequest'
  | 'analyzeResponse'
  | 'analyzeTransaction'
  | 'generateExploits'
  | 'generatePayloads'
  | 'securityCheck'
  | 'explain'
  | 'quickScan'
  | 'deepScan'
  | 'suggestTests'
  | 'generateDorks'
  | 'attackChain';

interface PricingConfig {
  // Anthropic API costs per million tokens
  apiCosts: {
    'haiku-4.5': { input: number; output: number };
    'sonnet-4.5': { input: number; output: number };
  };
  // Plan token limits per month
  planLimits: {
    [key in Plan]: number;
  };
  // Estimated token usage per action (input + output)
  estimatedTokens: {
    [key in AIAction]: { input: number; output: number };
  };
  // Margin multiplier (4x for SaaS profitability)
  margin: number;
}

const PRICING_CONFIG: PricingConfig = {
  apiCosts: {
    'haiku-4.5': { input: 0.25, output: 1.25 }, // $0.25/$1.25 per MTok
    'sonnet-4.5': { input: 3, output: 15 },     // $3/$15 per MTok
  },
  planLimits: {
    FREE: 10000,      // 10K tokens/month (Haiku only)
    PRO: 200000,      // 200K tokens/month
    ENTERPRISE: 1000000, // 1M tokens/month
  },
  estimatedTokens: {
    analyzeRequest: { input: 800, output: 600 },
    analyzeResponse: { input: 1200, output: 800 },
    analyzeTransaction: { input: 2000, output: 1200 },
    generateExploits: { input: 1500, output: 2000 },
    generatePayloads: { input: 500, output: 800 },
    securityCheck: { input: 800, output: 600 },
    explain: { input: 600, output: 800 },
    quickScan: { input: 500, output: 400 },
    deepScan: { input: 2000, output: 1500 },
    suggestTests: { input: 2000, output: 1500 }, // Similar to deepScan - comprehensive analysis
    generateDorks: { input: 400, output: 600 },
    attackChain: { input: 2500, output: 2000 },
  },
  margin: 4, // 4x margin for healthy SaaS profitability
};

export class AIPricingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate token cost for actual usage (with 4x margin)
   * Returns number of tokens to deduct from user's balance
   */
  calculateTokenCost(model: AIModel, inputTokens: number, outputTokens: number): number {
    // Calculate total tokens used
    const totalTokens = inputTokens + outputTokens;

    // Apply 4x margin to token count
    const tokensToDeduct = totalTokens * PRICING_CONFIG.margin;

    aiLogger.debug('Token cost calculated', {
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      margin: PRICING_CONFIG.margin,
      tokensToDeduct,
    });

    return Math.ceil(tokensToDeduct);
  }

  /**
   * Get estimated cost for an action BEFORE execution
   * Returns total tokens (input + output) with 4x margin
   */
  getEstimatedCost(action: AIAction, model: AIModel): number {
    const tokens = PRICING_CONFIG.estimatedTokens[action];
    const totalTokens = tokens.input + tokens.output;
    // Apply 4x margin to token count
    return totalTokens * PRICING_CONFIG.margin;
  }

  /**
   * Get token limit for a plan
   */
  getPlanLimit(plan: Plan): number {
    return PRICING_CONFIG.planLimits[plan];
  }

  /**
   * Check if user has enough tokens
   */
  async checkUserTokens(userId: string, requiredTokens: number): Promise<boolean> {
    try {
      const usage = await this.getCurrentUsage(userId);
      const available = usage.tokensLimit - usage.tokensUsed;

      aiLogger.debug('Token check', {
        userId,
        required: requiredTokens,
        available,
        hasEnough: available >= requiredTokens,
      });

      return available >= requiredTokens;
    } catch (error) {
      aiLogger.error('Failed to check user tokens', { userId, error });
      throw new AIServiceError('Failed to check token balance');
    }
  }

  /**
   * Deduct tokens from user's account
   */
  async deductTokens(userId: string, tokens: number): Promise<void> {
    try {
      const usage = await this.getCurrentUsage(userId);

      // Check if enough tokens
      const available = usage.tokensLimit - usage.tokensUsed;
      if (available < tokens) {
        throw new AIServiceError(
          `Insufficient tokens. Required: ${tokens}, Available: ${available}`,
          402 // Payment Required
        );
      }

      // Deduct tokens
      await this.prisma.tokenUsage.update({
        where: { id: usage.id },
        data: {
          tokensUsed: usage.tokensUsed + tokens,
        },
      });

      aiLogger.info('Tokens deducted', {
        userId,
        tokens,
        newBalance: available - tokens,
      });
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      aiLogger.error('Failed to deduct tokens', { userId, tokens, error });
      throw new AIServiceError('Failed to deduct tokens');
    }
  }

  /**
   * Get current usage for user (create if doesn't exist)
   */
  async getCurrentUsage(userId: string): Promise<{
    id: string;
    tokensUsed: number;
    tokensLimit: number;
    resetDate: Date;
  }> {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get user to check plan
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      throw new AIServiceError('User not found', 404);
    }

    // Find or create usage record
    let usage = await this.prisma.tokenUsage.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        },
      },
    });

    if (!usage) {
      // Create new usage record for this month
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of next month
      usage = await this.prisma.tokenUsage.create({
        data: {
          userId,
          monthYear,
          tokensUsed: 0,
          tokensLimit: this.getPlanLimit(user.plan),
          resetDate,
        },
      });

      aiLogger.info('Created new token usage record', { userId, monthYear });
    }

    return usage;
  }

  /**
   * Get token balance for user
   */
  async getTokenBalance(userId: string): Promise<{
    used: number;
    limit: number;
    available: number;
    resetDate: Date;
  }> {
    const usage = await this.getCurrentUsage(userId);
    return {
      used: usage.tokensUsed,
      limit: usage.tokensLimit,
      available: usage.tokensLimit - usage.tokensUsed,
      resetDate: usage.resetDate,
    };
  }

  /**
   * Check if model is allowed for plan
   */
  isModelAllowedForPlan(plan: Plan, model: AIModel): boolean {
    // FREE plan can only use Haiku
    if (plan === 'FREE' && model === 'sonnet-4.5') {
      return false;
    }
    return true;
  }

  /**
   * Get all pricing info for display
   */
  getPricingInfo(): {
    plans: { plan: Plan; tokens: number }[];
    actions: { action: AIAction; haiku: number; sonnet: number }[];
  } {
    const plans = Object.entries(PRICING_CONFIG.planLimits).map(([plan, tokens]) => ({
      plan: plan as Plan,
      tokens,
    }));

    const actions = Object.keys(PRICING_CONFIG.estimatedTokens).map((action) => ({
      action: action as AIAction,
      haiku: this.getEstimatedCost(action as AIAction, 'haiku-4.5'),
      sonnet: this.getEstimatedCost(action as AIAction, 'sonnet-4.5'),
    }));

    return { plans, actions };
  }
}

// Export singleton instance
export const aiPricingService = new AIPricingService();
