const fs = require('node:fs');
const path = require('node:path');

async function runTests() {
  console.log('--- Starting BITM System Automated API Tests ---');
  const baseUrl = 'http://localhost:5000';

  // Helper fetch with JSON
  async function api(endpoint, options = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await res.json();
    return { status: res.status, data };
  }

  try {
    // 1. Health check
    console.log('Test 1: Health Check');
    const health = await api('/api/health');
    if (health.status !== 200) throw new Error('Health check failed: ' + JSON.stringify(health));
    console.log('✓ Health check OK');

    // 2. Student login failure (wrong password)
    console.log('Test 2: Student Login with invalid password');
    const studentFail = await api('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn: 'BITMTEST001', password: 'WrongPassword' })
    });
    if (studentFail.status !== 401) throw new Error('Expected 401 on wrong student password, got: ' + studentFail.status);
    console.log('✓ Student wrong password rejected properly');

    // 3. Student login success (USN: BITMTEST001, DOB: 15March2006)
    console.log('Test 3: Student Login with valid credentials');
    const studentLogin = await api('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn: 'BITMTEST001', password: '15March2006' })
    });
    if (studentLogin.status !== 200 || !studentLogin.data.token) {
      throw new Error('Student login failed: ' + JSON.stringify(studentLogin));
    }
    const studentToken = studentLogin.data.token;
    console.log('✓ Student logged in successfully. Name:', studentLogin.data.user.fullName);

    // 4. Authority login success (BITM@gmail.com, BITM-1234)
    console.log('Test 4: Authority Login with demo credentials');
    const authLogin = await api('/api/auth/authority/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'BITM@gmail.com', password: 'BITM-1234' })
    });
    if (authLogin.status !== 200 || !authLogin.data.token) {
      throw new Error('Authority login failed: ' + JSON.stringify(authLogin));
    }
    const authToken = authLogin.data.token;
    console.log('✓ Authority logged in successfully. Role:', authLogin.data.user.role);

    // 5. Role-based protection: student forbidden from authority route
    console.log('Test 5: RBAC - Student forbidden from authority routes');
    const rbacTest = await api('/api/leaves/authority', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (rbacTest.status !== 403) throw new Error('Expected 403 for student accessing authority route, got: ' + rbacTest.status);
    console.log('✓ RBAC blocked student access to authority dashboard');

    // 6. Leave application without document (must be rejected)
    console.log('Test 6: Leave application validation without mandatory document');
    const formNoDoc = new FormData();
    formNoDoc.append('leaveType', 'Medical Leave');
    formNoDoc.append('reason', 'Fever');
    formNoDoc.append('startDate', '2026-10-10');
    formNoDoc.append('endDate', '2026-10-12');
    
    const applyNoDoc = await fetch(`${baseUrl}/api/leaves/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formNoDoc
    });
    const applyNoDocJson = await applyNoDoc.json();
    if (applyNoDoc.status !== 400 || !applyNoDocJson.message.includes('Supporting document is required')) {
      throw new Error('Expected 400 missing document error, got: ' + JSON.stringify(applyNoDocJson));
    }
    console.log('✓ Leave submission properly requires mandatory document');

    // 7. Leave application with document (Success flow)
    console.log('Test 7: Leave application submission with supporting document');
    const dummyCertPath = path.join(__dirname, 'test_medical_cert.png');
    // Create a 1x1 transparent png dummy file for testing
    const dummyPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(dummyCertPath, dummyPngBuffer);

    const formWithDoc = new FormData();
    formWithDoc.append('leaveType', 'Medical Leave');
    formWithDoc.append('reason', 'High fever and viral flu symptoms');
    formWithDoc.append('startDate', '2026-10-10');
    formWithDoc.append('endDate', '2026-10-12');
    formWithDoc.append('additionalRemarks', 'Doctor advised 3 days complete bed rest');
    
    const blob = new Blob([dummyPngBuffer], { type: 'image/png' });
    formWithDoc.append('supportingDocument', blob, 'medical_prescription.png');

    const applyWithDoc = await fetch(`${baseUrl}/api/leaves/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formWithDoc
    });
    const applyData = await applyWithDoc.json();
    if (applyWithDoc.status !== 201 || !applyData.leaveId) {
      throw new Error('Leave application failed: ' + JSON.stringify(applyData));
    }
    const createdLeaveId = applyData.leaveId;
    const leaveAppNumber = applyData.leaveApplicationNumber;
    console.log(`✓ Leave application created: ${leaveAppNumber} (ID: ${createdLeaveId})`);

    // 8. Authority views pending leaves
    console.log('Test 8: Authority views pending leave queue');
    const authLeaves = await api('/api/leaves/authority?status=PENDING', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (authLeaves.status !== 200 || !authLeaves.data.leaves.some(l => l.id === createdLeaveId)) {
      throw new Error('Newly created leave not found in authority pending list: ' + JSON.stringify(authLeaves));
    }
    console.log('✓ Leave visible in authority pending queue');

    // 9. Authority approves leave -> Generates QR Token
    console.log('Test 9: Authority approves leave and generates QR verification token');
    const approveRes = await api(`/api/leaves/${createdLeaveId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ comments: 'Verified medical certificate. Approved.' })
    });
    if (approveRes.status !== 200 || !approveRes.data.token) {
      throw new Error('Approval failed: ' + JSON.stringify(approveRes));
    }
    const qrToken = approveRes.data.token;
    console.log('✓ Leave approved successfully. Generated QR Token:', qrToken);

    // 10. Student fetches QR pass
    console.log('Test 10: Student retrieves approved QR pass');
    const studentQr = await api(`/api/qr/code/${createdLeaveId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (studentQr.status !== 200 || !studentQr.data.qrDataUrl || studentQr.data.token !== qrToken) {
      throw new Error('Student QR fetch failed: ' + JSON.stringify(studentQr));
    }
    console.log('✓ Student successfully retrieved QR code image & token');

    // 11. Authority scans valid QR code
    console.log('Test 11: Authority scans QR code at return verification');
    const scanRes = await api('/api/qr/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: qrToken })
    });
    if (scanRes.status !== 200 || !scanRes.data.valid || scanRes.data.status !== 'VALID_LEAVE') {
      throw new Error('QR scan failed for valid leave: ' + JSON.stringify(scanRes));
    }
    console.log('✓ Scanner returned VALID BITM LEAVE for student:', scanRes.data.leave.studentName);

    // 12. Authority clicks [VERIFY LEAVE]
    console.log('Test 12: Authority finalizes verification');
    const verifyRes = await api('/api/qr/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ leaveId: createdLeaveId, tokenId: scanRes.data.leave.tokenId })
    });
    if (verifyRes.status !== 200 || verifyRes.data.verification.status !== 'VERIFIED') {
      throw new Error('Verification failed: ' + JSON.stringify(verifyRes));
    }
    console.log('✓ Leave status updated to VERIFIED in database');

    // 13. Duplicate scan prevention check
    console.log('Test 13: Duplicate QR scan prevention');
    const duplicateScan = await api('/api/qr/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: qrToken })
    });
    if (!duplicateScan.data.alreadyVerified || duplicateScan.data.status !== 'ALREADY_VERIFIED') {
      throw new Error('Expected ALREADY_VERIFIED duplicate status, got: ' + JSON.stringify(duplicateScan));
    }
    console.log('✓ Duplicate scan blocked with message:', duplicateScan.data.message);

    // 14. Invalid QR token test
    console.log('Test 14: Invalid QR scan');
    const invalidScan = await api('/api/qr/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ token: 'BITM-INVALID-RANDOM-TOKEN-999' })
    });
    if (invalidScan.data.valid !== false || invalidScan.data.status !== 'INVALID_LEAVE') {
      throw new Error('Expected INVALID_LEAVE status, got: ' + JSON.stringify(invalidScan));
    }
    console.log('✓ Invalid QR token properly recognized as INVALID LEAVE');

    // 15. Student notifications received
    console.log('Test 15: Student received notifications for submission, approval, and verification');
    const notifs = await api('/api/notifications', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (notifs.status !== 200 || notifs.data.notifications.length < 3) {
      throw new Error('Student missing notifications: ' + JSON.stringify(notifs));
    }
    console.log(`✓ Student has ${notifs.data.notifications.length} notifications logged`);

    // Clean up dummy test file
    if (fs.existsSync(dummyCertPath)) fs.unlinkSync(dummyCertPath);

    console.log('=======================================================');
    console.log('ALL BACKEND API TESTS PASSED SUCCESSFULLY! (15/15)');
    console.log('=======================================================');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
}

runTests();
