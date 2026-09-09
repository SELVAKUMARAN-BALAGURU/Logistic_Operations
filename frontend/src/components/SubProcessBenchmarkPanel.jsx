import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Layers,
  Scan,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Flame,
  FileText,
  Clock,
  Gauge,
  TrendingUp,
  RotateCcw,
  Plus,
  Minus,
  Users,
  Calendar,
  Sparkles,
  Target
} from 'lucide-react';
import { analyzeSubProcesses } from '../services/api';

const getStageIcon = (iconName) => {
  switch (iconName) {
    case 'truck': return <Truck size={18} />;
    case 'scan': return <Scan size={18} />;
    case 'layers': return <Layers size={18} />;
    case 'alert-circle': return <AlertCircle size={18} />;
    case 'package': return <Package size={18} />;
    case 'file-text': return <FileText size={18} />;
    case 'shield-check': return <ShieldCheck size={18} />;
    default: return <CheckCircle2 size={18} />;
  }
};

export default function SubProcessBenchmarkPanel({
  inboundPlans = [],
  outboundPlans = [],
  selectedDate: propSelectedDate,
  onSelectDate,
  initialOperation = 'inbound',
  shiftHours = 8.0
}) {
  const [activeOperation, setActiveOperation] = useState(initialOperation); // 'inbound' | 'outbound'
  const [benchmarkPct, setBenchmarkPct] = useState(60.0);
  const [staffingPerspective, setStaffingPerspective] = useState('available'); // 'available' | 'required'
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Custom stage worker assignments state
  const [customStageWorkers, setCustomStageWorkers] = useState({});

  // Active plans list based on selected operation
  const activePlans = activeOperation === 'inbound' ? inboundPlans : outboundPlans;
  
  // Current active date
  const availableDates = activePlans.map(p => p.date);
  const activeDate = propSelectedDate && availableDates.includes(propSelectedDate)
    ? propSelectedDate
    : (availableDates[0] || '2026-09-10');

  // Find exact plan record for active date
  const currentPlan = activePlans.find(p => p.date === activeDate) || activePlans[0] || {
    forecasted_stock: 14500,
    required_workers: 18,
    available_workers: 15
  };

  const currentVolume = currentPlan.forecasted_stock || 14500;
  const currentHeadcount = staffingPerspective === 'required'
    ? (currentPlan.required_workers || 18)
    : (currentPlan.available_workers || 15);

  const fetchAnalysis = async (op, bench, vol, wks, hrs) => {
    setLoading(true);
    try {
      const res = await analyzeSubProcesses({
        operation: op,
        total_volume: vol,
        total_workers: wks,
        target_shift_hours: hrs,
        benchmark_target_pct: bench
      });
      setAnalysisData(res);
      
      // Initialize custom worker mapping
      if (res?.stages) {
        const initialMap = {};
        res.stages.forEach(s => {
          initialMap[s.id] = s.assigned_workers;
        });
        setCustomStageWorkers(initialMap);
      }
    } catch (err) {
      console.error('Failed to analyze sub-processes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever date, operation, staffing perspective, volume, or benchmark changes
  useEffect(() => {
    setIsManualOverride(false);
    fetchAnalysis(activeOperation, benchmarkPct, currentVolume, currentHeadcount, shiftHours);
  }, [activeOperation, activeDate, staffingPerspective, benchmarkPct, currentVolume, currentHeadcount, shiftHours]);

  // Handle manual +/- worker changes for a stage
  const handleWorkerChange = (stageId, delta) => {
    setIsManualOverride(true);
    const newWorkers = Math.max(1, (customStageWorkers[stageId] || 1) + delta);
    const updatedMap = {
      ...customStageWorkers,
      [stageId]: newWorkers
    };
    setCustomStageWorkers(updatedMap);

    // Recalculate local stage predictions and efficiency immediately
    if (analysisData?.stages) {
      let totalTime = 0;
      let bottleneckCount = 0;

      const updatedStages = analysisData.stages.map(s => {
        const workers = updatedMap[s.id] || s.assigned_workers;
        const predTime = roundNumber(s.stage_volume / (workers * s.standard_rate_per_worker), 2);
        totalTime += predTime;
        
        const effPct = roundNumber((s.benchmark_target_hours / Math.max(0.01, predTime)) * 100.0, 1);
        const isBottleneck = effPct < benchmarkPct;
        if (isBottleneck) bottleneckCount++;

        const isAbove = effPct >= (benchmarkPct + 15.0);
        const status = isBottleneck ? 'Below Benchmark' : isAbove ? 'Above Benchmark' : 'Meets Benchmark';
        const statusColor = isBottleneck ? 'red' : isAbove ? 'green' : 'amber';

        return {
          ...s,
          assigned_workers: workers,
          predicted_duration_hours: predTime,
          efficiency_pct: effPct,
          is_bottleneck: isBottleneck,
          status: status,
          status_color: statusColor
        };
      });

      const avgEff = roundNumber(updatedStages.reduce((acc, s) => acc + s.efficiency_pct, 0) / updatedStages.length, 1);
      const totalStaff = Object.values(updatedMap).reduce((a, b) => a + b, 0);

      setAnalysisData({
        ...analysisData,
        stages: updatedStages,
        composite_efficiency_pct: avgEff,
        bottlenecks_detected: bottleneckCount,
        total_workers: totalStaff
      });
    }
  };

  const handleResetAuto = () => {
    setIsManualOverride(false);
    fetchAnalysis(activeOperation, benchmarkPct, currentVolume, currentHeadcount, shiftHours);
  };

  const roundNumber = (num, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  };

  const totalAssignedStaff = Object.values(customStageWorkers).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: 28 }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              Sub-Process Stage Efficiency & SLA Benchmark Analyzer
            </h2>
            <span className="badge badge-optimal" style={{ fontSize: '0.7rem' }}>
              <Gauge size={12} /> 6-Stage Micro-Pipeline
            </span>
            {isManualOverride && (
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                Manual Override Active
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
            Driven directly by the Workforce Roster's predicted volume (<strong>{currentVolume.toLocaleString()} pkgs</strong> on <strong>{activeDate}</strong>).
          </p>
        </div>

        {/* Top Controls: Date Selector, Operation Switcher, Auto-Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Daily Date Selector Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '4px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255, 181, 0, 0.3)'
          }}>
            <Calendar size={14} color="var(--ups-gold)" />
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Roster Date:</span>
            <select
              value={activeDate}
              onChange={(e) => onSelectDate && onSelectDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ups-gold)',
                fontSize: '0.8rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {activePlans.map(p => (
                <option key={p.date} value={p.date} style={{ background: '#0F172A', color: '#F8FAFC' }}>
                  {p.date} • {p.forecasted_stock.toLocaleString()} pkgs ({p.required_workers} req)
                </option>
              ))}
            </select>
          </div>

          {/* Reset to Auto Button */}
          {isManualOverride && (
            <button
              onClick={handleResetAuto}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', borderColor: 'var(--ups-gold)', color: 'var(--ups-gold)' }}
            >
              <RotateCcw size={13} />
              <span>Reset Auto</span>
            </button>
          )}

          {/* Inbound vs Outbound Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 3,
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => setActiveOperation('inbound')}
              style={{
                padding: '5px 12px',
                fontSize: '0.775rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeOperation === 'inbound' ? 'var(--ups-gold)' : 'transparent',
                color: activeOperation === 'inbound' ? '#1A110D' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Package size={13} />
              <span>Inbound</span>
            </button>
            <button
              onClick={() => setActiveOperation('outbound')}
              style={{
                padding: '5px 12px',
                fontSize: '0.775rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeOperation === 'outbound' ? '#60A5FA' : 'transparent',
                color: activeOperation === 'outbound' ? '#1A110D' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Truck size={13} />
              <span>Outbound</span>
            </button>
          </div>
        </div>
      </div>

      {/* Benchmark Slider & Staffing Perspective Selector Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        padding: '16px 20px',
        borderRadius: 12,
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: 24,
        alignItems: 'center'
      }}>
        {/* Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>
              Executive Benchmark SLA Target:
            </span>
            <strong style={{ color: 'var(--ups-gold)', fontSize: '0.95rem' }}>
              {benchmarkPct}% Efficiency
            </strong>
          </div>
          <input
            type="range"
            min={40}
            max={90}
            step={5}
            value={benchmarkPct}
            onChange={(e) => setBenchmarkPct(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>
            <span>40% (Lenient)</span>
            <span style={{ color: 'var(--ups-gold)' }}>60% Baseline</span>
            <span>90% (Strict)</span>
          </div>
        </div>

        {/* Staffing Perspective Selector (Available vs Required) */}
        <div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' }}>
            Staffing Perspective:
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setStaffingPerspective('available')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: `1px solid ${staffingPerspective === 'available' ? '#60A5FA' : 'rgba(255,255,255,0.1)'}`,
                background: staffingPerspective === 'available' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)',
                color: staffingPerspective === 'available' ? '#93C5FD' : '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              👥 Active Available ({currentPlan.available_workers} wks)
            </button>
            <button
              onClick={() => setStaffingPerspective('required')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: `1px solid ${staffingPerspective === 'required' ? 'var(--ups-gold)' : 'rgba(255,255,255,0.1)'}`,
                background: staffingPerspective === 'required' ? 'rgba(255, 181, 0, 0.2)' : 'rgba(0,0,0,0.2)',
                color: staffingPerspective === 'required' ? 'var(--ups-gold)' : '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🎯 Calculated Required ({currentPlan.required_workers} wks)
            </button>
          </div>
        </div>

        {/* Metric 1: Composite Efficiency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: (analysisData?.composite_efficiency_pct || 0) >= benchmarkPct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Gauge size={20} color={(analysisData?.composite_efficiency_pct || 0) >= benchmarkPct ? '#10B981' : '#EF4444'} />
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#94A3B8', textTransform: 'uppercase' }}>Composite Efficiency</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              {analysisData?.composite_efficiency_pct}%
            </div>
          </div>
        </div>

        {/* Metric 2: Bottlenecks Identified */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: (analysisData?.bottlenecks_detected || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={20} color={(analysisData?.bottlenecks_detected || 0) > 0 ? '#EF4444' : '#10B981'} />
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#94A3B8', textTransform: 'uppercase' }}>Bottlenecks Detected</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: (analysisData?.bottlenecks_detected || 0) > 0 ? '#FCA5A5' : '#6EE7B7' }}>
              {analysisData?.bottlenecks_detected} of 6 Stages
            </div>
          </div>
        </div>
      </div>

      {/* 6-STEP VISUAL PIPELINE CHEVRON CARDS WITH +/- BUTTONS */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
            Daily Workload Pipeline: <span style={{ color: 'var(--ups-gold)' }}>{currentVolume.toLocaleString()} Packages</span> for {activeDate}
          </div>
          <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
            Assigned: <strong style={{ color: '#F8FAFC' }}>{totalAssignedStaff} workers</strong> ({staffingPerspective === 'required' ? 'Required Target' : 'Available Active'})
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12
        }}>
          {analysisData?.stages?.map((stage, idx) => {
            const isBottleneck = stage.is_bottleneck;
            const isAbove = stage.status === 'Above Benchmark';
            const currentStageWorkers = customStageWorkers[stage.id] || stage.assigned_workers;

            return (
              <div
                key={stage.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: isBottleneck ? 'rgba(239, 68, 68, 0.08)' : isAbove ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${isBottleneck ? 'rgba(239, 68, 68, 0.35)' : isAbove ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isBottleneck ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none'
                }}
              >
                {/* Step indicator tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.675rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.3)',
                    color: activeOperation === 'inbound' ? 'var(--ups-gold)' : '#60A5FA'
                  }}>
                    STEP {idx + 1} ({stage.workload_share_pct}%)
                  </span>

                  <span className={`badge ${isBottleneck ? 'badge-critical' : isAbove ? 'badge-optimal' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                    {stage.status}
                  </span>
                </div>

                {/* Stage Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: isBottleneck ? '#EF4444' : isAbove ? '#10B981' : '#F59E0B' }}>
                    {getStageIcon(stage.icon)}
                  </div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 }}>
                    {stage.name}
                  </div>
                </div>

                {/* INTERACTIVE +/- STAFF CONTROLS */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span style={{ fontSize: '0.725rem', color: '#94A3B8', fontWeight: 600 }}>Assigned Staff:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleWorkerChange(stage.id, -1)}
                      disabled={currentStageWorkers <= 1}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 5,
                        background: currentStageWorkers <= 1 ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: currentStageWorkers <= 1 ? '#64748B' : '#FCA5A5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: currentStageWorkers <= 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Decrease 1 worker"
                    >
                      <Minus size={12} />
                    </button>

                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#F8FAFC', minWidth: 20, textAlign: 'center' }}>
                      {currentStageWorkers}
                    </span>

                    <button
                      onClick={() => handleWorkerChange(stage.id, 1)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 5,
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#6EE7B7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Add 1 worker"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Duration & Efficiency metrics */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(0, 0, 0, 0.25)',
                  fontSize: '0.725rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Predicted Duration:</span>
                    <strong style={{ color: '#F8FAFC' }}>{stage.predicted_duration_hours}h</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>SLA Benchmark Time:</span>
                    <span>{stage.benchmark_target_hours}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4 }}>
                    <span style={{ fontWeight: 600 }}>Efficiency:</span>
                    <strong style={{ color: isBottleneck ? '#FCA5A5' : isAbove ? '#6EE7B7' : '#FCD34D' }}>
                      {stage.efficiency_pct}%
                    </strong>
                  </div>
                </div>

                {/* Volume footer */}
                <div style={{ fontSize: '0.7rem', color: '#64748B', textAlign: 'right' }}>
                  Stage Volume: <strong style={{ color: '#94A3B8' }}>{stage.stage_volume.toLocaleString()} pkgs</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAGE BENCHMARK COMPARISON TABLE */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.8rem'
        }}>
          <thead>
            <tr style={{
              background: 'rgba(0, 0, 0, 0.35)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94A3B8',
              fontSize: '0.725rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '10px 12px' }}>#</th>
              <th style={{ padding: '10px 12px' }}>Operational Sub-Process</th>
              <th style={{ padding: '10px 12px' }}>Share %</th>
              <th style={{ padding: '10px 12px' }}>Stage Volume</th>
              <th style={{ padding: '10px 12px' }}>Staff Assigned</th>
              <th style={{ padding: '10px 12px' }}>Predicted Duration</th>
              <th style={{ padding: '10px 12px' }}>SLA Target Time</th>
              <th style={{ padding: '10px 12px' }}>Predicted Efficiency</th>
              <th style={{ padding: '10px 12px' }}>Target Benchmark</th>
              <th style={{ padding: '10px 12px' }}>Benchmark Status</th>
            </tr>
          </thead>
          <tbody>
            {analysisData?.stages?.map((s, idx) => {
              const isBottleneck = s.is_bottleneck;
              return (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ups-gold)' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#F8FAFC' }}>
                    {s.name}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8' }}>
                    {s.workload_share_pct}%
                  </td>
                  <td style={{ padding: '10px 12px', color: '#F8FAFC' }}>
                    {s.stage_volume.toLocaleString()} pkgs
                  </td>
                  <td style={{ padding: '10px 12px', color: '#F8FAFC', fontWeight: 700 }}>
                    {s.assigned_workers} workers
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: isBottleneck ? '#FCA5A5' : '#F8FAFC' }}>
                    {s.predicted_duration_hours}h
                  </td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8' }}>
                    {s.benchmark_target_hours}h
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 44, height: 5, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, s.efficiency_pct)}%`,
                          height: '100%',
                          background: isBottleneck ? '#EF4444' : (s.efficiency_pct >= 75 ? '#10B981' : '#F59E0B')
                        }} />
                      </div>
                      <span style={{
                        fontWeight: 700,
                        color: isBottleneck ? '#FCA5A5' : (s.efficiency_pct >= 75 ? '#6EE7B7' : '#FCD34D')
                      }}>
                        {s.efficiency_pct}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--ups-gold)', fontWeight: 600 }}>
                    {s.benchmark_target_pct}%
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${isBottleneck ? 'badge-critical' : s.status === 'Above Benchmark' ? 'badge-optimal' : 'badge-warning'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* STAGE REBALANCING DIRECTIVES */}
      {analysisData?.rebalance_suggestions && analysisData.rebalance_suggestions.length > 0 && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 10,
          background: 'rgba(255, 181, 0, 0.08)',
          border: '1px solid rgba(255, 181, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sliders size={18} color="var(--ups-gold)" />
            <div style={{ fontSize: '0.825rem' }}>
              <strong style={{ color: '#F8FAFC' }}>Sub-Process Stage Directives: </strong>
              <span style={{ color: 'var(--ups-gold)' }}>{analysisData.rebalance_suggestions[0].message}</span>
            </div>
          </div>
          <span className="badge badge-optimal" style={{ fontSize: '0.7rem' }}>
            Impact: {analysisData.rebalance_suggestions[0].impact}
          </span>
        </div>
      )}
    </div>
  );
}
