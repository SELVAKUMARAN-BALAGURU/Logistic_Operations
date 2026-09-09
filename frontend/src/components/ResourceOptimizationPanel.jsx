import React from 'react';
import { Shuffle, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, Zap, ShieldCheck, Flame } from 'lucide-react';

export default function ResourceOptimizationPanel({ optimizationData }) {
  if (!optimizationData) return null;

  const { daily_optimizations, overall_recommendations, summary } = optimizationData;

  const rebalanceOpportunities = daily_optimizations?.filter(d => d.transfer_workers > 0) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 28 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              Resource Optimization & Cross-Dock Balancer
            </h2>
            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
              <Zap size={12} /> Module 6 Engine
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
            Autonomous labor optimization, cross-functional shift rebalancing, and bottleneck mitigation recommendations.
          </p>
        </div>

        {/* Quick summary badges */}
        {summary && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-critical">
              <Flame size={12} /> {summary.critical_days} Critical Days
            </span>
            <span className="badge badge-warning">
              <AlertTriangle size={12} /> {summary.warning_days} Warning Days
            </span>
            <span className="badge badge-optimal">
              <ShieldCheck size={12} /> {summary.optimal_days} Optimal Days
            </span>
          </div>
        )}
      </div>

      {/* Grid: Recommendations on Left, Rebalance Matrix on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 20
      }}>
        {/* RECOMMENDATIONS CARDS */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertCircle size={18} color="var(--ups-gold)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
              Decision Support & Actionable Directives
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {overall_recommendations && overall_recommendations.length > 0 ? (
              overall_recommendations.map((rec, i) => {
                const isCrit = rec.severity === 'Critical';
                const isWarn = rec.severity === 'Warning';
                return (
                  <div
                    key={i}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: isCrit ? 'rgba(239, 68, 68, 0.08)' : isWarn ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                      border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.25)' : isWarn ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: isCrit ? '#FCA5A5' : isWarn ? '#FCD34D' : '#6EE7B7'
                      }}>
                        {rec.title}
                      </span>
                      <span className={`badge ${isCrit ? 'badge-critical' : isWarn ? 'badge-warning' : 'badge-optimal'}`} style={{ fontSize: '0.65rem' }}>
                        {rec.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.785rem', color: '#94A3B8', lineHeight: 1.4 }}>
                      {rec.message}
                    </p>
                    <div style={{
                      marginTop: 4,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.25)',
                      fontSize: '0.75rem',
                      color: 'var(--ups-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <strong style={{ color: '#F8FAFC' }}>Recommended Action:</strong> {rec.action}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                No active operational anomalies detected.
              </div>
            )}
          </div>
        </div>

        {/* CROSS-DOCK REBALANCE TIMELINE */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Shuffle size={18} color="#60A5FA" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Cross-Dock Labor Redistribution Matrix
              </h3>
              <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
                Feasible shifts between Inbound sortation and Outbound dispatch
              </span>
            </div>
          </div>

          {rebalanceOpportunities.length === 0 ? (
            <div style={{
              padding: '36px 20px',
              textAlign: 'center',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.9rem' }}>
                Facility Perfectly Balanced
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>
                No inter-departmental labor transfers required across the forecast horizon.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
              {rebalanceOpportunities.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.825rem' }}>
                      {day.date}
                    </span>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                      Reallocate {day.transfer_workers} Worker{day.transfer_workers > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(0, 0, 0, 0.3)',
                    fontSize: '0.75rem'
                  }}>
                    <span style={{ color: day.transfer_from === 'Outbound' ? '#60A5FA' : 'var(--ups-gold)' }}>
                      {day.transfer_from} (Surplus)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ups-gold)' }}>
                      <span>Transfer {day.transfer_workers}</span>
                      <ArrowRight size={14} />
                    </div>
                    <span style={{ color: day.transfer_to === 'Inbound' ? 'var(--ups-gold)' : '#60A5FA' }}>
                      {day.transfer_to} (Shortage)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
                    <span>Post-Balance Inbound Time: <strong style={{ color: '#F8FAFC' }}>{day.post_inbound_time}h</strong></span>
                    <span>Post-Balance Outbound Time: <strong style={{ color: '#F8FAFC' }}>{day.post_outbound_time}h</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
