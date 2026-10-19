import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import ImageCropperModal from '../components/ImageCropperModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  Camera,
  X,
  Plus,
  RefreshCw,
  FolderOpen,
  ChevronRight
} from 'lucide-react';

export default function StudentManagementPage() {
  const { user } = useAuth();
  const isSchool = user?.organizationType === 'School';

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Hierarchical view state:
  // For College: selectedDept -> selectedSemester -> students
  // For School: selectedStandard -> selectedSection -> students
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedStandard, setSelectedStandard] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditStudent, setCurrentEditStudent] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperTarget, setCropperTarget] = useState(null); // 'new' | 'edit'
  const [croppedPhoto, setCroppedPhoto] = useState('');
  const modalBodyRef = React.useRef(null);

  useEffect(() => {
    if (showAddModal || showEditModal) {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    }
  }, [showAddModal, showEditModal]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsn, setFormUsn] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formSemester, setFormSemester] = useState(1);
  const [formStandard, setFormStandard] = useState('1st Standard');
  const [formSection, setFormSection] = useState('A');
  const [formParentContact, setFormParentContact] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const schoolStandards = [
    '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
    '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard'
  ];
  const schoolSections = ['A', 'B', 'C', 'D'];
  const collegeSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const fetchStudentsAndDepts = async () => {
    try {
      setLoading(true);
      const [studRes, deptRes] = await Promise.all([
        api.getStudents(),
        api.getDepartments(user?.organizationId)
      ]);
      if (studRes.success) setStudents(studRes.students || []);
      if (deptRes.success) setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Fetch student management error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndDepts();
  }, [user]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormUsn('');
    setFormDob('');
    setFormEmail('');
    setFormMobile('');
    setFormDept(departments[0]?.id || '');
    setFormSemester(1);
    setFormStandard('1st Standard');
    setFormSection('A');
    setFormParentContact('');
    setCroppedPhoto('');
    setActionError('');
    setActionSuccess('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (stud) => {
    setCurrentEditStudent(stud);
    setFormName(stud.full_name || '');
    setFormUsn(stud.usn || '');
    setFormDob(stud.dob || '');
    setFormEmail(stud.email || '');
    setFormMobile(stud.mobile_number || '');
    setFormDept(stud.department_id || departments[0]?.id || '');
    setFormSemester(stud.semester || 1);
    setFormStandard(stud.standard || '1st Standard');
    setFormSection(stud.section || 'A');
    setFormParentContact(stud.parent_contact || '');
    setCroppedPhoto(stud.profile_photo || '');
    setActionError('');
    setActionSuccess('');
    setShowEditModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!formName.trim() || !formDob.trim()) {
      setActionError('Student Name and Date of Birth are mandatory.');
      return;
    }

    if (!isSchool && !formUsn.trim()) {
      setActionError('Student ID / USN is mandatory.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        fullName: formName.trim(),
        usn: formUsn.trim(),
        dob: formDob.trim(),
        email: formEmail.trim() || null,
        mobileNumber: formMobile.trim() || null,
        departmentId: !isSchool ? formDept : null,
        semester: !isSchool ? parseInt(formSemester, 10) : null,
        standard: isSchool ? formStandard : null,
        section: isSchool ? formSection : null,
        parentContact: formParentContact.trim() || null,
        profilePhoto: croppedPhoto || null
      };

      if (showAddModal) {
        const res = await api.createStudent(payload);
        if (res.success) {
          setActionSuccess(`Student ${res.student.fullName} added successfully.`);
          setTimeout(() => {
            setShowAddModal(false);
            fetchStudentsAndDepts();
          }, 800);
        }
      } else if (showEditModal && currentEditStudent) {
        const res = await api.updateStudent(currentEditStudent.id, payload);
        if (res.success) {
          setActionSuccess('Student details updated successfully.');
          setTimeout(() => {
            setShowEditModal(false);
            fetchStudentsAndDepts();
          }, 800);
        }
      }
    } catch (err) {
      setActionError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (stud) => {
    if (window.confirm(`Are you sure you want to permanently delete student account for ${stud.full_name} (${stud.usn})?`)) {
      try {
        await api.deleteStudent(stud.id);
        fetchStudentsAndDepts();
      } catch (err) {
        alert(err.message || 'Failed to delete student.');
      }
    }
  };

  // Filter students based on selection & search
  const filteredStudents = students.filter((s) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match =
        s.full_name?.toLowerCase().includes(term) ||
        s.usn?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.standard?.toLowerCase().includes(term) ||
        s.department_code?.toLowerCase().includes(term);
      if (!match) return false;
    }

    if (isSchool) {
      if (selectedStandard !== 'ALL' && s.standard !== selectedStandard) return false;
      if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;
    } else {
      if (selectedDept !== 'ALL' && s.department_id !== selectedDept && s.department_code !== selectedDept) return false;
      if (selectedSemester !== 'ALL' && s.semester !== parseInt(selectedSemester, 10)) return false;
    }

    return true;
  });

  return (
    <div className="page-transition">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            Student Management & Enrollment
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isSchool
              ? 'Organized by Standard → Section → Students'
              : 'Organized by Department → Semester → Students'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchStudentsAndDepts}
            className="btn btn-outline"
            style={{ padding: '8px 14px' }}
            title="Refresh List"
          >
            <RefreshCw size={15} /> Refresh
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <UserPlus size={17} /> Add Student
          </button>
        </div>
      </div>

      {/* Hierarchical Filters */}
      <div className="form-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          {isSchool ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Standard
                </label>
                <select
                  className="form-control"
                  style={{ width: 170, padding: '7px 12px', fontSize: '0.85rem' }}
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                >
                  <option value="ALL">All Standards</option>
                  {schoolStandards.map((std) => (
                    <option key={std} value={std}>{std}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Section
                </label>
                <select
                  className="form-control"
                  style={{ width: 130, padding: '7px 12px', fontSize: '0.85rem' }}
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="ALL">All Sections</option>
                  {schoolSections.map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Department
                </label>
                <select
                  className="form-control"
                  style={{ width: 220, padding: '7px 12px', fontSize: '0.85rem' }}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Semester
                </label>
                <select
                  className="form-control"
                  style={{ width: 150, padding: '7px 12px', fontSize: '0.85rem' }}
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="ALL">All Semesters</option>
                  {collegeSemesters.map((sem) => (
                    <option key={sem} value={sem}>{sem}th Semester</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ position: 'relative', width: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search Name or USN/ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, paddingRight: 10, fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="table-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>
            Showing {filteredStudents.length} Students
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>{isSchool ? 'Standard & Section' : 'Dept & Semester'}</th>
                <th>Student ID / USN</th>
                <th>Date of Birth (Password)</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading students...' : 'No student records found matching the selected hierarchy.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stud) => (
                  <tr key={stud.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar
                          src={stud.profile_photo}
                          name={stud.full_name}
                          subtitle={stud.usn}
                          size={40}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-900)', fontSize: '0.9rem' }}>
                            {stud.full_name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {stud.email || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {isSchool ? (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--primary-800)' }}>{stud.standard || '1st Standard'}</span>
                          {stud.section && <span style={{ marginLeft: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sec {stud.section}</span>}
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--primary-800)' }}>{stud.department_code || 'Dept'}</span>
                          <span style={{ marginLeft: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Sem {stud.semester}</span>
                        </div>
                      )}
                    </td>

                    <td>
                      <strong style={{ color: 'var(--primary-800)', fontSize: '0.88rem' }}>{stud.usn}</strong>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{stud.dob}</span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem' }}>{stud.mobile_number || '—'}</div>
                    </td>

                    <td>
                      <span className={`status-pill status-${stud.status}`}>
                        {stud.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEdit(stud)}
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          title="Edit Student Details"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(stud)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px', fontSize: '0.78rem', color: 'var(--danger)' }}
                          title="Delete Student"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(showAddModal || showEditModal) && (
        <div
          className="modal-backdrop"
          onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
          style={{
            alignItems: 'flex-start',
            paddingTop: '28px',
            paddingBottom: '28px'
          }}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 640,
              width: '100%',
              margin: '0 auto',
              maxHeight: 'calc(100vh - 56px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {showAddModal ? 'Enroll New Student' : 'Edit Student Information'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="icon-btn"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflow: 'hidden', minHeight: 0 }}>
              <div
                ref={modalBodyRef}
                className="modal-body"
                style={{ overflowY: 'auto', flex: '1 1 auto', padding: '20px 24px' }}
              >
                {actionError && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', marginBottom: 16 }}>
                    {actionError}
                  </div>
                )}
                {actionSuccess && (
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.85rem', marginBottom: 16 }}>
                    {actionSuccess}
                  </div>
                )}

                {/* Authority Profile Photo (DP) Control */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px dashed var(--border-color, #cbd5e1)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    padding: '16px',
                    textAlign: 'center',
                    marginBottom: 20
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted, #64748b)',
                      marginBottom: 10
                    }}
                  >
                    Student Profile Photo (Circular DP)
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar
                        src={croppedPhoto}
                        name={formName || 'Student'}
                        size={80}
                        allowViewer={Boolean(croppedPhoto)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCropper(true)}
                        style={{
                          position: 'absolute',
                          right: -4,
                          bottom: -4,
                          background: 'var(--primary-600, #2563eb)',
                          color: '#ffffff',
                          border: '2px solid #ffffff',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}
                        title="Upload / Crop Profile Photo"
                      >
                        <Camera size={15} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <button
                          type="button"
                          onClick={() => setShowCropper(true)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <Camera size={14} />
                          {croppedPhoto ? 'Change / Crop Photo' : 'Add Profile Photo'}
                        </button>
                        {croppedPhoto && (
                          <button
                            type="button"
                            onClick={() => setCroppedPhoto('')}
                            className="btn btn-outline"
                            style={{ fontSize: '0.82rem', padding: '6px 12px', color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Click to crop and upload student's official circular DP.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Student Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{isSchool ? 'Student ID / Roll No' : 'University Seat Number (USN) *'}</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={isSchool ? 'e.g. SCH-001' : 'e.g. 3BR23CS001'}
                      value={formUsn}
                      onChange={(e) => setFormUsn(e.target.value.toUpperCase())}
                      required={!isSchool}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth (Login Password) *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                      Format: Day + Month + Year is used for student login
                    </span>
                  </div>

                  {isSchool ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Standard *</label>
                        <select
                          className="form-control"
                          value={formStandard}
                          onChange={(e) => setFormStandard(e.target.value)}
                        >
                          {schoolStandards.map((std) => (
                            <option key={std} value={std}>{std}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Section *</label>
                        <select
                          className="form-control"
                          value={formSection}
                          onChange={(e) => setFormSection(e.target.value)}
                        >
                          {schoolSections.map((sec) => (
                            <option key={sec} value={sec}>Section {sec}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Department *</label>
                        <select
                          className="form-control"
                          value={formDept}
                          onChange={(e) => setFormDept(e.target.value)}
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Semester *</label>
                        <select
                          className="form-control"
                          value={formSemester}
                          onChange={(e) => setFormSemester(parseInt(e.target.value, 10))}
                        >
                          {collegeSemesters.map((sem) => (
                            <option key={sem} value={sem}>{sem}th Semester</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="student@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+91 9876543210"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Parent / Guardian Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Parent name and mobile number"
                      value={formParentContact}
                      onChange={(e) => setFormParentContact(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : showAddModal ? 'Create Student Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={showCropper}
        initialImage={croppedPhoto}
        onCropComplete={(croppedDataUrl) => setCroppedPhoto(croppedDataUrl)}
        onClose={() => setShowCropper(false)}
      />
    </div>
  );
}
