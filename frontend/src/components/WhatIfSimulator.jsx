import React, { useState, useEffect } from 'react';
import { Sliders, Play, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, Users, RotateCcw } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { runWhatIfScenario } from '../services/api';

export default function WhatIfSimulator({ initialWorkload = 14500, initialWorkers = 15 }) {
  const [workload, setWorkload] = useState(initialWorkload);
  const [workers, setWorkers] = useState(initialWorkers);
  const [rate, setRate] = useState(105);
  const [shiftHours, setShiftHours] = useState(8.0);
  const [isPeak, setIsPeak] = useState(false);
  
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Update if initial props change
  useEffect(() => {
    if (initialWorkload) setWorkload(initialWorkload);
    if (initialWorkers) setWorkers(initialWorkers);
  }, [initialWorkload, initialWorkers]);

  // Run simulation on parameter changes
  useEffect(() => {
    const fetchSim = async () => {
      setLoading(true);
      try {
        const res = await runWhatIfScenario({
          forecasted_workload: workload,
          base_workers: workers,
          processing_rate_per_worker: rate,
          target_shift_hours: shiftHours,
          is_peak_period: isPeak,
          worker_deltas: [-6, -4, -2, 0, 2, 4, 6, 8, 10, 12]
        });
        setSimResults(res);
      } catch (err) {
        console.error("Scenario simulation error:", err);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchSim, 150);
    return () => clearTimeout(debounce);
  }, [workload, workers, rate, shiftHours, isPeak]);

  const handleReset = () => {
    setWorkload(14500);
    setWorkers(15);
    setRate(105);
    setShiftHours(8.0);
    setIsPeak(false);
  };

  // Base state
  const effRate = rate * (isPeak ? 0.95 : 1.0);
  const reqWorkers = Math.ceil(workload / (effRate * shiftHours));
  const expectedTime = workers > 0 ? (workload / (workers * effRate)).toFixed(2) : 999;
  const isOvertime = Number(expectedTime) > shiftHours;
  const gap = reqWorkers - workers;

  const chartData = simResults?.simulations?.map(s => ({
    workers: s.total_workers,
    time: s.expected_processing_time_hours,
    target: s.target_shift_hours,
    utilization: s.capacity_utilization_pct,
    deltaLabel: s.worker_delta >= 0 ? `+${s.worker_delta}` : `${s.worker_delta}`
  })) || [];

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: 28 }}>
      {/* Title */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              What-If / Scenario Planning Sandbox
            </h2>
            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
              <Sliders size={12} /> Module 7 Simulator
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
            Simulate dynamic workforce sensitivity curves, bottleneck impacts, and peak-hour labor allocations in real time.
          </p>
        </div>

        <button onClick={handleReset} className="btn btn-secondary btn-sm">
          <RotateCcw size={13} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Main Grid: Controls on Left, Simulation Results & Sensitivity Curve on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 24
      }}>
        {/* CONTROLS PANEL */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: 20,
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ups-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Operational Variables
          </h3>

          {/* Slider 1: Forecasted Workload */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ color: '#94A3B8' }}>Forecasted Workload:</span>
              <strong style={{ color: 'var(--ups-gold)', fontSize: '0.9rem' }}>{workload.toLocaleString()} packages</strong>
            </div>
            <input
              type="range"
              min={3000}
              max={30000}
              step={500}
              value={workload}
              onChange={(e) => setWorkload(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>
              <span>3,000 pkgs</span>
              <span>30,000 pkgs</span>
            </div>
          </div>

          {/* Slider 2: Current Available Staff */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ color: '#94A3B8' }}>Available Active Workers:</span>
              <strong style={{ color: '#60A5FA', fontSize: '0.9rem' }}>{workers} workers</strong>
            </div>
            <input
              type="range"
              min={4}
              max={40}
              step={1}
              value={workers}
              onChange={(e) => setWorkers(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>
              <span>4 workers</span>
              <span>40 workers</span>
            </div>
          </div>

          {/* Slider 3: Processing Rate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ color: '#94A3B8' }}>Processing Rate:</span>
              <strong style={{ color: '#F8FAFC', fontSize: '0.9rem' }}>{rate} pkgs / worker / hr</strong>
            </div>
            <input
              type="range"
              min={60}
              max={160}
              step={5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>
              <span>60 pkgs/hr</span>
              <span>160 pkgs/hr</span>
            </div>
          </div>

          {/* Slider 4: Target Shift Duration */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ color: '#94A3B8' }}>Target Shift Limit:</span>
              <strong style={{ color: '#F8FAFC', fontSize: '0.9rem' }}>{shiftHours} hours</strong>
            </div>
            <input
              type="range"
              min={4}
              max={12}
              step={0.5}
              value={shiftHours}
              onChange={(e) => setShiftHours(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>
              <span>4.0h (Part-time)</span>
              <span>12.0h (Extended)</span>
            </div>
          </div>

          {/* Peak Period Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 8,
            background: isPeak ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isPeak ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isPeak ? '#FCA5A5' : '#F8FAFC' }}>
                Peak Period Congestion Penalty (-5% speed)
              </span>
              <p style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Simulates dock traffic & conveyor slowdown</p>
            </div>
            <button
              onClick={() => setIsPeak(!isPeak)}
              className="btn btn-sm"
              style={{
                background: isPeak ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                color: '#F8FAFC',
                fontSize: '0.75rem'
              }}
            >
              {isPeak ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* RESULTS & SENSITIVITY CURVE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current Selected State Callout */}
          <div style={{
            padding: '16px 20px',
            borderRadius: 12,
            background: isOvertime ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isOvertime ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isOvertime ? <AlertTriangle size={18} color="#EF4444" /> : <CheckCircle size={18} color="#10B981" />}
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isOvertime ? '#FCA5A5' : '#6EE7B7' }}>
                  {isOvertime ? `Capacity Shortage (+${gap} Workers Required)` : 'Shift Plan Within Target'}
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 4 }}>
                With <strong>{workers} workers</strong>, processing <strong>{workload.toLocaleString()} packages</strong> will take <strong>{expectedTime} hours</strong> (Target: {shiftHours}h).
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Required Workforce:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>
                {reqWorkers} workers
              </div>
            </div>
          </div>

          {/* SENSITIVITY CHART */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>
                Processing Duration vs. Worker Headcount Curve
              </span>
              <span style={{ fontSize: '0.725rem', color: 'var(--ups-gold)' }}>
                Target Shift: {shiftHours}h Limit
              </span>
            </div>

            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="workers" stroke="#64748B" tick={{ fontSize: 11 }} label={{ value: 'Staff Count', position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={v => `${v}h`} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', border: '1px solid #FFB500', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [`${val} hours`, name === 'time' ? 'Expected Time' : name]}
                    labelFormatter={(w) => `${w} Workers Staffed`}
                  />
                  <ReferenceLine y={shiftHours} stroke="#EF4444" strokeDasharray="4 4" label={{ value: `${shiftHours}h Limit`, fill: '#FCA5A5', fontSize: 11, position: 'insideTopRight' }} />
                  <Line
                    type="monotone"
                    dataKey="time"
                    stroke="#FFB500"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#FFB500' }}
                    activeDot={{ r: 7 }}
                    name="Expected Hours"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
