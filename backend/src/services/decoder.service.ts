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
  | 'base32'
  | 'html'
  | 'hex'
  | 'binary'
  | 'octal'
  | 'decimal'
  | 'unicode'
  | 'rot13'
  | 'morse'
  | 'jwt'
  | 'json'
  | 'gzip'
  | 'reverse';

export type HashType = 'md5' | 'sha1' | 'sha256' | 'sha512' | 'sha3-256' | 'sha3-512' | 'blake2b512';

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
   * Base32 Encode
   */
  base32Encode(input: string): EncodeResult {
    try {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const bytes = Buffer.from(input, 'utf-8');
      let bits = 0;
      let value = 0;
      let output = '';

      for (let i = 0; i < bytes.length; i++) {
        value = (value << 8) | bytes[i];
        bits += 8;

        while (bits >= 5) {
          output += alphabet[(value >>> (bits - 5)) & 31];
          bits -= 5;
        }
      }

      if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
      }

      while (output.length % 8 !== 0) {
        output += '=';
      }

      decoderLogger.debug('Base32 encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Base32 encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Base32 Decode
   */
  base32Decode(input: string): DecodeResult {
    try {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      input = input.toUpperCase().replace(/=+$/, '');
      let bits = 0;
      let value = 0;
      const output: number[] = [];

      for (let i = 0; i < input.length; i++) {
        const idx = alphabet.indexOf(input[i]);
        if (idx === -1) throw new Error('Invalid Base32 character');

        value = (value << 5) | idx;
        bits += 5;

        if (bits >= 8) {
          output.push((value >>> (bits - 8)) & 255);
          bits -= 8;
        }
      }

      decoderLogger.debug('Base32 decoded', { inputLength: input.length });
      return { success: true, output: Buffer.from(output).toString('utf-8') };
    } catch (error) {
      decoderLogger.error('Base32 decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Binary Encode
   */
  binaryEncode(input: string): EncodeResult {
    try {
      const output = input
        .split('')
        .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ');

      decoderLogger.debug('Binary encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Binary encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Binary Decode
   */
  binaryDecode(input: string): DecodeResult {
    try {
      const output = input
        .replace(/\s/g, '')
        .match(/.{1,8}/g)
        ?.map((byte) => String.fromCharCode(parseInt(byte, 2)))
        .join('') || '';

      decoderLogger.debug('Binary decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Binary decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Octal Encode
   */
  octalEncode(input: string): EncodeResult {
    try {
      const output = input
        .split('')
        .map((char) => '\\' + char.charCodeAt(0).toString(8).padStart(3, '0'))
        .join('');

      decoderLogger.debug('Octal encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Octal encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Octal Decode
   */
  octalDecode(input: string): DecodeResult {
    try {
      const output = input.replace(/\\([0-7]{1,3})/g, (match, oct) => {
        return String.fromCharCode(parseInt(oct, 8));
      });

      decoderLogger.debug('Octal decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Octal decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Decimal (ASCII codes) Encode
   */
  decimalEncode(input: string): EncodeResult {
    try {
      const output = input
        .split('')
        .map((char) => char.charCodeAt(0))
        .join(' ');

      decoderLogger.debug('Decimal encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Decimal encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Decimal (ASCII codes) Decode
   */
  decimalDecode(input: string): DecodeResult {
    try {
      const output = input
        .split(/\s+/)
        .map((num) => String.fromCharCode(parseInt(num, 10)))
        .join('');

      decoderLogger.debug('Decimal decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Decimal decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * ROT13 Encode/Decode (same operation)
   */
  rot13(input: string): EncodeResult {
    try {
      const output = input.replace(/[a-zA-Z]/g, (char) => {
        const code = char.charCodeAt(0);
        const base = code >= 97 ? 97 : 65;
        return String.fromCharCode(((code - base + 13) % 26) + base);
      });

      decoderLogger.debug('ROT13 processed', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('ROT13 failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Morse Code Encode
   */
  morseEncode(input: string): EncodeResult {
    try {
      const morseCode: Record<string, string> = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.', ' ': '/'
      };

      const output = input
        .toUpperCase()
        .split('')
        .map((char) => morseCode[char] || char)
        .join(' ');

      decoderLogger.debug('Morse encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Morse encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Morse Code Decode
   */
  morseDecode(input: string): DecodeResult {
    try {
      const morseCode: Record<string, string> = {
        '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
        '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
        '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
        '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
        '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
        '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
        '---..': '8', '----.': '9', '/': ' '
      };

      const output = input
        .split(' ')
        .map((code) => morseCode[code] || code)
        .join('');

      decoderLogger.debug('Morse decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Morse decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reverse String
   */
  reverseString(input: string): EncodeResult {
    try {
      const output = input.split('').reverse().join('');
      decoderLogger.debug('String reversed', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Reverse failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * JSON Prettify/Minify
   */
  jsonFormat(input: string, minify = false): EncodeResult {
    try {
      const parsed = JSON.parse(input);
      const output = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);

      decoderLogger.debug('JSON formatted', { minify, inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('JSON format failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  }

  /**
   * Gzip Compress
   */
  gzipEncode(input: string): EncodeResult {
    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(Buffer.from(input, 'utf-8'));
      const output = compressed.toString('base64');

      decoderLogger.debug('Gzip encoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Gzip encode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gzip Decompress
   */
  gzipDecode(input: string): DecodeResult {
    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(input, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      const output = decompressed.toString('utf-8');

      decoderLogger.debug('Gzip decoded', { inputLength: input.length });
      return { success: true, output };
    } catch (error) {
      decoderLogger.error('Gzip decode failed', { error });
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Hash - MD5, SHA1, SHA256, SHA512, SHA3-256, SHA3-512, BLAKE2b512
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
   * Auto-detect encoding type with advanced pattern recognition
   */
  autoDetect(input: string): EncodingType | null {
    // JWT - three base64url parts separated by dots (check first for specificity)
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(input)) {
      return 'jwt';
    }

    // Gzip (base64 encoded) - starts with H4sI (gzip magic number)
    if (/^H4sI/.test(input)) {
      return 'gzip';
    }

    // Morse code - contains dots, dashes, and slashes
    if (/^[\.\-\s\/]+$/.test(input) && /[\.\-]/.test(input)) {
      return 'morse';
    }

    // Binary - only 0s and 1s in groups of 8
    if (/^[01\s]+$/.test(input.replace(/\s/g, '')) && input.replace(/\s/g, '').length % 8 === 0) {
      return 'binary';
    }

    // URL encoded - contains % followed by hex
    if (/%[0-9A-Fa-f]{2}/.test(input)) {
      return 'url';
    }

    // HTML entities - contains &...;
    if (/&[a-z]+;|&#x?[0-9a-fA-F]+;/.test(input)) {
      return 'html';
    }

    // Unicode escapes - contains \uXXXX
    if (/\\u[0-9a-fA-F]{4}/.test(input)) {
      return 'unicode';
    }

    // Octal escapes - contains \000 to \777
    if (/\\[0-7]{3}/.test(input)) {
      return 'octal';
    }

    // Base32 - only A-Z and 2-7 with = padding, length divisible by 8
    if (/^[A-Z2-7]+=*$/.test(input) && input.length % 8 === 0) {
      return 'base32';
    }

    // Base64 - only alphanumeric + / + = with proper padding
    if (/^[A-Za-z0-9+/]+=*$/.test(input) && input.length % 4 === 0 && input.length > 3) {
      return 'base64';
    }

    // Decimal (ASCII codes) - space-separated numbers (32-126 range for printable ASCII)
    if (/^\d+(\s+\d+)+$/.test(input)) {
      const nums = input.split(/\s+/).map(n => parseInt(n, 10));
      if (nums.every(n => n >= 0 && n <= 127)) {
        return 'decimal';
      }
    }

    // Hex - only 0-9 a-f A-F, even length, minimum 4 chars
    if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0 && input.length >= 4) {
      return 'hex';
    }

    // JSON - starts with { or [
    if (/^\s*[\{\[]/.test(input)) {
      try {
        JSON.parse(input);
        return 'json';
      } catch {
        // Not valid JSON
      }
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
      case 'base32':
        result = this.base32Decode(input);
        break;
      case 'html':
        result = this.htmlDecode(input);
        break;
      case 'hex':
        result = this.hexDecode(input);
        break;
      case 'binary':
        result = this.binaryDecode(input);
        break;
      case 'octal':
        result = this.octalDecode(input);
        break;
      case 'decimal':
        result = this.decimalDecode(input);
        break;
      case 'unicode':
        result = this.unicodeDecode(input);
        break;
      case 'rot13':
        result = this.rot13(input);
        break;
      case 'morse':
        result = this.morseDecode(input);
        break;
      case 'gzip':
        result = this.gzipDecode(input);
        break;
      case 'json':
        result = this.jsonFormat(input, false);
        break;
      case 'jwt':
        // JWT decode (decode all parts: header + payload)
        try {
          const parts = input.split('.');
          if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
          }
          const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          result = {
            success: true,
            output: JSON.stringify({ header, payload }, null, 2),
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
            case 'base32':
              result = this.base32Encode(current);
              break;
            case 'html':
              result = this.htmlEncode(current);
              break;
            case 'hex':
              result = this.hexEncode(current);
              break;
            case 'binary':
              result = this.binaryEncode(current);
              break;
            case 'octal':
              result = this.octalEncode(current);
              break;
            case 'decimal':
              result = this.decimalEncode(current);
              break;
            case 'unicode':
              result = this.unicodeEncode(current);
              break;
            case 'rot13':
              result = this.rot13(current);
              break;
            case 'morse':
              result = this.morseEncode(current);
              break;
            case 'reverse':
              result = this.reverseString(current);
              break;
            case 'json':
              result = this.jsonFormat(current, false);
              break;
            case 'gzip':
              result = this.gzipEncode(current);
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
            case 'base32':
              result = this.base32Decode(current);
              break;
            case 'html':
              result = this.htmlDecode(current);
              break;
            case 'hex':
              result = this.hexDecode(current);
              break;
            case 'binary':
              result = this.binaryDecode(current);
              break;
            case 'octal':
              result = this.octalDecode(current);
              break;
            case 'decimal':
              result = this.decimalDecode(current);
              break;
            case 'unicode':
              result = this.unicodeDecode(current);
              break;
            case 'rot13':
              result = this.rot13(current);
              break;
            case 'morse':
              result = this.morseDecode(current);
              break;
            case 'reverse':
              result = this.reverseString(current);
              break;
            case 'json':
              result = this.jsonFormat(current, false);
              break;
            case 'gzip':
              result = this.gzipDecode(current);
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
