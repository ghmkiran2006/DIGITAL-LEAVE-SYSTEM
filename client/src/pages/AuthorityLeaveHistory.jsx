import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ListFilter,
  Search,
  Eye,
  Download,
  FileText,
  X,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCw,
  Calendar
} from 'lucide-react';

import Avatar from '../components/Avatar';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

export default function AuthorityLeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const departments = ['ALL', 'CSE', 'ECE', 'ISE', 'ME', 'EEE', 'Civil', 'AI&ML'];
  const statuses = ['ALL', 'PENDING', 'APPROVED', 'VERIFIED', 'REJECTED'];

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.getAuthorityLeaves({
        status: selectedStatus,
        department: selectedDept,
        search: searchTerm
      });
      if (res.success) {
        setLeaves(res.leaves);
      }
    } catch (err) {
      console.error('Fetch all leaves error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [selectedStatus, selectedDept]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeaves();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaves();
    setRefreshing(false);
  };

  return (
    <div className="page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            Authority Leave Archive & History
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Search, filter, and audit all student leave requests across departments
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search Name, USN, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.85rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }}>
              Search
            </button>
          </form>
          <button
            onClick={handleRefresh}
            className="btn btn-outline"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh list"
          >
            <RotateCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-900)' }}>
          <Filter size={16} color="var(--primary-700)" /> Filter By:
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Department:</span>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{leaves.length}</strong> records
        </span>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Leave ID</th>
                <th>Student</th>
                <th>USN</th>
                <th>Dept</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading records...' : 'No leave applications match the selected criteria.'}
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-800)', fontSize: '0.85rem' }}>
                        {leave.leave_application_number}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar
                          src={leave.student_photo}
                          name={leave.student_name}
                          subtitle={leave.usn}
                          size={32}
                        />
                        <span style={{ fontWeight: 600 }}>{leave.student_name}</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.82rem' }}>{leave.usn}</code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{leave.department_code}</span>
                    </td>
                    <td>{leave.leave_type}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                        <Calendar size={13} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                        <span>{leave.start_date}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: 18 }}>→ {leave.end_date}</div>
                      <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, paddingLeft: 18 }}>{leave.number_of_days} Days</span>
                    </td>
                    <td>
                      <span className={`status-pill status-${leave.status}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {leave.approved_by_name || '-'}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'VERIFIED' ? (
                        <span className="status-pill status-VERIFIED">VERIFIED</span>
                      ) : leave.status === 'APPROVED' ? (
                        <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Pending Return</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                        onClick={() => setSelectedLeave(leave)}
                      >
                        <Eye size={13} /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLeave && (
        <div className="modal-backdrop" onClick={() => setSelectedLeave(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Leave Record</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                  {selectedLeave.leave_application_number}
                </span>
              </div>
              <button onClick={() => setSelectedLeave(null)} className="icon-btn" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Student Name
                  </span>
                  <div style={{ fontWeight: 700 }}>{selectedLeave.student_name} ({selectedLeave.usn})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Department & Semester
                  </span>
                  <div style={{ fontWeight: 600 }}>{selectedLeave.department_code} • Sem {selectedLeave.semester}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Leave Type & Days
                  </span>
                  <div style={{ fontWeight: 600 }}>{selectedLeave.leave_type} ({selectedLeave.number_of_days} Days)</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Status
                  </span>
                  <div>
                    <span className={`status-pill status-${selectedLeave.status}`}>{selectedLeave.status}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Reason Stated
                </span>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 4, fontSize: '0.88rem' }}>
                  {selectedLeave.reason}
                </div>
              </div>

              {selectedLeave.approval_comments && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Decision Remarks
                  </span>
                  <div style={{ padding: '10px 14px', background: '#f0f7ff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 4, fontSize: '0.88rem' }}>
                    {selectedLeave.approval_comments}
                  </div>
                </div>
              )}

              {selectedLeave.document_file && (
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Supporting Document
                  </span>
                  <div style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({
                        url: `/api/leaves/documents/${selectedLeave.document_file}`,
                        name: selectedLeave.document_name,
                        type: selectedLeave.document_type
                      })}
                      className="btn btn-outline"
                      style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={14} /> View Supporting Document ({selectedLeave.document_name})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedLeave(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Document Preview Modal */}
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
