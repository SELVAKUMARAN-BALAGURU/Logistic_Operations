import React, { useState } from 'react';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';

export default function ShiftConfigModal({ isOpen, onClose, config, onSave }) {
  if (!isOpen) return null;

  const [inWorkers, setInWorkers] = useState(config.in_workers || 15);
  const [outWorkers, setOutWorkers] = useState(config.out_workers || 14);
  const [inRate, setInRate] = useState(config.in_rate || 105.0);
  const [outRate, setOutRate] = useState(config.out_rate || 110.0);
  const [shiftHours, setShiftHours] = useState(config.shift_hours || 8.0);

  const handleSave = () => {
    onSave({
      in_workers: inWorkers,
      out_workers: outWorkers,
      in_rate: inRate,
      out_rate: outRate,
      shift_hours: shiftHours
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: 480,
        padding: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255, 181, 0, 0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sliders size={20} color="var(--ups-gold)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
              Facility Shift Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: 6 }}>
              Inbound Active Available Staff:
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={inWorkers}
              onChange={(e) => setInWorkers(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: '#F8FAFC',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: 6 }}>
              Outbound Active Available Staff:
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={outWorkers}
              onChange={(e) => setOutWorkers(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: '#F8FAFC',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                Inbound Rate (pkgs/hr/w):
              </label>
              <input
                type="number"
                min={20}
                max={300}
                value={inRate}
                onChange={(e) => setInRate(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0F172A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  color: '#F8FAFC',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                Outbound Rate (pkgs/hr/w):
              </label>
              <input
                type="number"
                min={20}
                max={300}
                value={outRate}
                onChange={(e) => setOutRate(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0F172A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  color: '#F8FAFC',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: 6 }}>
              Target Standard Shift Duration (Hours):
            </label>
            <input
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={shiftHours}
              onChange={(e) => setShiftHours(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: '#F8FAFC',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <Check size={16} />
            <span>Apply Parameters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
