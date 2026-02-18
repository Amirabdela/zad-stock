/**
 * Trigger browser download for a raw string as a CSV file.
 * @param {string} csvContent - The raw CSV text content
 * @param {string} fileName - The downloaded file name
 */
export function downloadCSV(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert products array to CSV format and download.
 * @param {Array} products - Array of product objects
 */
export function exportProductsToCSV(products) {
  if (!products || !products.length) {
    alert('No product data to export.');
    return;
  }

  const headers = ['Product ID', 'Name', 'Category', 'Cost Price ($)', 'Selling Price ($)', 'Quantity In Stock', 'Last Updated'];
  
  const rows = products.map(p => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`, // escape quotes
    `"${(p.category || 'Uncategorized').replace(/"/g, '""')}"`,
    p.cost_price.toFixed(2),
    p.selling_price.toFixed(2),
    p.quantity,
    new Date(p.updated_at).toLocaleString()
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCSV(csvContent, `zad_stock_inventory_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export reports placeholder for Feb 18 Commit 2.
 */
export function exportReportToCSV(reportData, type) {
  console.log('Report export placeholder called', reportData, type);
}
