/**
 * AI Job Processor
 * Handles background processing of AI jobs
 */

import { prisma } from '../lib/prisma.js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
import { aiJobService } from './ai-job.service.js';
import { aiPricingService } from './ai-pricing.service.js';
import { parseAIResponse } from '../utils/ai-parser.js';
import { AIServiceError } from '../utils/errors.js';
import { aiLogger } from '../utils/logger.js';
import { AIJobType } from '@prisma/client';

const procLogger = aiLogger;

/**
 * Process a single AI job
 */
export async function processAIJob(jobId: string): Promise<void> {
  try {
    // Get job details
    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      procLogger.error('Job not found', { jobId });
      return;
    }

    // Skip if already processing/completed
    if (job.status !== 'PENDING') {
      procLogger.debug('Job already processed', { jobId, status: job.status });
      return;
    }

    // Mark as processing
    await aiJobService.startProcessing(jobId);
    procLogger.info('Processing AI job', { jobId, type: job.type });

    // Route to appropriate processor
    let analysisId: string;

    switch (job.type) {
      case 'SUGGEST_TESTS':
        analysisId = await processSuggestTests(job);
        break;
      case 'GENERATE_PAYLOADS':
        analysisId = await processGeneratePayloads(job);
        break;
      case 'GENERATE_DORKS':
        analysisId = await processGenerateDorks(job);
        break;
      case 'ATTACK_CHAIN':
        analysisId = await processAttackChain(job);
        break;
      case 'SECURITY_REPORT':
        analysisId = await processSecurityReport(job);
        break;
      case 'ANALYZE_REQUEST':
      case 'ANALYZE_RESPONSE':
        analysisId = await processAnalyze(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Mark as completed
    await aiJobService.completeJob(jobId, analysisId);
    procLogger.info('AI job completed', { jobId, analysisId });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    procLogger.error('AI job processing failed', { jobId, error: errorMessage });

    await aiJobService.failJob(jobId, errorMessage);
  }
}

/**
 * Process SUGGEST_TESTS job type
 */
async function processSuggestTests(job: any): Promise<string> {
  const { userId, requestData, model: preferredModel, mode } = job;
  const request = requestData;

  // Import prompt
  const { TEST_SUGGESTION_PROMPT } = await import('../core/ai/prompts.js');

  // Prepare request context
  const requestContext = `HTTP Request to analyze:
Method: ${request.method}
URL: ${request.url}
Headers:
${Object.entries(request.headers || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}
${request.body ? `\nBody:\n${request.body}` : ''}`;

  // Model selection
  const model = preferredModel === 'auto' ? 'haiku-4.5' : preferredModel;
  const isSonnet = model === 'sonnet-4.5';
  const actualModel = isSonnet ? 'claude-sonnet-4-20250514' : 'claude-3-5-haiku-20241022';
  const maxTokens = isSonnet ? 8192 : 4096;
  const temperature = isSonnet ? 0.5 : 0.7;

  await aiJobService.updateProgress(job.id, 25);

  // Call Claude API
  procLogger.info('Calling Claude API for test suggestions', {
    jobId: job.id,
    actualModel,
    maxTokens,
  });

  const response = await anthropic.messages.create({
    model: actualModel,
    max_tokens: maxTokens,
    temperature: temperature,
    system: TEST_SUGGESTION_PROMPT,
    messages: [
      {
        role: 'user',
        content: requestContext,
      },
    ],
  });

  await aiJobService.updateProgress(job.id, 75);

  // Extract AI response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new AIServiceError('Unexpected AI response type');
  }

  // Parse response
  const parsed = parseAIResponse(content.text);

  if (!parsed.success) {
    procLogger.warn('AI response parsing failed', {
      jobId: job.id,
      parseMethod: parsed.parseMethod,
    });
  }

  const suggestions = parsed.success ? parsed.data : {
    tests: [],
    summary: parsed.rawText?.substring(0, 500) || 'Failed to parse response',
    parseError: true
  };

  // Calculate and deduct tokens
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
  const tokenCost = aiPricingService.calculateTokenCost(
    model,
    response.usage.input_tokens,
    response.usage.output_tokens
  );
  await aiPricingService.deductTokens(userId, tokenCost);

  await aiJobService.updateProgress(job.id, 90);

  // Store in database
  const analysisRecord = await prisma.aIAnalysis.create({
    data: {
      userId,
      analysisType: 'TEST_SUGGESTIONS',
      mode: mode,
      title: `Test Suggestions: ${request.method} ${request.url.substring(0, 50)}`,
      category: 'testing',
      aiResponse: content.text,
      suggestions: suggestions as any,
      tokensUsed: tokenCost,
      model: model,
      confidence: parsed.success ? 85 : 40,
    },
  });

  return analysisRecord.id;
}

