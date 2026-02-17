import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Calendar, Download, Printer, ChevronRight, FileText } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('daily'); // 'daily' | 'monthly'
  
  // Date Filters (default: last 30 days)
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportType, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      // Mock data for layout shell on Feb 17 Commit 1
      setReportData([
        { date: '2026-02-17', txCount: 12, revenue: 1540.00, cost: 980.00, profit: 560.00 },
        { date: '2026-02-16', txCount: 8, revenue: 840.50, cost: 510.00, profit: 330.50 }
      ]);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="module-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>Reports & Analytics</h2>
          <p className="subtitle">View financial metrics, sales reports, and export spreadsheets</p>
        </div>
      </div>

      {/* Date Filter & Tab Bar */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button 
            className={`btn ${reportType === 'daily' ? 'btn-primary' : ''}`}
            onClick={() => setReportType('daily')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' }}
          >
            Daily Report
          </button>
          <button 
            className={`btn ${reportType === 'monthly' ? 'btn-primary' : ''}`}
            onClick={() => setReportType('monthly')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' }}
          >
            Monthly Report
          </button>
        </div>

        {/* Date Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.8125rem' }}
            />
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.375rem 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* Reports Table Placeholder */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>{reportType === 'daily' ? 'Date' : 'Month'}</th>
              <th className="text-right">Sales Transactions</th>
              <th className="text-right">Total Revenue</th>
              <th className="text-right">Total COGS</th>
              <th className="text-right">Net Profit</th>
              <th className="text-right">Avg Trans Value</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{row.date}</td>
                <td className="text-right">{row.txCount}</td>
                <td className="text-right">${row.revenue.toFixed(2)}</td>
                <td className="text-right">${row.cost.toFixed(2)}</td>
                <td className="text-right font-semibold" style={{ color: 'var(--primary-color)' }}>${row.profit.toFixed(2)}</td>
                <td className="text-right">${(row.revenue / row.txCount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
