/**
 * Export utilities for Intruder results
 * Provides CSV and JSON export functionality
 */

export interface ExportableResult {
  id: string;
  payloadSet: string[];
  statusCode: number | null;
  responseLength: number | null;
  responseTime: number | null;
  timestamp: Date | string;
  error?: string;
}

/**
 * Export results to CSV format
 */
export function exportToCSV(results: ExportableResult[], filename: string): void {
  // CSV Headers
  const headers = ['#', 'Payload', 'Status Code', 'Response Length', 'Response Time (ms)', 'Timestamp', 'Error'];

  // CSV Rows
  const rows = results.map((result, index) => {
    const timestamp = result.timestamp instanceof Date
      ? result.timestamp.toISOString()
      : result.timestamp;

    return [
      index + 1,
      `"${result.payloadSet.join(', ')}"`, // Quote for CSV safety
      result.statusCode ?? 'N/A',
      result.responseLength ?? 0,
      result.responseTime ?? 0,
      timestamp,
      result.error ? `"${result.error}"` : '',
    ];
  });

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Trigger download
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export results to JSON format
 */
export function exportToJSON(results: ExportableResult[], filename: string): void {
  const jsonContent = JSON.stringify(results, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(campaignName: string, format: 'csv' | 'json'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const sanitizedName = campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${sanitizedName}_${timestamp}.${format}`;
}
