import { ColumnDef } from "@tanstack/react-table";

/**
 * Export data to CSV format and trigger download
 * @param columns Table columns definitions
 * @param data Array of data to export
 * @param filename Filename for the downloaded CSV (without extension)
 */
export function exportToCSV<TData>(
  columns: ColumnDef<TData, any>[],
  data: TData[],
  filename: string = "export"
) {
  // Filter visible columns that should be included in export
  const exportColumns = columns.filter(
    (column) => 
      // Skip action columns and columns explicitly marked as not exportable
      !column.id?.includes("actions") && 
      !(column.meta as any)?.skipExport
  );

  // Create header row
  const headers = exportColumns.map(column => {
    // Use header accessor or column ID
    return (typeof column.header === 'function' 
      ? column.id
      : column.header as string) || column.id;
  });

  // Process data rows
  const rows = data.map(item => {
    return exportColumns.map(column => {
      const accessorKey = (column as any).accessorKey;
      const value = getNestedProperty(item, accessorKey);
      return formatCellValueForCSV(value);
    });
  });
  

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Access a nested property of an object using a string path with dot notation
 * @param obj The object to access
 * @param path Path to the property (e.g. "user.address.city")
 */
function getNestedProperty(obj: any, path: string): any {
  const keys = path.split('.');
  return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);
}

/**
 * Format cell value for CSV export
 */
function formatCellValueForCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle dates
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  // Convert to string and escape quotes
  const stringValue = String(value).replace(/"/g, '""');
  
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue}"`;
  }
  
  return stringValue;
} 