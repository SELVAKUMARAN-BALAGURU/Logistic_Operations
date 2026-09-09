import React from 'react';
import { Package, Truck, Users, Clock, Gauge, AlertOctagon, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KPIOverview({ kpis, horizonDays }) {
  if (!kpis) return null;

  const gap = kpis.overall_workforce_gap;
  const isShortage = gap > 0;
  const isSurplus = gap < 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 16,
      marginBottom: 24
    }}>
      {/* 1. Inbound Volume Card */}
      <div className="glass-card glass-card-interactive" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg Inbound Workload
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                {kpis.avg_daily_inbound_volume?.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ups-gold)', fontWeight: 600 }}>pkgs / day</span>
            </div>
          </div>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(255, 181, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={20} color="var(--ups-gold)" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.75rem', color: '#94A3B8' }}>
          <TrendingUp size={14} color="#10B981" />
          <span>Prophet projected next {horizonDays} days</span>
        </div>
      </div>

      {/* 2. Outbound Volume Card */}
      <div className="glass-card glass-card-interactive" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg Outbound Workload
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                {kpis.avg_daily_outbound_volume?.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>pkgs / day</span>
            </div>
          </div>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(59, 130, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={20} color="#60A5FA" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.75rem', color: '#94A3B8' }}>
          <TrendingUp size={14} color="#60A5FA" />
          <span>Prophet dispatch pipeline</span>
        </div>
      </div>

      {/* 3. Workforce Requirement & Gap */}
      <div className="glass-card glass-card-interactive" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Workforce Required vs Avail
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                {kpis.total_required_workers}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>/ {kpis.total_available_workers} active</span>
            </div>
          </div>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isShortage ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={20} color={isShortage ? '#EF4444' : '#10B981'} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <span className={`badge ${isShortage ? 'badge-critical' : isSurplus ? 'badge-surplus' : 'badge-optimal'}`}>
            {isShortage ? `-${gap} Worker Shortage` : isSurplus ? `+${Math.abs(gap)} Surplus Staff` : 'Workforce Balanced'}
          </span>
        </div>
      </div>

      {/* 4. Capacity Utilization Meter */}
      <div className="glass-card glass-card-interactive" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Facility Utilization
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: kpis.overall_utilization_pct > 110 ? '#EF4444' : kpis.overall_utilization_pct > 95 ? '#F59E0B' : '#10B981' }}>
                {kpis.overall_utilization_pct}%
              </span>
            </div>
          </div>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Gauge size={20} color="#F59E0B" />
          </div>
        </div>
        {/* Progress Bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ width: '100%', height: 6, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, kpis.overall_utilization_pct)}%`,
              height: '100%',
              background: kpis.overall_utilization_pct > 105 ? '#EF4444' : (kpis.overall_utilization_pct > 90 ? 'var(--ups-gold)' : '#10B981'),
              borderRadius: 3,
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: 4 }}>
            <span>Inbound: {kpis.inbound_utilization_pct}%</span>
            <span>Outbound: {kpis.outbound_utilization_pct}%</span>
          </div>
        </div>
      </div>

      {/* 5. Expected Processing Time */}
      <div className="glass-card glass-card-interactive" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Expected Processing Time
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: Math.max(kpis.avg_inbound_processing_time, kpis.avg_outbound_processing_time) > kpis.target_shift_hours ? '#EF4444' : '#F8FAFC'
              }}>
                {Math.max(kpis.avg_inbound_processing_time, kpis.avg_outbound_processing_time)}h
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ {kpis.target_shift_hours}h target</span>
            </div>
          </div>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(168, 85, 247, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} color="#C084FC" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#94A3B8', marginTop: 12 }}>
          <span>Inbound: {kpis.avg_inbound_processing_time}h</span>
          <span>Outbound: {kpis.avg_outbound_processing_time}h</span>
        </div>
      </div>
    </div>
  );
}
