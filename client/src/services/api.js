// Centralized API client for Digital Leave System
const envApi = import.meta.env.VITE_API_BASE_URL;
const API_BASE = envApi 
  ? (envApi.endsWith('/api') ? envApi : `${envApi.replace(/\/$/, '')}/api`)
  : '/api';


export const getAuthToken = () => localStorage.getItem('bitm_auth_token');
export const setAuthToken = (token) => localStorage.setItem('bitm_auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('bitm_auth_token');

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.message || (typeof data === 'string' ? data : 'API Request failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Organizations / Multi-institution
  getOrganizations: () => request('/auth/organizations'),
  getOrganization: (id) => request(`/auth/organizations/${id}`),
  createOrganization: (data) => request('/auth/organizations', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateOrganization: (id, data) => request(`/auth/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteOrganization: (id) => request(`/auth/organizations/${id}`, {
    method: 'DELETE'
  }),

  // Auth
  studentLogin: (credentials) => {
    // Accepts either (usn, password) or object { usn, studentName, dob, organizationId }
    const body = typeof credentials === 'object'
      ? credentials
      : { usn: arguments[0], dob: arguments[1] };
    return request('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  authorityLogin: (credentials, passArg) => {
    // Accepts either (email, password) or object { email, password, organizationId }
    const body = typeof credentials === 'object'
      ? credentials
      : { email: credentials, password: passArg };
    return request('/auth/authority/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  authorityChangePassword: (currentPassword, newPassword) => request('/auth/authority/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),
  updateProfile: (data) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getMe: () => request('/auth/me'),

  // Leaves
  applyLeave: (formData) => request('/leaves/apply', {
    method: 'POST',
    body: formData
  }),
  getStudentLeaves: () => request('/leaves/student'),
  getAuthorityLeaves: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/leaves/authority?${searchParams}`);
  },
  getLeaveById: (id) => request(`/leaves/${id}`),
  approveLeave: (id, approverName, approverDesignation, comments) => request(`/leaves/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approverName, approverDesignation, comments })
  }),
  rejectLeave: (id, rejectionReason, rejectingName) => request(`/leaves/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason, rejectingName })
  }),
  markLeaveInvalid: (id, { authorityName, reason, attendancePenaltyDays }) => request(`/leaves/${id}/mark-invalid`, {
    method: 'POST',
    body: JSON.stringify({ authorityName, reason, attendancePenaltyDays })
  }),

  // QR & Token Verification
  getQrCode: (leaveId) => request(`/qr/code/${leaveId}`),
  scanQr: (token) => request('/qr/scan', {
    method: 'POST',
    body: JSON.stringify({ token })
  }),
  verifyLeave: (leaveId, tokenId, verifiedByName, notes) => request('/qr/verify', {
    method: 'POST',
    body: JSON.stringify({ leaveId, tokenId, verifiedByName, notes })
  }),

  // Student Management (Authority only)
  getStudents: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/authority/students?${searchParams}`);
  },
  createStudent: (data) => request('/authority/students', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateStudent: (id, data) => request(`/authority/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateStudentPhoto: (id, photoDataUrl) => request(`/authority/students/${id}/photo`, {
    method: 'POST',
    body: JSON.stringify({ photoDataUrl })
  }),
  deleteStudent: (id) => request(`/authority/students/${id}`, {
    method: 'DELETE'
  }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  clearAllNotifications: () => request('/notifications', { method: 'DELETE' }),

  // Audit Logs & Departments
  getAuditLogs: () => request('/audit-logs'),
  getDepartments: (organizationId) => {
    const q = organizationId ? `?organizationId=${organizationId}` : '';
    return request(`/departments${q}`);
  },
  createDepartment: (data) => request('/departments', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
