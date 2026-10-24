const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const app = require('../src/server');
const db = require('../src/db/database');

async function runTests() {
  console.log('--- Starting BITM System Automated API & Admin Integration Tests ---');

  // Start an in-memory HTTP server on an available port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test server running on ${baseUrl}`);

  // Helper fetch with JSON
  async function api(endpoint, options = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, options);
    let data = null;
    try {
      data = await res.json();
    } catch {
      // not JSON
    }
    return { status: res.status, data };
  }

  let testStudentId = null;
  let testProfileId = null;
  let testLeaveId = null;

  try {
    // 1. Health check
    console.log('\n--- 1. Health & Server Status ---');
    const health = await api('/api/health');
    if (health.status !== 200 || health.data.status !== 'ok') {
      throw new Error('Health check failed: ' + JSON.stringify(health));
    }
    console.log('✓ Health check endpoint operational');

    // 2. Admin Login & Governance Tests
    console.log('\n--- 2. System Administrator Portal Tests ---');
    const adminLogin = await api('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrId: 'admin@system.local',
        password: 'Admin@1234'
      })
    });
    if (adminLogin.status !== 200 || !adminLogin.data.token || adminLogin.data.user.userType !== 'admin') {
      throw new Error('Admin login failed: ' + JSON.stringify(adminLogin));
    }
    const adminToken = adminLogin.data.token;
    console.log('✓ Admin login successful. Token granted for Super Administrator');

    // Admin System Overview Stats
    const statsRes = await api('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (statsRes.status !== 200 || !statsRes.data.success || !statsRes.data.stats) {
      throw new Error('Failed to fetch admin stats: ' + JSON.stringify(statsRes));
    }
    console.log(`✓ Admin system stats loaded (${statsRes.data.stats.totalOrganizations} orgs, ${statsRes.data.stats.totalAuthorities} authorities, ${statsRes.data.stats.totalStudents} students)`);

    // Admin Organisations List
    const orgs = await api('/api/admin/organizations', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (orgs.status !== 200 || !Array.isArray(orgs.data.organizations)) {
      throw new Error('Failed to fetch organisations list');
    }
    console.log(`✓ Admin fetched ${orgs.data.organizations.length} institutions`);

    // Admin Authorities List
    const authorities = await api('/api/admin/authorities', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (authorities.status !== 200 || !Array.isArray(authorities.data.authorities)) {
      throw new Error('Failed to fetch authorities list');
    }
    console.log(`✓ Admin fetched ${authorities.data.authorities.length} authority accounts`);

    // Admin Audit Logs
    const auditLogs = await api('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (auditLogs.status !== 200 || !Array.isArray(auditLogs.data.logs)) {
      throw new Error('Failed to fetch admin audit logs');
    }
    console.log(`✓ Admin fetched ${auditLogs.data.logs.length} system audit logs`);

    // 3. Authority Login & Student Enrollment Tests
    console.log('\n--- 3. Authority Role & Student Enrollment Tests ---');
    const authLogin = await api('/api/auth/authority/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'BITM@gmail.com', password: 'BITM1234' })
    });
    if (authLogin.status !== 200 || !authLogin.data.token) {
      throw new Error('Authority login failed: ' + JSON.stringify(authLogin));
    }
    const authToken = authLogin.data.token;
    console.log('✓ Authority login successful. Role:', authLogin.data.user.role);

    // Authority is blocked from Admin endpoints (RBAC)
    const authBlock = await api('/api/admin/stats', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (authBlock.status !== 403) {
      throw new Error('Expected 403 for Authority trying to access Admin endpoint, got: ' + authBlock.status);
    }
    console.log('✓ RBAC: Authority forbidden from accessing Admin portal (403)');

    // Authority enrolls a test student dynamically
    const runId = Date.now();
    const testUsn = `AUTO-${runId}`;
    const testEmail = `test.${runId}@bitm.edu.in`;
    const createStudRes = await api('/api/authority/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fullName: 'Automated Test Student',
        usn: testUsn,
        dob: '2005-08-15',
        email: testEmail,
        mobileNumber: '+91 98888 11111',
        departmentId: 'dept-cse',
        semester: 5,
        parentContact: '+91 98888 22222'
      })
    });
    if (createStudRes.status !== 201 || !createStudRes.data.student) {
      throw new Error('Student enrollment failed: ' + JSON.stringify(createStudRes));
    }
    testStudentId = createStudRes.data.student.id;
    testProfileId = createStudRes.data.student.profileId;
    console.log(`✓ Authority enrolled test student: ${createStudRes.data.student.fullName} (${testUsn})`);

    // 4. Student Authentication & Leave Application Tests
    console.log('\n--- 4. Student Authentication & Leave Workflow Tests ---');
    // Wrong DOB test
    const wrongStudentPass = await api('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn: testUsn, dob: '2001-01-01' })
    });
    if (wrongStudentPass.status !== 401) {
      throw new Error('Expected 401 for wrong student DOB, got: ' + wrongStudentPass.status);
    }
    console.log('✓ Student wrong DOB properly rejected (401)');

    // Correct student login
    const studentLogin = await api('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn: testUsn, dob: '2005-08-15' })
    });
    if (studentLogin.status !== 200 || !studentLogin.data.token) {
      throw new Error('Student login failed: ' + JSON.stringify(studentLogin));
    }
    const studentToken = studentLogin.data.token;
    console.log('✓ Student logged in successfully');

    // Student blocked from Authority endpoints
    const studBlockAuth = await api('/api/leaves/authority', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (studBlockAuth.status !== 403) {
      throw new Error('Expected 403 for student accessing authority route');
    }
    console.log('✓ RBAC: Student forbidden from accessing Authority dashboard (403)');

    // Student blocked from Admin endpoints
    const studBlockAdmin = await api('/api/admin/stats', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (studBlockAdmin.status !== 403) {
      throw new Error('Expected 403 for student accessing admin route');
    }
    console.log('✓ RBAC: Student forbidden from accessing Admin portal (403)');

    // Mandatory document validation
    const formNoDoc = new FormData();
    formNoDoc.append('leaveType', 'Medical Leave');
    formNoDoc.append('reason', 'Viral fever symptoms');
    formNoDoc.append('startDate', '2026-11-01');
    formNoDoc.append('endDate', '2026-11-03');

    const applyNoDoc = await fetch(`${baseUrl}/api/leaves/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formNoDoc
    });
    const applyNoDocJson = await applyNoDoc.json();
    if (applyNoDoc.status !== 400 || !applyNoDocJson.message.includes('Supporting document is required')) {
      throw new Error('Expected 400 for missing mandatory document: ' + JSON.stringify(applyNoDocJson));
    }
    console.log('✓ Leave submission rejects request missing supporting document');

    // Successful leave submission with supporting document
    const dummyPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const formWithDoc = new FormData();
    formWithDoc.append('leaveType', 'Medical Leave');
    formWithDoc.append('reason', 'High fever and viral flu symptoms');
    formWithDoc.append('startDate', '2026-11-01');
    formWithDoc.append('endDate', '2026-11-03');
    formWithDoc.append('additionalRemarks', 'Doctor advised 3 days complete bed rest');
    formWithDoc.append('supportingDocument', new Blob([dummyPngBuffer], { type: 'image/png' }), 'doctor_prescription.png');

    const applyWithDoc = await fetch(`${baseUrl}/api/leaves/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formWithDoc
    });
    const applyData = await applyWithDoc.json();
    if (applyWithDoc.status !== 201 || !applyData.leaveId) {
      throw new Error('Leave application failed: ' + JSON.stringify(applyData));
    }
    testLeaveId = applyData.leaveId;
    console.log(`✓ Leave application created: ${applyData.leaveApplicationNumber} (ID: ${testLeaveId})`);

    // 5. Authority Review, Approval & QR Verification Tests
    console.log('\n--- 5. Authority Approval & QR Verification Workflow ---');
    // Verify leave is in pending queue
    const pendingLeaves = await api('/api/leaves/authority?status=PENDING', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (pendingLeaves.status !== 200 || !pendingLeaves.data.leaves.some((l) => l.id === testLeaveId)) {
      throw new Error('Leave not found in pending queue');
    }
    console.log('✓ Leave visible in authority pending queue');

    // Authority approves leave
    const approveRes = await api(`/api/leaves/${testLeaveId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        approverName: 'Dr. Ramesh Kumar',
        approverDesignation: 'HOD / Proctor',
        comments: 'Approved after verification of medical prescription'
      })
    });
    if (approveRes.status !== 200 || !approveRes.data.success || !approveRes.data.token) {
      throw new Error('Leave approval failed: ' + JSON.stringify(approveRes));
    }
    const qrToken = approveRes.data.token;
    console.log(`✓ Leave approved. Secure QR token generated: ${qrToken.slice(0, 16)}...`);

    // QR Verification Scan (First Scan - Valid Lookup)
    const scanRes = await api('/api/qr/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: qrToken })
    });
    if (scanRes.status !== 200 || scanRes.data.status !== 'VALID_LEAVE' || !scanRes.data.valid) {
      throw new Error('QR scan verification lookup failed: ' + JSON.stringify(scanRes));
    }
    console.log('✓ QR scan verified successfully: VALID_LEAVE');

    // Authority confirms final verification with Proctor name
    const verifyConfirm = await api('/api/qr/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        leaveId: testLeaveId,
        tokenId: scanRes.data.tokenRecordId,
        verifiedByName: 'Prof. Anitha Sharma',
        notes: 'Gate check verified by Security In-charge'
      })
    });
    if (verifyConfirm.status !== 200 || !verifyConfirm.data.success) {
      throw new Error('Final QR verification failed: ' + JSON.stringify(verifyConfirm));
    }
    console.log('✓ Authority confirmed leave verification: Expired & archived');

    // Duplicate QR Scan Test (Must be blocked)
    const dupScan = await api('/api/qr/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: qrToken })
    });
    if (dupScan.data.valid !== false || (dupScan.data.status !== 'ALREADY_USED' && dupScan.data.status !== 'ALREADY_VERIFIED')) {
      throw new Error('Duplicate scan was not blocked: ' + JSON.stringify(dupScan));
    }
    console.log('✓ Duplicate QR scan blocked properly: ALREADY_USED');

    // Invalid QR Scan Test
    const invalidScan = await api('/api/qr/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: 'INVALID-QR-TOKEN-XYZ' })
    });
    if (invalidScan.data.valid !== false || invalidScan.data.status !== 'INVALID_LEAVE') {
      throw new Error('Invalid QR not handled correctly: ' + JSON.stringify(invalidScan));
    }
    console.log('✓ Invalid QR token rejected properly: INVALID_LEAVE');

    console.log('\n=======================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED (Admin, Auth, Student, QR)');
    console.log('=======================================================');
  } finally {
    // Clean up test data from DB
    try {
      db.exec('PRAGMA foreign_keys = OFF;');
      if (testLeaveId) {
        db.prepare('DELETE FROM qr_verification_tokens WHERE leave_id = ?').run(testLeaveId);
        db.prepare('DELETE FROM leave_verifications WHERE leave_id = ?').run(testLeaveId);
        db.prepare('DELETE FROM leave_approvals WHERE leave_id = ?').run(testLeaveId);
        db.prepare('DELETE FROM leave_documents WHERE leave_id = ?').run(testLeaveId);
        db.prepare('DELETE FROM leave_applications WHERE id = ?').run(testLeaveId);
      }
      if (testStudentId) {
        db.prepare('DELETE FROM students WHERE id = ?').run(testStudentId);
      }
      if (testProfileId) {
        db.prepare('DELETE FROM notifications WHERE user_id = ?').run(testProfileId);
        db.prepare('DELETE FROM profiles WHERE id = ?').run(testProfileId);
      }
      db.exec('PRAGMA foreign_keys = ON;');
    } catch (cleanupErr) {
      console.error('Test cleanup notice:', cleanupErr.message);
    }

    // Close in-memory test server
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:\n', err);
  process.exit(1);
});
