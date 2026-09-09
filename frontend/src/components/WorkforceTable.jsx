import React, { useState } from 'react';
import { Users, Clock, AlertTriangle, CheckCircle, ChevronRight, Filter, Search, Play, ArrowUpDown, Layers } from 'lucide-react';

export default function WorkforceTable({ inboundPlans, outboundPlans, onSimulateRow, onStageBenchmarkRow }) {
  const [filterOp, setFilterOp] = useState('ALL'); // 'ALL', 'Inbound', 'Outbound', 'SHORTAGE', 'CRITICAL'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  if (!inboundPlans || !outboundPlans) return null;

  // Interleave or combine rows by date
  const combined = [...inboundPlans, ...outboundPlans];

  // Filtering
  const filtered = combined.filter(row => {
    if (filterOp === 'Inbound' && row.operation !== 'Inbound') return false;
    if (filterOp === 'Outbound' && row.operation !== 'Outbound') return false;
    if (filterOp === 'SHORTAGE' && row.workforce_gap <= 0) return false;
    if (filterOp === 'CRITICAL' && row.status !== 'Critical') return false;
    if (searchTerm && !row.date.includes(searchTerm) && !row.operation.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: 28 }}>
      {/* Table Header & Toolbar */}
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
              Operational Workforce & Shift Planning Roster
            </h2>
            <span className="badge badge-optimal" style={{ fontSize: '0.7rem' }}>
              <Users size={12} /> Modules 3, 4 & 5
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 2 }}>
            Deterministic daily capacity requirements. Click <strong style={{ color: 'var(--ups-gold)' }}>Stage Flow</strong> to inspect the 6 micro-stages for that specific day's predicted volume.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              placeholder="Search date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F8FAFC',
                fontSize: '0.8rem',
                outline: 'none',
                width: 110
              }}
            />
          </div>

          {/* Quick Filter Buttons */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 3,
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {[
              { id: 'ALL', label: 'All Operations' },
              { id: 'Inbound', label: 'Inbound' },
              { id: 'Outbound', label: 'Outbound' },
              { id: 'SHORTAGE', label: 'Shortages Only' },
              { id: 'CRITICAL', label: 'Critical Only' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterOp(f.id)}
                style={{
                  padding: '5px 11px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: filterOp === f.id ? 'var(--ups-gold)' : 'transparent',
                  color: filterOp === f.id ? '#1A110D' : '#94A3B8'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.825rem'
        }}>
          <thead>
            <tr style={{
              background: 'rgba(0, 0, 0, 0.35)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94A3B8',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th onClick={() => handleSort('date')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Date <ArrowUpDown size={12} /></div>
              </th>
              <th onClick={() => handleSort('operation')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Operation <ArrowUpDown size={12} /></div>
              </th>
              <th onClick={() => handleSort('forecasted_stock')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Forecasted Volume <ArrowUpDown size={12} /></div>
              </th>
              <th onClick={() => handleSort('required_workers')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Required Staff <ArrowUpDown size={12} /></div>
              </th>
              <th onClick={() => handleSort('available_workers')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Available Staff <ArrowUpDown size={12} /></div>
              </th>
              <th onClick={() => handleSort('workforce_gap')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Workforce Gap <ArrowUpDown size={12} /></div>
              </th>
              <th onClick={() => handleSort('expected_processing_time_hours')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Expected Duration <ArrowUpDown size={12} /></div>
              </th>
              <th onClick={() => handleSort('capacity_utilization_pct')} style={{ padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Utilization <ArrowUpDown size={12} /></div>
              </th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                  No roster records match the active filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
                const isShortage = row.workforce_gap > 0;
                const isSurplus = row.workforce_gap < 0;
                const isOvertime = row.expected_processing_time_hours > row.target_shift_hours;

                return (
                  <tr
                    key={`${row.date}-${row.operation}`}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 181, 0, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#F8FAFC' }}>
                      {row.date}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: row.operation === 'Inbound' ? 'var(--ups-gold)' : '#60A5FA',
                        fontWeight: 600
                      }}>
                        {row.operation === 'Inbound' ? '📦 Inbound' : '🚚 Outbound'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#F8FAFC' }}>
                      {row.forecasted_stock?.toLocaleString()} pkgs
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#F8FAFC' }}>
                      {row.required_workers} workers
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94A3B8' }}>
                      {row.available_workers} workers
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontWeight: 700,
                        color: isShortage ? '#EF4444' : isSurplus ? '#60A5FA' : '#10B981'
                      }}>
                        {isShortage ? `+${row.workforce_gap} Shortage` : isSurplus ? `${row.workforce_gap} Surplus` : '0 (Balanced)'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} color={isOvertime ? '#EF4444' : '#10B981'} />
                        <span style={{ fontWeight: 600, color: isOvertime ? '#FCA5A5' : '#F8FAFC' }}>
                          {row.expected_processing_time_hours}h
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>/ {row.target_shift_hours}h</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 5, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, row.capacity_utilization_pct)}%`,
                            height: '100%',
                            background: row.capacity_utilization_pct > 110 ? '#EF4444' : row.capacity_utilization_pct > 90 ? 'var(--ups-gold)' : '#10B981'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>
                          {row.capacity_utilization_pct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge ${
                        row.status === 'Critical' ? 'badge-critical' : row.status === 'Warning' ? 'badge-warning' : row.status === 'Surplus' ? 'badge-surplus' : 'badge-optimal'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {/* Stage Benchmark Action */}
                        <button
                          onClick={() => onStageBenchmarkRow && onStageBenchmarkRow(row)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: 'rgba(255, 181, 0, 0.4)', color: 'var(--ups-gold)' }}
                          title="Inspect 6 sub-process stages for this exact day's forecast"
                        >
                          <Layers size={11} color="var(--ups-gold)" />
                          <span>Stage Flow</span>
                        </button>

                        {/* What-If Simulator Action */}
                        <button
                          onClick={() => onSimulateRow && onSimulateRow(row)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          title="Load this shift into What-If Simulator"
                        >
                          <Play size={11} />
                          <span>Simulate</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
