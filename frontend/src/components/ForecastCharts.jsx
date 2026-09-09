import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Package, Truck, Award, CheckCircle, Info, Sparkles, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 181, 0, 0.3)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontSize: '0.8rem',
        color: '#F8FAFC'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--ups-gold)', marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>
          {label} {data?.is_future ? '(Forecasted Future Date)' : '(Historical Record)'}
        </div>
        {data?.actual_workload !== null && data?.actual_workload !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#94A3B8' }}>
            <span>Historical Actual:</span>
            <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{data.actual_workload.toLocaleString()} pkgs</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--ups-gold)' }}>
          <span>Prophet Forecast:</span>
          <span style={{ fontWeight: 700 }}>{data.forecasted_workload?.toLocaleString()} pkgs</span>
        </div>
        {data?.confidence_lower !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#64748B', fontSize: '0.725rem', marginTop: 4 }}>
            <span>90% Confidence Interval:</span>
            <span>[{data.confidence_lower?.toLocaleString()} - {data.confidence_upper?.toLocaleString()}]</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function ForecastCharts({ inboundData, outboundData }) {
  const [activeModel, setActiveModel] = useState('both'); // 'both', 'inbound', 'outbound'
  const [showConfidence, setShowConfidence] = useState(true);

  if (!inboundData || !outboundData) return null;

  // Format chart series
  // We take the last 20 historical points + all future points for clean visual presentation
  const prepareChartData = (forecastArray) => {
    if (!forecastArray) return [];
    const hist = forecastArray.filter(d => !d.is_future);
    const future = forecastArray.filter(d => d.is_future);
    const recentHist = hist.slice(-18);
    return [...recentHist, ...future].map(d => ({
      ...d,
      displayDate: d.date.slice(5), // 'MM-DD'
      actualBar: !d.is_future ? d.actual_workload : null,
      forecastLine: d.forecasted_workload,
      ciRange: [d.confidence_lower, d.confidence_upper]
    }));
  };

  const inChartData = prepareChartData(inboundData.forecast);
  const outChartData = prepareChartData(outboundData.forecast);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 28 }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              Time-Series Workload Forecasting (Meta Prophet)
            </h2>
            <span className="badge badge-optimal" style={{ fontSize: '0.7rem' }}>
              <Sparkles size={12} /> Two Independent ML Pipelines
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
            Independent Prophet models trained on historical sortation trends, day-of-week seasonality, and confidence uncertainty intervals.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', borderColor: showConfidence ? 'var(--ups-gold)' : 'rgba(255,255,255,0.1)' }}
          >
            {showConfidence ? '✓ 90% Confidence Bounds' : 'Confidence Bounds Off'}
          </button>

          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 3,
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {[
              { id: 'both', label: 'Dual View' },
              { id: 'inbound', label: 'Inbound Only' },
              { id: 'outbound', label: 'Outbound Only' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setActiveModel(m.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeModel === m.id ? 'var(--ups-gold)' : 'transparent',
                  color: activeModel === m.id ? '#1A110D' : '#94A3B8'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeModel === 'both' ? 'repeat(auto-fit, minmax(500px, 1fr))' : '1fr',
        gap: 20
      }}>
        {/* INBOUND FORECAST CHART */}
        {(activeModel === 'both' || activeModel === 'inbound') && (
          <div className="glass-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'rgba(255, 181, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Package size={18} color="var(--ups-gold)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                    Module 1: Inbound Stock Forecast
                  </h3>
                  <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
                    Historical sortation vs. projected receiving workload
                  </span>
                </div>
              </div>

              {/* Accuracy metric pill */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: '0.725rem',
                color: '#6EE7B7',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Award size={13} />
                <span>MAPE: {inboundData.metrics?.mape_pct}% | MAE: {inboundData.metrics?.mae?.toLocaleString()}</span>
              </div>
            </div>

            {/* Chart Area */}
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={inChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB500" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FFB500" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="displayDate" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  
                  {showConfidence && (
                    <Area
                      type="monotone"
                      dataKey="confidence_upper"
                      stroke="none"
                      fill="url(#inboundGrad)"
                      name="Prophet 90% Confidence"
                    />
                  )}
                  <Bar dataKey="actualBar" fill="rgba(255, 181, 0, 0.4)" radius={[4, 4, 0, 0]} name="Historical Actual Stock" />
                  <Line
                    type="monotone"
                    dataKey="forecastLine"
                    stroke="#FFB500"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#FFB500' }}
                    activeDot={{ r: 6 }}
                    name="Prophet Forecast"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Dataset stats strip */}
            <div style={{
              marginTop: 14,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.725rem',
              color: '#94A3B8'
            }}>
              <span>Historical Range: {inboundData.stats?.start_date} to {inboundData.stats?.end_date}</span>
              <span>Daily Min: {inboundData.stats?.min_workload?.toLocaleString()} | Max: {inboundData.stats?.max_workload?.toLocaleString()}</span>
              <span>Status: <strong style={{ color: '#10B981' }}>{inboundData.metrics?.model_status}</strong></span>
            </div>
          </div>
        )}

        {/* OUTBOUND FORECAST CHART */}
        {(activeModel === 'both' || activeModel === 'outbound') && (
          <div className="glass-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Truck size={18} color="#60A5FA" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                    Module 2: Outbound Stock Forecast
                  </h3>
                  <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
                    Independent dispatch sortation model
                  </span>
                </div>
              </div>

              {/* Accuracy metric pill */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: '0.725rem',
                color: '#93C5FD',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Award size={13} />
                <span>MAPE: {outboundData.metrics?.mape_pct}% | MAE: {outboundData.metrics?.mae?.toLocaleString()}</span>
              </div>
            </div>

            {/* Chart Area */}
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={outChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="displayDate" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  
                  {showConfidence && (
                    <Area
                      type="monotone"
                      dataKey="confidence_upper"
                      stroke="none"
                      fill="url(#outboundGrad)"
                      name="Prophet 90% Confidence"
                    />
                  )}
                  <Bar dataKey="actualBar" fill="rgba(59, 130, 246, 0.4)" radius={[4, 4, 0, 0]} name="Historical Dispatch Stock" />
                  <Line
                    type="monotone"
                    dataKey="forecastLine"
                    stroke="#60A5FA"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#60A5FA' }}
                    activeDot={{ r: 6 }}
                    name="Prophet Forecast"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Dataset stats strip */}
            <div style={{
              marginTop: 14,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.725rem',
              color: '#94A3B8'
            }}>
              <span>Historical Range: {outboundData.stats?.start_date} to {outboundData.stats?.end_date}</span>
              <span>Daily Min: {outboundData.stats?.min_workload?.toLocaleString()} | Max: {outboundData.stats?.max_workload?.toLocaleString()}</span>
              <span>Status: <strong style={{ color: '#60A5FA' }}>{outboundData.metrics?.model_status}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
