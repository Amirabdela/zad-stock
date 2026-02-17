import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, RefreshCw, Wifi, WifiOff, Menu } from 'lucide-react';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Dashboard from './components/Dashboard';
import { checkOnlineStatus, syncWithServer } from './syncManager';
import './App.css';

import Reports from './components/Reports';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory'); // default to inventory for initial verification
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('System ready');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncMessage('Offline - working locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check
    if (isOnline) {
      triggerSync();
    }

    // Background sync interval (every 30 seconds)
    const syncInterval = setInterval(() => {
      if (checkOnlineStatus()) {
        triggerSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const triggerSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('Synchronizing data...');
    try {
      const result = await syncWithServer();
      if (result.success) {
        setSyncMessage('Database synced successfully');
        // Dispatch custom event to tell active components to reload data
        window.dispatchEvent(new Event('sync-done'));
      } else {
        if (result.reason === 'offline') {
          setSyncMessage('Offline - changes saved locally');
        } else {
          setSyncMessage('Sync connection failed - will retry');
        }
      }
    } catch (err) {
      setSyncMessage('Sync error');
    } finally {
      setSyncing(false);
      // Clear status message after 3 seconds
      setTimeout(() => {
        if (navigator.onLine) {
          setSyncMessage('System active');
        } else {
          setSyncMessage('Offline mode');
        }
      }, 3000);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'inventory': return 'Inventory & Stock';
      case 'pos': return 'Point of Sale (POS)';
      case 'reports': return 'Sales Reports & Exports';
      default: return 'ZAD Stock';
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory isOnline={isOnline} />;
      case 'pos':
        return <POS />;
      case 'reports':
        return <Reports />;
      default:
        return <Inventory isOnline={isOnline} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">Z</div>
          <span className="logo-text">ZAD Stock</span>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </li>
          <li 
            className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
          >
            <Package size={18} />
            <span>Inventory</span>
          </li>
          <li 
            className={`menu-item ${activeTab === 'pos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pos'); setMobileMenuOpen(false); }}
          >
            <ShoppingCart size={18} />
            <span>POS Screen</span>
          </li>
          <li 
            className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
          >
            <BarChart3 size={18} />
            <span>Reports</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="online-badge-wrapper">
            <div className={`online-dot ${isOnline ? 'online' : ''}`}></div>
            <span>{isOnline ? 'Online Mode' : 'Offline Mode'}</span>
            {isOnline && (
              <button 
                onClick={triggerSync} 
                disabled={syncing}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#94a3b8', 
                  display: 'flex', 
                  marginLeft: 'auto',
                  transition: 'color 0.2s' 
                }}
                className={syncing ? 'spin' : ''}
                title="Sync database now"
              >
                <RefreshCw size={14} style={{ animation: syncing ? 'spin 1.5s infinite linear' : 'none' }} />
              </button>
            )}
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="app-main">
        <header className="app-header">
          <button 
            className="btn-icon mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', marginRight: '1rem' }}
          >
            <Menu size={20} />
          </button>
          
          <div className="header-title">
            <h1>{getPageTitle()}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              {syncMessage}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isOnline ? 'var(--primary-color)' : 'var(--danger-color)', fontWeight: '600', fontSize: '0.85rem' }}>
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span style={{ textTransform: 'capitalize' }}>{isOnline ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </header>

        <div className="app-body">
          {renderActiveComponent()}
        </div>
      </main>

      <style>{`
        @media (max-width: 968px) {
          .mobile-menu-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}
