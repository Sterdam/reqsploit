/**
 * Decoder Service
 * Handles encoding, decoding, and hashing operations
 */

import crypto from 'crypto';
import logger from '../utils/logger.js';

const decoderLogger = logger.child({ service: 'decoder' });

export type EncodingType =
  | 'url'
  | 'base64'
  | 'html'
  | 'hex'
  | 'unicode'
  | 'jwt';

export type HashType = 'md5' | 'sha1' | 'sha256' | 'sha512';

export interface DecodeResult {
  success: boolean;
  output: string;
  detectedEncoding?: EncodingType;
  error?: string;
}

export interface EncodeResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface HashResult {
  success: boolean;
  output: string;
  algorithm: HashType;
  error?: string;
}

export class DecoderService {
  /**
   * URL Encode
   */
  urlEncode(input: string): EncodeResult {
    try {
      const output = encodeURIComponent(input);
      decoderLogger.debug('URL encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('URL encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * URL Decode
   */
  urlDecode(input: string): DecodeResult {
    try {
      const output = decodeURIComponent(input);
      decoderLogger.debug('URL decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('URL decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Base64 Encode
   */
  base64Encode(input: string): EncodeResult {
    try {
      const output = Buffer.from(input, 'utf-8').toString('base64');
      decoderLogger.debug('Base64 encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Base64 encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Base64 Decode
   */
  base64Decode(input: string): DecodeResult {
    try {
      const output = Buffer.from(input, 'base64').toString('utf-8');
      decoderLogger.debug('Base64 decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Base64 decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * HTML Entity Encode
   */
  htmlEncode(input: string): EncodeResult {
    try {
      const output = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

      decoderLogger.debug('HTML encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('HTML encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * HTML Entity Decode
   */
  htmlDecode(input: string): DecodeResult {
    try {
      const output = input
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');

      decoderLogger.debug('HTML decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('HTML decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Hex Encode
   */
  hexEncode(input: string): EncodeResult {
    try {
      const output = Buffer.from(input, 'utf-8').toString('hex');
      decoderLogger.debug('Hex encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Hex encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Hex Decode
   */
  hexDecode(input: string): DecodeResult {
    try {
      const output = Buffer.from(input, 'hex').toString('utf-8');
      decoderLogger.debug('Hex decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Hex decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unicode Escape Encode
   */
  unicodeEncode(input: string): EncodeResult {
    try {
      const output = input
        .split('')
        .map((char) => {
          const code = char.charCodeAt(0);
          return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
        })
        .join('');

      decoderLogger.debug('Unicode encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Unicode encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unicode Escape Decode
   */
  unicodeDecode(input: string): DecodeResult {
    try {
      const output = input.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
        return String.fromCharCode(parseInt(code, 16));
      });

      decoderLogger.debug('Unicode decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Unicode decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Hash - MD5, SHA1, SHA256, SHA512
   */
  hash(input: string, algorithm: HashType): HashResult {
    try {
      const hash = crypto.createHash(algorithm);
      hash.update(input);
      const output = hash.digest('hex');

      decoderLogger.debug('Hashed', { algorithm, inputLength: input.length });
      return { success: true, output, algorithm };
    } catch (error) {
      decoderLogger.error('Hash failed', { algorithm, error });
      return {
        success: false,
        output: '',
        algorithm,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Auto-detect encoding type
   */
  autoDetect(input: string): EncodingType | null {
    // URL encoded - contains % followed by hex
    if (/%[0-9A-Fa-f]{2}/.test(input)) {
      return 'url';
    }

    // Base64 - only alphanumeric + / + = with proper padding
    if (/^[A-Za-z0-9+/]+=*$/.test(input) && input.length % 4 === 0) {
      return 'base64';
    }

    // HTML entities - contains &...;
    if (/&[a-z]+;|&#x?[0-9a-fA-F]+;/.test(input)) {
      return 'html';
    }

    // Hex - only 0-9 a-f A-F, even length
    if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0) {
      return 'hex';
    }

    // Unicode escapes - contains \uXXXX
    if (/\\u[0-9a-fA-F]{4}/.test(input)) {
      return 'unicode';
    }

    // JWT - three base64 parts separated by dots
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(input)) {
      return 'jwt';
    }

    return null;
  }

  /**
   * Smart decode - auto-detect and decode
   */
  smartDecode(input: string): DecodeResult {
    const detected = this.autoDetect(input);

    if (!detected) {
      return {
        success: false,
        output: '',
        error: 'Could not detect encoding type',
      };
    }

    let result: DecodeResult;

    switch (detected) {
      case 'url':
        result = this.urlDecode(input);
        break;
      case 'base64':
        result = this.base64Decode(input);
        break;
      case 'html':
        result = this.htmlDecode(input);
        break;
      case 'hex':
        result = this.hexDecode(input);
        break;
      case 'unicode':
        result = this.unicodeDecode(input);
        break;
      case 'jwt':
        // JWT decode (just decode payload, don't verify)
        try {
          const parts = input.split('.');
          const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
          result = {
            success: true,
            output: JSON.stringify(JSON.parse(payload), null, 2),
            detectedEncoding: 'jwt',
          };
        } catch (error) {
          result = {
            success: false,
            output: '',
            error: 'Invalid JWT',
          };
        }
        break;
      default:
        result = {
          success: false,
          output: '',
          error: 'Unsupported encoding type',
        };
    }

    return { ...result, detectedEncoding: detected };
  }

  /**
   * Chain operations - apply multiple encodings in sequence
   */
  chain(
    input: string,
    operations: Array<{ type: 'encode' | 'decode'; encoding: EncodingType }>
  ): { success: boolean; output: string; steps: string[]; error?: string } {
    let current = input;
    const steps: string[] = [];

    try {
      for (const op of operations) {
        let result: EncodeResult | DecodeResult;

        if (op.type === 'encode') {
          switch (op.encoding) {
            case 'url':
              result = this.urlEncode(current);
              break;
            case 'base64':
              result = this.base64Encode(current);
              break;
            case 'html':
              result = this.htmlEncode(current);
              break;
            case 'hex':
              result = this.hexEncode(current);
              break;
            case 'unicode':
              result = this.unicodeEncode(current);
              break;
            default:
              throw new Error(`Unsupported encoding: ${op.encoding}`);
          }
        } else {
          switch (op.encoding) {
            case 'url':
              result = this.urlDecode(current);
              break;
            case 'base64':
              result = this.base64Decode(current);
              break;
            case 'html':
              result = this.htmlDecode(current);
              break;
            case 'hex':
              result = this.hexDecode(current);
              break;
            case 'unicode':
              result = this.unicodeDecode(current);
              break;
            default:
              throw new Error(`Unsupported decoding: ${op.encoding}`);
          }
        }

        if (!result.success) {
          throw new Error(result.error || 'Operation failed');
        }

        current = result.output;
        steps.push(`${op.type} ${op.encoding}`);
      }

      return { success: true, output: current, steps };
    } catch (error) {
      decoderLogger.error('Chain operation failed', { error, steps });
      return {
        success: false,
        output: '',
        steps,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const decoderService = new DecoderService();
