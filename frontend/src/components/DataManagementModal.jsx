import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { uploadDatasetFile } from '../services/api';

export default function DataManagementModal({ isOpen, onClose, onDataUpdated }) {
  if (!isOpen) return null;

  const [selectedType, setSelectedType] = useState('inbound_historical');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success'|'error', message, stats }

  const datasetOptions = [
    { id: 'inbound_historical', label: 'Inbound Historical Workload', required: 'date, inbound_stock' },
    { id: 'outbound_historical', label: 'Outbound Historical Workload', required: 'date, outbound_stock' },
    { id: 'inbound_operational', label: 'Inbound Operational / Shifts', required: 'date, shift, workers_assigned, processing_rate_per_worker' },
    { id: 'outbound_operational', label: 'Outbound Operational / Shifts', required: 'date, shift, workers_assigned, processing_rate_per_worker' }
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadStatus(null);
    try {
      const res = await uploadDatasetFile(selectedType, file);
      setUploadStatus({
        type: 'success',
        message: res.message || 'Dataset uploaded and validated successfully!',
        stats: res.stats
      });
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Failed to upload CSV file.'
      });
    } finally {
      setUploading(false);
    }
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
        maxWidth: 580,
        padding: 26,
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255, 181, 0, 0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={20} color="var(--ups-gold)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
              Dataset Upload & Pipeline Management
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Dataset Type Selector */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: 8 }}>
            Select Target Dataset Pipeline:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {datasetOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setSelectedType(opt.id); setUploadStatus(null); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  textAlign: 'left',
                  border: `1px solid ${selectedType === opt.id ? 'var(--ups-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: selectedType === opt.id ? 'rgba(255, 181, 0, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedType === opt.id ? 'var(--ups-gold)' : '#F8FAFC' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#64748B', marginTop: 2 }}>
                  Req: {opt.required}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Picker */}
        <div style={{
          border: '2px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: 10,
          padding: '24px 16px',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.2)',
          marginBottom: 16
        }}>
          <Upload size={30} color="var(--ups-gold)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
            {file ? file.name : 'Choose a CSV file or drag & drop'}
          </div>
          <p style={{ fontSize: '0.725rem', color: '#94A3B8', marginTop: 4 }}>
            Supported format: Standard CSV with UTF-8 encoding
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input" className="btn btn-secondary btn-sm" style={{ marginTop: 12, cursor: 'pointer' }}>
            Browse CSV
          </label>
        </div>

        {/* Status display */}
        {uploadStatus && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 8,
            marginBottom: 16,
            background: uploadStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${uploadStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            {uploadStatus.type === 'success' ? <CheckCircle2 size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
            <div style={{ fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 600, color: uploadStatus.type === 'success' ? '#6EE7B7' : '#FCA5A5' }}>
                {uploadStatus.message}
              </div>
              {uploadStatus.stats && (
                <div style={{ fontSize: '0.725rem', color: '#94A3B8', marginTop: 4 }}>
                  Records: {uploadStatus.stats.record_count} | Range: {uploadStatus.stats.start_date} to {uploadStatus.stats.end_date}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn btn-primary"
          >
            {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>{uploading ? 'Validating...' : 'Upload & Train Model'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
