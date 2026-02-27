/**
 * AI Response Parser Utility
 * Robust JSON parsing for Claude API responses that may contain markdown or text formatting
 */

import { aiLogger } from './logger.js';

export interface ParsedAIResponse {
  success: boolean;
  data: any;
  rawText?: string;
  parseMethod: 'direct' | 'extracted' | 'fallback';
}

/**
 * Robustly parse AI response that may contain JSON within markdown or text
 * Handles multiple formats:
 * 1. Pure JSON
 * 2. JSON within markdown code blocks
 * 3. JSON within text explanations
 * 4. Malformed JSON with trailing commas
 */
export function parseAIResponse(content: string): ParsedAIResponse {
  // Method 1: Try direct JSON parse
  try {
    const parsed = JSON.parse(content);
    aiLogger.debug('AI response parsed directly');
    return {
      success: true,
      data: parsed,
      parseMethod: 'direct',
    };
  } catch (directError) {
    aiLogger.debug('Direct JSON parse failed, trying extraction methods');
  }

  // Method 2: Extract JSON from markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      aiLogger.debug('AI response parsed from markdown code block');
      return {
        success: true,
        data: parsed,
        parseMethod: 'extracted',
      };
    } catch (codeBlockError) {
      aiLogger.debug('Markdown code block parse failed');
    }
  }

  // Method 3: Extract JSON object/array from text
  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      let jsonString = jsonMatch[1];

      // Clean common JSON issues
      jsonString = cleanMalformedJSON(jsonString);

      const parsed = JSON.parse(jsonString);
      aiLogger.debug('AI response parsed from extracted JSON');
      return {
        success: true,
        data: parsed,
        parseMethod: 'extracted',
      };
    } catch (extractError) {
      aiLogger.debug('Extracted JSON parse failed');
    }
  }

  // Method 4: Fallback - return text as-is with basic structure
  aiLogger.warn('All JSON parsing methods failed, using fallback');
  return {
    success: false,
    data: {
      rawResponse: content.substring(0, 5000), // Limit size
      error: 'Could not parse as JSON',
      timestamp: new Date().toISOString(),
    },
    rawText: content,
    parseMethod: 'fallback',
  };
}

/**
 * Clean common JSON formatting issues
 */
function cleanMalformedJSON(jsonString: string): string {
  // Remove trailing commas before closing braces/brackets
  let cleaned = jsonString.replace(/,(\s*[}\]])/g, '$1');

  // Fix single-quoted JSON keys to double quotes (common in AI responses)
  // Only replace single quotes used as key delimiters, not apostrophes in values
  cleaned = cleaned.replace(/'([a-zA-Z_][a-zA-Z0-9_]*)'(\s*:)/g, '"$1"$2');

  // Remove newlines within strings (can break JSON)
  // This is a simple approach, more sophisticated parsing might be needed
  cleaned = cleaned.replace(/\n/g, ' ');

  return cleaned;
}

/**
 * Validate required fields in parsed data
 */
export function validateParsedData(data: any, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  return requiredFields.every(field => {
    const value = data[field];
    return value !== undefined && value !== null;
  });
}

/**
 * Extract specific field with fallback
 */
export function extractFieldSafely<T>(data: any, field: string, fallback: T): T {
  try {
    const value = data[field];
    return value !== undefined && value !== null ? value : fallback;
  } catch {
    return fallback;
  }
}
