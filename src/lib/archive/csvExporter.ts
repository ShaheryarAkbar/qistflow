// ============================================================================
// Library: RFC 4180 Compliant CSV Exporter
// Includes UTF-8 BOM (\uFEFF) for authentic Urdu text compatibility in Microsoft Excel.
// ============================================================================

export function convertToCSV<T extends Record<string, any>>(
  rows: T[],
  columnKeys: (keyof T)[],
  columnHeaders?: string[]
): string {
  if (rows.length === 0) return '\uFEFF';

  const headers = columnHeaders || (columnKeys as string[]);

  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    const stringValue = String(value);
    // If value contains comma, quotes, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headerLine = headers.map(escapeCSVValue).join(',');

  const dataLines = rows.map((row) =>
    columnKeys.map((key) => escapeCSVValue(row[key])).join(',')
  );

  // Prepend UTF-8 BOM so Excel opens Urdu text cleanly
  return `\uFEFF${headerLine}\r\n${dataLines.join('\r\n')}`;
}

export function downloadBlob(content: BlobPart, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