/**
 * Process GENERATE_PAYLOADS job type
 */
async function processGeneratePayloads(job: any): Promise<string> {
  // TODO: Implement payload generation
  // For now, create placeholder
  const analysisRecord = await prisma.aIAnalysis.create({
    data: {
      userId: job.userId,
      analysisType: 'PAYLOAD_GENERATION',
      mode: job.mode,
      title: 'Payload Generation (Placeholder)',
      category: 'fuzzing',
      aiResponse: 'Placeholder',
      suggestions: { payloads: [] },
      tokensUsed: 0,
      confidence: 0,
    },
  });

  return analysisRecord.id;
}

/**
 * Process GENERATE_DORKS job type
 */
async function processGenerateDorks(job: any): Promise<string> {
  // TODO: Implement dork generation
  const analysisRecord = await prisma.aIAnalysis.create({
    data: {
      userId: job.userId,
      analysisType: 'DORK_GENERATION',
      mode: job.mode,
      title: 'Dork Generation (Placeholder)',
      category: 'recon',
      aiResponse: 'Placeholder',
      suggestions: { dorks: [] },
      tokensUsed: 0,
      confidence: 0,
    },
  });

  return analysisRecord.id;
}

/**
 * Process ATTACK_CHAIN job type
 */
async function processAttackChain(job: any): Promise<string> {
  // TODO: Implement attack chain generation
  const analysisRecord = await prisma.aIAnalysis.create({
    data: {
      userId: job.userId,
      analysisType: 'ATTACK_CHAIN',
      mode: job.mode,
      title: 'Attack Chain (Placeholder)',
      category: 'chain',
      aiResponse: 'Placeholder',
      suggestions: { steps: [] },
      tokensUsed: 0,
      confidence: 0,
    },
  });

  return analysisRecord.id;
}

/**
 * Process SECURITY_REPORT job type
 */
async function processSecurityReport(job: any): Promise<string> {
  // TODO: Implement security report generation
  const analysisRecord = await prisma.aIAnalysis.create({
    data: {
      userId: job.userId,
      analysisType: 'SECURITY_REPORT',
      mode: job.mode,
      title: 'Security Report (Placeholder)',
      category: 'report',
      aiResponse: 'Placeholder',
      suggestions: { findings: [] },
      tokensUsed: 0,
      confidence: 0,
    },
  });

  return analysisRecord.id;
}

/**
 * Process ANALYZE_REQUEST/ANALYZE_RESPONSE job types
 */
async function processAnalyze(job: any): Promise<string> {
  // TODO: Implement request/response analysis
  const analysisRecord = await prisma.aIAnalysis.create({
    data: {
      userId: job.userId,
      analysisType: job.type === 'ANALYZE_REQUEST' ? 'REQUEST' : 'RESPONSE',
      mode: job.mode,
      title: 'Analysis (Placeholder)',
      category: 'analysis',
      aiResponse: 'Placeholder',
      suggestions: {},
      tokensUsed: 0,
      confidence: 0,
    },
  });

  return analysisRecord.id;
}
