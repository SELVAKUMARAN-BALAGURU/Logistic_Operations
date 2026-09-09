import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import KPIOverview from './components/KPIOverview';
import ForecastCharts from './components/ForecastCharts';
import WorkforceTable from './components/WorkforceTable';
import ResourceOptimizationPanel from './components/ResourceOptimizationPanel';
import WhatIfSimulator from './components/WhatIfSimulator';
import SubProcessBenchmarkPanel from './components/SubProcessBenchmarkPanel';
import ShiftConfigModal from './components/ShiftConfigModal';
import DataManagementModal from './components/DataManagementModal';
import { fetchDashboardSummary, checkBackendHealth } from './services/api';
import { ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, Cpu, Database, Info, Sparkles, Layers } from 'lucide-react';

export default function App() {
  const [horizonDays, setHorizonDays] = useState(14);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'benchmarks', 'forecasts', 'workforce', 'optimizer', 'whatif'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);
  
  // Shift configuration state
  const [shiftConfig, setShiftConfig] = useState({
    in_workers: 15,
    out_workers: 14,
    in_rate: 105.0,
    out_rate: 110.0,
    shift_hours: 8.0
  });

  // Modal open states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Selected row for What-If simulator drill-down
  const [simTarget, setSimTarget] = useState({ workload: 14500, workers: 15 });

  // Selected row/date for Stage Benchmark drill-down
  const [selectedBenchmarkDate, setSelectedBenchmarkDate] = useState(null);
  const [benchmarkInitialOp, setBenchmarkInitialOp] = useState('inbound');

  // Main Dashboard State
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async (horizon = horizonDays, config = shiftConfig) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const isAlive = await checkBackendHealth();
      setBackendConnected(isAlive);
      
      const data = await fetchDashboardSummary({
        horizon_days: horizon,
        in_workers: config.in_workers,
        out_workers: config.out_workers,
        in_rate: config.in_rate,
        out_rate: config.out_rate,
        shift_hours: config.shift_hours
      });
      setDashboardData(data);
      
      // Default selected benchmark date to first future date if not yet set
      if (!selectedBenchmarkDate && data?.inbound?.workforce_plan?.length > 0) {
        setSelectedBenchmarkDate(data.inbound.workforce_plan[0].date);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to connect to UPS predictive forecasting backend.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(horizonDays, shiftConfig);
  }, [horizonDays, shiftConfig]);

  const handleSimulateRow = (row) => {
    setSimTarget({
      workload: row.forecasted_stock,
      workers: row.available_workers
    });
    setActiveTab('whatif');
  };

  const handleOpenStageBenchmark = (row) => {
    setSelectedBenchmarkDate(row.date);
    setBenchmarkInitialOp(row.operation.toLowerCase());
    setActiveTab('benchmarks');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        horizonDays={horizonDays}
        setHorizonDays={setHorizonDays}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(horizonDays, shiftConfig)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        backendConnected={backendConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: 1600,
        width: '100%',
        margin: '0 auto',
        padding: '24px 24px 60px',
        flex: 1
      }}>
        {/* Error notification banner if any */}
        {error && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={20} color="#EF4444" />
              <span style={{ fontSize: '0.85rem', color: '#FCA5A5' }}>
                <strong>API Connection Error:</strong> {error}
              </span>
            </div>
            <button onClick={() => loadData(horizonDays, shiftConfig)} className="btn btn-secondary btn-sm">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Top Story Strip: Decision-Support Narrative */}
        <div className="glass-card" style={{
          padding: '12px 20px',
          marginBottom: 20,
          background: 'linear-gradient(90deg, rgba(255, 181, 0, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderLeft: '4px solid var(--ups-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--ups-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#1A110D',
              fontSize: '0.8rem'
            }}>
              AI
            </div>
            <span style={{ fontSize: '0.825rem', color: '#F8FAFC' }}>
              <strong>Operational Storyline:</strong> Daily Predicted Stock <span style={{ color: 'var(--ups-gold)' }}>→</span> 6-Stage Micro-Pipeline Breakdown <span style={{ color: 'var(--ups-gold)' }}>→</span> Capacity & Headcount Needs <span style={{ color: 'var(--ups-gold)' }}>→</span> Cross-Dock Reallocation Directives
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.725rem', color: '#94A3B8' }}>
            <span>Active Horizon: <strong style={{ color: '#F8FAFC' }}>Next {horizonDays} Days</strong></span>
            <span>•</span>
            <span>Target Shift: <strong style={{ color: '#F8FAFC' }}>{shiftConfig.shift_hours}h</strong></span>
          </div>
        </div>

        {/* Loading Spinner Skeleton */}
        {isRefreshing && !dashboardData && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <RefreshCw size={36} color="var(--ups-gold)" style={{ animation: 'pulseGlow 1.5s infinite ease-in-out', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC' }}>Fitting Facebook Prophet Pipelines...</h3>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 4 }}>
              Training independent Inbound & Outbound time-series models and calculating workforce allocations.
            </p>
          </div>
        )}

        {/* Main Dashboard Render */}
        {dashboardData && (
          <>
            {/* Top KPI Cards (Always visible on executive dashboard) */}
            {(activeTab === 'dashboard' || activeTab === 'benchmarks' || activeTab === 'forecasts' || activeTab === 'workforce') && (
              <KPIOverview kpis={dashboardData.kpis} horizonDays={horizonDays} />
            )}

            {/* Tab 1: Executive Dashboard (All views synchronized) */}
            {activeTab === 'dashboard' && (
              <>
                <SubProcessBenchmarkPanel
                  inboundPlans={dashboardData.inbound?.workforce_plan}
                  outboundPlans={dashboardData.outbound?.workforce_plan}
                  selectedDate={selectedBenchmarkDate}
                  onSelectDate={setSelectedBenchmarkDate}
                  initialOperation={benchmarkInitialOp}
                  shiftHours={shiftConfig.shift_hours}
                />
                <ForecastCharts
                  inboundData={dashboardData.inbound}
                  outboundData={dashboardData.outbound}
                />
                <ResourceOptimizationPanel
                  optimizationData={dashboardData.optimization}
                />
                <WorkforceTable
                  inboundPlans={dashboardData.inbound?.workforce_plan}
                  outboundPlans={dashboardData.outbound?.workforce_plan}
                  onSimulateRow={handleSimulateRow}
                  onStageBenchmarkRow={handleOpenStageBenchmark}
                />
                <WhatIfSimulator
                  initialWorkload={simTarget.workload}
                  initialWorkers={simTarget.workers}
                />
              </>
            )}

            {/* Tab 2: Stage Benchmarks View */}
            {activeTab === 'benchmarks' && (
              <SubProcessBenchmarkPanel
                inboundPlans={dashboardData.inbound?.workforce_plan}
                outboundPlans={dashboardData.outbound?.workforce_plan}
                selectedDate={selectedBenchmarkDate}
                onSelectDate={setSelectedBenchmarkDate}
                initialOperation={benchmarkInitialOp}
                shiftHours={shiftConfig.shift_hours}
              />
            )}

            {/* Tab 3: Prophet Forecasts View */}
            {activeTab === 'forecasts' && (
              <ForecastCharts
                inboundData={dashboardData.inbound}
                outboundData={dashboardData.outbound}
              />
            )}

            {/* Tab 4: Workforce Planning Roster */}
            {activeTab === 'workforce' && (
              <WorkforceTable
                inboundPlans={dashboardData.inbound?.workforce_plan}
                outboundPlans={dashboardData.outbound?.workforce_plan}
                onSimulateRow={handleSimulateRow}
                onStageBenchmarkRow={handleOpenStageBenchmark}
              />
            )}

            {/* Tab 5: Resource Optimization View */}
            {activeTab === 'optimizer' && (
              <ResourceOptimizationPanel
                optimizationData={dashboardData.optimization}
              />
            )}

            {/* Tab 6: What-If Sandbox View */}
            {activeTab === 'whatif' && (
              <WhatIfSimulator
                initialWorkload={simTarget.workload}
                initialWorkers={simTarget.workers}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#64748B',
        background: 'rgba(11, 15, 25, 0.9)'
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>UPS SmartOps Logistics Analytics Platform • Production Prototype</span>
          <span>Facebook Prophet v1.4 • Scikit-learn Random Forest • FastAPI • React 18</span>
        </div>
      </footer>

      {/* Modals */}
      <ShiftConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={shiftConfig}
        onSave={(newCfg) => setShiftConfig(newCfg)}
      />

      <DataManagementModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataUpdated={() => loadData(horizonDays, shiftConfig)}
      />
    </div>
  );
}
