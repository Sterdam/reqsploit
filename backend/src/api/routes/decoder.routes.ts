import { Router, Request, Response } from 'express';
import {
  decoderService,
  type EncodingType,
  type HashType,
} from '../../services/decoder.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/errors.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /decoder/encode
 * Encode text with specified encoding
 */
router.post(
  '/encode',
  asyncHandler(async (req: Request, res: Response) => {
    const { input, encoding } = req.body;

    if (!input || !encoding) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: input, encoding',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    let result;

    switch (encoding as EncodingType) {
      case 'url':
        result = decoderService.urlEncode(input);
        break;
      case 'base64':
        result = decoderService.base64Encode(input);
        break;
      case 'html':
        result = decoderService.htmlEncode(input);
        break;
      case 'hex':
        result = decoderService.hexEncode(input);
        break;
      case 'unicode':
        result = decoderService.unicodeEncode(input);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: {
            message: `Unsupported encoding type: ${encoding}`,
            code: 'VALIDATION_ERROR',
          },
        });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: result.error || 'Encoding failed',
          code: 'ENCODING_ERROR',
        },
      });
    }

    res.json({
      success: true,
      data: {
        input,
        output: result.output,
        encoding,
      },
    });
  })
);

/**
 * POST /decoder/decode
 * Decode text with specified encoding (or auto-detect)
 */
router.post(
  '/decode',
  asyncHandler(async (req: Request, res: Response) => {
    const { input, encoding } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required field: input',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    let result;

    // Auto-detect if no encoding specified
    if (!encoding || encoding === 'auto') {
      result = decoderService.smartDecode(input);
    } else {
      switch (encoding as EncodingType) {
        case 'url':
          result = decoderService.urlDecode(input);
          break;
        case 'base64':
          result = decoderService.base64Decode(input);
          break;
        case 'html':
          result = decoderService.htmlDecode(input);
          break;
        case 'hex':
          result = decoderService.hexDecode(input);
          break;
        case 'unicode':
          result = decoderService.unicodeDecode(input);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: {
              message: `Unsupported encoding type: ${encoding}`,
              code: 'VALIDATION_ERROR',
            },
          });
      }
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: result.error || 'Decoding failed',
          code: 'DECODING_ERROR',
        },
      });
    }

    res.json({
      success: true,
      data: {
        input,
        output: result.output,
        encoding: result.detectedEncoding || encoding,
      },
    });
  })
);

/**
 * POST /decoder/hash
 * Hash text with specified algorithm
 */
router.post(
  '/hash',
  asyncHandler(async (req: Request, res: Response) => {
    const { input, algorithm } = req.body;

    if (!input || !algorithm) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: input, algorithm',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const validAlgorithms: HashType[] = ['md5', 'sha1', 'sha256', 'sha512'];
    if (!validAlgorithms.includes(algorithm)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid algorithm. Must be one of: ${validAlgorithms.join(', ')}`,
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const result = decoderService.hash(input, algorithm);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: result.error || 'Hashing failed',
          code: 'HASHING_ERROR',
        },
      });
    }

    res.json({
      success: true,
      data: {
        input,
        output: result.output,
        algorithm: result.algorithm,
      },
    });
  })
);

/**
 * POST /decoder/chain
 * Chain multiple encoding/decoding operations
 */
router.post(
  '/chain',
  asyncHandler(async (req: Request, res: Response) => {
    const { input, operations } = req.body;

    if (!input || !operations || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing or invalid fields: input, operations (array)',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const result = decoderService.chain(input, operations);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: result.error || 'Chain operation failed',
          code: 'CHAIN_ERROR',
        },
      });
    }

    res.json({
      success: true,
      data: {
        input,
        output: result.output,
        steps: result.steps,
      },
    });
  })
);

/**
 * POST /decoder/auto-detect
 * Auto-detect encoding type
 */
router.post(
  '/auto-detect',
  asyncHandler(async (req: Request, res: Response) => {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required field: input',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const detected = decoderService.autoDetect(input);

    res.json({
      success: true,
      data: {
        input,
        detectedEncoding: detected,
      },
    });
  })
);

export default router;
