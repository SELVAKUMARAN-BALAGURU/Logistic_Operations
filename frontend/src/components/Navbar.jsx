import React from 'react';
import { Layers, Activity, RefreshCw, Upload, Sliders, Calendar, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function Navbar({
  horizonDays,
  setHorizonDays,
  isRefreshing,
  onRefresh,
  onOpenUpload,
  onOpenConfig,
  backendConnected,
  activeTab,
  setActiveTab
}) {
  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 181, 0, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1600,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #FFB500 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255, 181, 0, 0.4)'
          }}>
            <Layers size={24} color="#1A110D" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em' }}>
                UPS <span style={{ color: 'var(--ups-gold)' }}>SmartOps</span>
              </h1>
              <span className="badge" style={{
                background: 'rgba(255, 181, 0, 0.15)',
                color: 'var(--ups-gold)',
                border: '1px solid rgba(255, 181, 0, 0.3)',
                fontSize: '0.65rem'
              }}>
                PREDICTIVE LOGISTICS
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 1 }}>
              Workforce Forecasting & Hub Capacity Optimization Engine
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: 4,
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {[
            { id: 'dashboard', label: 'Executive Dashboard' },
            { id: 'benchmarks', label: 'Stage Benchmarks' },
            { id: 'forecasts', label: 'Prophet Forecasts' },
            { id: 'workforce', label: 'Workforce Roster' },
            { id: 'optimizer', label: 'Resource Optimization' },
            { id: 'whatif', label: 'What-If Simulator' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === tab.id ? 'var(--ups-gold)' : 'transparent',
                color: activeTab === tab.id ? '#1A110D' : '#94A3B8'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Horizon Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 8px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <Calendar size={14} color="#94A3B8" />
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginRight: 4 }}>Horizon:</span>
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 5,
                  border: 'none',
                  cursor: 'pointer',
                  background: horizonDays === days ? 'var(--ups-gold)' : 'rgba(255, 255, 255, 0.08)',
                  color: horizonDays === days ? '#1A110D' : '#F8FAFC'
                }}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Quick Config Button */}
          <button
            onClick={onOpenConfig}
            className="btn btn-secondary btn-sm"
            title="Configure Shift Parameters"
          >
            <Sliders size={14} color="var(--ups-gold)" />
            <span>Shift Config</span>
          </button>

          {/* Upload CSV */}
          <button
            onClick={onOpenUpload}
            className="btn btn-secondary btn-sm"
            title="Upload CSV Datasets"
          >
            <Upload size={14} />
            <span>Upload Data</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }} />
            <span>{isRefreshing ? 'Forecasting...' : 'Re-Forecast'}</span>
          </button>

          {/* Live Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: backendConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: backendConnected ? '#10B981' : '#EF4444'
            }} />
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: backendConnected ? '#6EE7B7' : '#FCA5A5'
            }}>
              {backendConnected ? 'Prophet Live' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
