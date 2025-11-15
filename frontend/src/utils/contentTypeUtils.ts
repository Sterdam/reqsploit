/**
 * Content-Type Detection and Utilities
 * Helps determine the best viewing mode for HTTP responses
 */

export type ContentCategory = 'json' | 'xml' | 'html' | 'css' | 'javascript' | 'text' | 'binary' | 'image';

export interface ContentTypeInfo {
  category: ContentCategory;
  mimeType: string;
  canPrettify: boolean;
  canRender: boolean;
  isBinary: boolean;
  suggestedMode: 'raw' | 'pretty' | 'rendered' | 'hex';
}

/**
 * Detect content type from response headers
 */
export function detectContentType(headers: Record<string, string>): ContentTypeInfo {
  const contentType = (headers['content-type'] || headers['Content-Type'] || '').toLowerCase();

  // JSON
  if (contentType.includes('application/json') || contentType.includes('application/ld+json')) {
    return {
      category: 'json',
      mimeType: contentType,
      canPrettify: true,
      canRender: false,
      isBinary: false,
      suggestedMode: 'pretty',
    };
  }

  // XML
  if (contentType.includes('xml') || contentType.includes('application/soap+xml')) {
    return {
      category: 'xml',
      mimeType: contentType,
      canPrettify: true,
      canRender: false,
      isBinary: false,
      suggestedMode: 'pretty',
    };
  }

  // HTML
  if (contentType.includes('text/html')) {
    return {
      category: 'html',
      mimeType: contentType,
      canPrettify: true,
      canRender: true,
      isBinary: false,
      suggestedMode: 'rendered',
    };
  }

  // CSS
  if (contentType.includes('text/css')) {
    return {
      category: 'css',
      mimeType: contentType,
      canPrettify: true,
      canRender: false,
      isBinary: false,
      suggestedMode: 'pretty',
    };
  }

  // JavaScript
  if (contentType.includes('javascript') || contentType.includes('application/x-javascript')) {
    return {
      category: 'javascript',
      mimeType: contentType,
      canPrettify: true,
      canRender: false,
      isBinary: false,
      suggestedMode: 'pretty',
    };
  }

  // Images
  if (contentType.includes('image/')) {
    return {
      category: 'image',
      mimeType: contentType,
      canPrettify: false,
      canRender: true,
      isBinary: true,
      suggestedMode: 'hex',
    };
  }

  // Binary data
  if (contentType.includes('application/octet-stream') ||
      contentType.includes('application/pdf') ||
      contentType.includes('application/zip')) {
    return {
      category: 'binary',
      mimeType: contentType,
      canPrettify: false,
      canRender: false,
      isBinary: true,
      suggestedMode: 'hex',
    };
  }

  // Plain text (default)
  return {
    category: 'text',
    mimeType: contentType || 'text/plain',
    canPrettify: false,
    canRender: false,
    isBinary: false,
    suggestedMode: 'raw',
  };
}

/**
 * Format JSON with proper indentation
 */
export function formatJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
}

/**
 * Format XML with proper indentation
 */
export function formatXml(xmlString: string): string {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const serializer = new XMLSerializer();
    let formatted = serializer.serializeToString(xmlDoc);

    // Basic indentation
    let indent = 0;
    formatted = formatted.replace(/(<\w[^>]*>)([^<]*)/g, (_match, tag, content) => {
      const indentStr = '  '.repeat(indent);
      if (tag.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        return '\n' + '  '.repeat(indent) + tag + content;
      }
      const result = '\n' + indentStr + tag + content;
      if (!tag.endsWith('/>') && !tag.startsWith('</')) {
        indent++;
      }
      return result;
    });

    return formatted.trim();
  } catch {
    return xmlString;
  }
}

/**
 * Format HTML with proper indentation
 */
export function formatHtml(htmlString: string): string {
  try {
    // Simple HTML formatting
    let formatted = htmlString;
    let indent = 0;

    formatted = formatted.replace(/>[\s]*</g, '>\n<');
    formatted = formatted.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // Closing tag
      if (trimmed.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        return '  '.repeat(indent) + trimmed;
      }

      const result = '  '.repeat(indent) + trimmed;

      // Opening tag (not self-closing)
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
        indent++;
      }

      return result;
    }).join('\n');

    return formatted;
  } catch {
    return htmlString;
  }
}

/**
 * Convert string to hex dump format
 */
export function toHexDump(data: string, bytesPerLine = 16): string {
  const lines: string[] = [];
  const bytes = new TextEncoder().encode(data);

  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const offset = i.toString(16).padStart(8, '0');
    const chunk = bytes.slice(i, i + bytesPerLine);

    // Hex values
    const hex = Array.from(chunk)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(bytesPerLine * 3, ' ');

    // ASCII representation
    const ascii = Array.from(chunk)
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('');

    lines.push(`${offset}  ${hex}  |${ascii}|`);
  }

  return lines.join('\n');
}

/**
 * Calculate response size in human-readable format
 */
export function formatResponseSize(body: string, headers: Record<string, string>): string {
  const contentLength = headers['content-length'] || headers['Content-Length'];
  const size = contentLength ? parseInt(contentLength) : new TextEncoder().encode(body).length;

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
