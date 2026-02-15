import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { DollarSign, Percent, Package, AlertTriangle, TrendingUp, Award } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    cost: 0,
    profit: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [trendData, setTrendData] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    window.addEventListener('sync-done', loadMetrics);
    return () => window.removeEventListener('sync-done', loadMetrics);
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // 1. Query stock & product metrics from local IndexedDB
      const totalProducts = await db.products.count();
      const lowStockCount = await db.products.filter(p => p.quantity > 0 && p.quantity < 10).count();
      const outOfStockCount = await db.products.filter(p => p.quantity === 0).count();

      // 2. Query sales and calculate revenue, cost, profit
      const sales = await db.sales.toArray();
      let revenue = 0;
      let cost = 0;
      let profit = 0;
      for (const sale of sales) {
        revenue += sale.total_amount;
        cost += sale.total_cost;
        profit += sale.total_profit;
      }

      // 3. Query sales history for trend chart (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
        
        const daySales = sales.filter(s => s.timestamp >= startOfDay && s.timestamp < endOfDay);
        const dayRevenue = daySales.reduce((sum, s) => sum + s.total_amount, 0);
        
        last7Days.push({ date: dateStr, amount: dayRevenue });
      }

      setMetrics({
        revenue,
        cost,
        profit,
        totalProducts,
        lowStockCount,
        outOfStockCount
      });
      setTrendData(last7Days);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="module-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>Dashboard Overview</h2>
          <p className="subtitle">Real-time business performance analytics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div 
        className="stats-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1.5rem' 
        }}
      >
        {/* Revenue Card */}
        <div className="stat-card" style={statCardStyle}>
          <div style={statCardHeaderStyle}>
            <span style={statCardTitleStyle}>Total Revenue</span>
            <div style={{ ...iconWrapperStyle, backgroundColor: 'var(--secondary-light)', color: 'var(--secondary-color)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={statCardValueStyle}>${metrics.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={statCardFooterStyle}>
            <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>+12.5%</span> vs last month
          </div>
        </div>

        {/* Cost Card */}
        <div className="stat-card" style={statCardStyle}>
          <div style={statCardHeaderStyle}>
            <span style={statCardTitleStyle}>Total COGS</span>
            <div style={{ ...iconWrapperStyle, backgroundColor: '#f1f5f9', color: 'var(--text-muted)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={statCardValueStyle}>${metrics.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={statCardFooterStyle}>
            Cost of Goods Sold
          </div>
        </div>

        {/* Profit Card */}
        <div className="stat-card" style={statCardStyle}>
          <div style={statCardHeaderStyle}>
            <span style={statCardTitleStyle}>Net Profit</span>
            <div style={{ ...iconWrapperStyle, backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
              <Percent size={20} />
            </div>
          </div>
          <div style={{ ...statCardValueStyle, color: 'var(--primary-color)' }}>
            ${metrics.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={statCardFooterStyle}>
            Margin: {metrics.revenue > 0 ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : '0.0'}%
          </div>
        </div>

        {/* Stock Status Card */}
        <div className="stat-card" style={statCardStyle}>
          <div style={statCardHeaderStyle}>
            <span style={statCardTitleStyle}>Stock Status</span>
            <div style={{ ...iconWrapperStyle, backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={statCardValueStyle}>{metrics.totalProducts} Products</div>
          <div style={statCardFooterStyle}>
            {metrics.outOfStockCount > 0 ? (
              <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}>{metrics.outOfStockCount} Out of stock!</span>
            ) : metrics.lowStockCount > 0 ? (
              <span style={{ color: 'var(--warning-color)', fontWeight: '600' }}>{metrics.lowStockCount} Low stock alerts</span>
            ) : (
              <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>All stock levels normal</span>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid (Charts and Lists Slots) */}
      <div 
        className="details-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '7fr 5fr', 
          gap: '1.5rem' 
        }}
      >
        {/* Sales Trend Chart Shell */}
        <div className="chart-card" style={detailCardStyle}>
          <div style={detailCardHeaderStyle}>
            <h3 style={detailCardTitleStyle}><TrendingUp size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-color)' }} /> Sales Trends</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', margin: '1rem' }}>
            Interactive Sales Chart Slot (Planned for Feb 15)
          </div>
        </div>

        {/* Best Selling & Alert Widgets Shell */}
        <div className="widgets-card" style={detailCardStyle}>
          <div style={detailCardHeaderStyle}>
            <h3 style={detailCardTitleStyle}><Award size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--warning-color)' }} /> Product Highlights</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', margin: '1rem' }}>
            Best Sellers & Alerts Slot (Planned for Feb 15–16)
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Styles
const statCardStyle = {
  backgroundColor: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const statCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const statCardTitleStyle = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const iconWrapperStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const statCardValueStyle = {
  fontSize: '1.75rem',
  fontWeight: '700',
  color: 'var(--text-main)',
  letterSpacing: '-0.5px'
};

const statCardFooterStyle = {
  fontSize: '0.8125rem',
  color: 'var(--text-muted)',
  marginTop: 'auto',
  paddingTop: '0.5rem',
  borderTop: '1px solid #f1f5f9'
};

const detailCardStyle = {
  backgroundColor: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-md)',
  display: 'flex',
  flexDirection: 'column'
};

const detailCardHeaderStyle = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border-color)'
};

const detailCardTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--text-main)',
  display: 'flex',
  alignItems: 'center'
};
