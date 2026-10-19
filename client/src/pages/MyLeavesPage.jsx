import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  CalendarCheck2,
  Filter,
  Eye,
  QrCode,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  X,
  Download,
  AlertCircle,
  Calendar,
  RotateCw
} from 'lucide-react';

import DocumentPreviewModal from '../components/DocumentPreviewModal';

export default function MyLeavesPage({ onSelectLeave, onOpenQrPass }) {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchLeaves = async () => {
    try {
      setRefreshing(true);
      const res = await api.getStudentLeaves();
      if (res.success) {
        setLeaves(res.leaves);
        applyFilter(activeFilter || 'ALL', res.leaves);
      }
    } catch (err) {
      console.error('Fetch leaves error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const applyFilter = (filter, data = leaves) => {
    setActiveFilter(filter);
    if (filter === 'ALL') {
      setFilteredLeaves(data);
    } else {
      setFilteredLeaves(data.filter((l) => l.status === filter));
    }
  };

  return (
    <div className="page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            My Leave Applications
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Comprehensive record of your leave submissions, authority decisions, and return verifications
          </p>
        </div>

        {/* Filter Pills & Refresh */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={fetchLeaves}
            className="btn btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Refresh My Leaves"
          >
            <RotateCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          {['ALL', 'PENDING', 'APPROVED', 'VERIFIED', 'REJECTED'].map((filter) => (
            <button
              key={filter}
              onClick={() => applyFilter(filter)}
              className="btn btn-outline"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: '9999px',
                background: activeFilter === filter ? 'var(--primary-800)' : '#ffffff',
                color: activeFilter === filter ? '#ffffff' : 'var(--text-main)',
                borderColor: activeFilter === filter ? 'var(--primary-800)' : 'var(--border-color)',
                fontWeight: activeFilter === filter ? 700 : 500
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Leave Type</th>
                <th>Dates & Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Authority Action</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    {loading ? 'Fetching your applications...' : `No leave records found for filter "${activeFilter}".`}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-800)', fontSize: '0.88rem' }}>
                        {leave.leave_application_number}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="var(--primary-600)" />
                        <span>{leave.start_date} <span style={{ color: 'var(--text-muted)' }}>to</span> {leave.end_date}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span><strong>{leave.number_of_days}</strong> Day{leave.number_of_days > 1 ? 's' : ''}</span>
                        {leave.grace_date && <span style={{ color: '#b45309' }}>• Grace: {leave.grace_date}</span>}
                      </div>
                    </td>
                    <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {leave.reason}
                    </td>
                    <td>
                      <span className={`status-pill status-${leave.status}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'APPROVED' || leave.status === 'VERIFIED' ? (
                        <div style={{ fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Approved by</span>
                          <br />
                          {leave.approved_by_name || 'BITM Authority'}
                        </div>
                      ) : leave.status === 'REJECTED' ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600 }}>
                          Rejected
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Under Review</span>
                      )}
                    </td>
                    <td>
                      {leave.verification_status === 'VERIFIED' || leave.status === 'VERIFIED' ? (
                        <span className="status-pill status-VERIFIED">VERIFIED</span>
                      ) : leave.status === 'APPROVED' ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                          Pending Return
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => setSelectedLeave(leave)}
                          title="View Application Details"
                        >
                          <Eye size={13} /> View
                        </button>
                        {(leave.status === 'APPROVED' || leave.status === 'VERIFIED') && (
                          <button
                            className="btn btn-accent"
                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                            onClick={() => onOpenQrPass(leave.id)}
                            title="Open Digital Gate Pass QR"
                          >
                            <QrCode size={13} /> QR Pass
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Details Modal */}
      {selectedLeave && (
        <div className="modal-backdrop" onClick={() => setSelectedLeave(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Leave Details</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                  {selectedLeave.leave_application_number}
                </span>
              </div>
              <button onClick={() => setSelectedLeave(null)} className="icon-btn" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Leave Type
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedLeave.leave_type}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Current Status
                  </span>
                  <div>
                    <span className={`status-pill status-${selectedLeave.status}`}>
                      {selectedLeave.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Duration
                  </span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {selectedLeave.start_date} to {selectedLeave.end_date} ({selectedLeave.number_of_days} Days)
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Submitted On
                  </span>
                  <div style={{ fontSize: '0.85rem' }}>
                    {new Date(selectedLeave.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Reason for Leave
                </span>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 4, fontSize: '0.9rem' }}>
                  {selectedLeave.reason}
                </div>
              </div>

              {selectedLeave.additional_remarks && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Additional Remarks
                  </span>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 4, fontSize: '0.88rem' }}>
                    {selectedLeave.additional_remarks}
                  </div>
                </div>
              )}

              {/* Approval / Rejection comments */}
              {selectedLeave.approval_comments && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Authority Decision Notes
                  </span>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: selectedLeave.status === 'REJECTED' ? '#fee2e2' : '#dbeafe',
                      color: selectedLeave.status === 'REJECTED' ? '#991b1b' : '#1e40af',
                      marginTop: 4,
                      fontSize: '0.88rem',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <strong>{selectedLeave.approved_by_name || 'BITM Authority'} ({selectedLeave.approved_by_role}):</strong> {selectedLeave.approval_comments}
                  </div>
                </div>
              )}

              {/* Uploaded Supporting Document */}
              {selectedLeave.document_file && (
                <div style={{ marginTop: 18 }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Uploaded Supporting Document
                  </span>
                  <div
                    style={{
                      marginTop: 6,
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {selectedLeave.document_type?.startsWith('image/') ? (
                      <div>
                        <img
                          src={`/api/leaves/documents/${selectedLeave.document_file}`}
                          alt="Supporting Document"
                          style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--radius-sm)', objectFit: 'contain', display: 'block', margin: '0 auto 10px', cursor: 'pointer' }}
                          onClick={() => setPreviewDoc({
                            url: `/api/leaves/documents/${selectedLeave.document_file}`,
                            name: selectedLeave.document_name,
                            type: selectedLeave.document_type
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({
                            url: `/api/leaves/documents/${selectedLeave.document_file}`,
                            name: selectedLeave.document_name,
                            type: selectedLeave.document_type
                          })}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '6px 12px', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Eye size={14} /> View Full Supporting Proof ({selectedLeave.document_name})
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileText size={28} color="var(--primary-700)" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{selectedLeave.document_name}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF Supporting Proof</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({
                            url: `/api/leaves/documents/${selectedLeave.document_file}`,
                            name: selectedLeave.document_name,
                            type: selectedLeave.document_type
                          })}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Eye size={14} /> View PDF In-App
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {(selectedLeave.status === 'APPROVED' || selectedLeave.status === 'VERIFIED') && (
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    const id = selectedLeave.id;
                    setSelectedLeave(null);
                    onOpenQrPass(id);
                  }}
                >
                  <QrCode size={16} /> Open Gate Pass QR
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setSelectedLeave(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Document Preview Modal (No external URL) */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        fileUrl={previewDoc?.url}
        fileName={previewDoc?.name}
        fileType={previewDoc?.type}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
