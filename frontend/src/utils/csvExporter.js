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

export function exportReportToCSV(reportData, type) {
  if (!reportData || !reportData.length) {
    alert('No report data to export.');
    return;
  }

  const dateHeader = type === 'daily' ? 'Date' : 'Month';
  const headers = [dateHeader, 'Sales Transactions', 'Total Revenue ($)', 'Total COGS ($)', 'Net Profit ($)', 'Avg Transaction Value ($)'];
  
  const rows = reportData.map(r => [
    r.date,
    r.txCount,
    r.revenue.toFixed(2),
    r.cost.toFixed(2),
    r.profit.toFixed(2),
    r.txCount > 0 ? (r.revenue / r.txCount).toFixed(2) : '0.00'
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const filePrefix = type === 'daily' ? 'daily_sales' : 'monthly_sales';
  downloadCSV(csvContent, `zad_stock_${filePrefix}_report_${new Date().toISOString().split('T')[0]}.csv`);
}
