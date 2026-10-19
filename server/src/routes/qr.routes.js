const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAuth, requireAuthority } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const { createNotification } = require('../utils/notify');

// 1. Get QR Code and 12-digit token for an approved leave
router.get('/code/:leaveId', requireAuth, async (req, res) => {
  try {
    const leaveId = req.params.leaveId;

    const leave = db.prepare(`
      SELECT l.*, s.profile_id as student_profile_id, qrt.token as qr_token, qrt.revoked, qrt.expires_at
      FROM leave_applications l
      JOIN students s ON l.student_id = s.id
      LEFT JOIN qr_verification_tokens qrt ON l.id = qrt.leave_id
      WHERE l.id = ? OR l.leave_application_number = ?
    `).get(leaveId, leaveId);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found.' });
    }

    if (req.user.userType === 'student' && leave.student_profile_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (leave.status !== 'APPROVED' && leave.status !== 'VERIFIED') {
      return res.status(400).json({ success: false, message: 'QR code is only available for Approved or Verified leaves.' });
    }

    if (!leave.qr_token) {
      return res.status(404).json({ success: false, message: 'Verification token not yet generated for this leave.' });
    }

    if (leave.revoked) {
      return res.status(400).json({ success: false, message: 'This QR code and token has expired / been invalidated.' });
    }

    // QR contains the 12-digit token
    const qrDataUrl = await QRCode.toDataURL(leave.qr_token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 350,
      color: {
        dark: '#07162c',
        light: '#ffffff'
      }
    });

    return res.json({
      success: true,
      token: leave.qr_token,
      expiresAt: leave.verification_deadline || leave.expires_at,
      graceDate: leave.grace_date,
      qrDataUrl
    });
  } catch (err) {
    console.error('Fetch QR code error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate QR code.' });
  }
});

// 2. Scan / Validate QR Token (Authority Scanner or Manual 12-digit token entry)
router.post('/scan', requireAuth, requireAuthority, (req, res) => {
  try {
    const { token } = req.body;

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        valid: false,
        status: 'INVALID_LEAVE',
        message: 'No QR verification token received.'
      });
    }

    const cleanToken = token.trim();

    // Look up token in database
    const tokenRecord = db.prepare(`
      SELECT 
        qrt.*,
        l.id as leave_id,
        l.leave_application_number,
        l.leave_type,
        l.reason,
        l.start_date,
        l.end_date,
        l.number_of_days,
        l.additional_remarks,
        l.status as leave_status,
        l.organization_id,
        l.grace_date,
        l.verification_deadline,
        l.approver_name,
        l.approver_designation,
        l.approval_date,
        s.usn,
        s.semester,
        s.standard,
        s.section,
        s.college,
        p_stud.full_name as student_name,
        p_stud.email as student_email,
        p_stud.mobile_number as student_mobile,
        p_stud.profile_photo as student_photo,
        dept.code as department_code,
        dept.name as department_name,
        org.name as org_name,
        org.short_name as org_short_name,
        org.organization_type
      FROM qr_verification_tokens qrt
      JOIN leave_applications l ON qrt.leave_id = l.id
      JOIN students s ON l.student_id = s.id
      JOIN profiles p_stud ON s.profile_id = p_stud.id
      JOIN organizations org ON l.organization_id = org.id
      LEFT JOIN departments dept ON l.department_id = dept.id
      WHERE qrt.token = ?
    `).get(cleanToken);

    if (!tokenRecord) {
      logAudit({
        userId: req.user.userId,
        action: 'QR_SCAN_FAILED',
        entityType: 'qr_verification_tokens',
        details: { token: cleanToken.substring(0, 8) + '...', reason: 'Token not found' }
      });

      return res.status(200).json({
        success: false,
        valid: false,
        status: 'INVALID_LEAVE',
        errorReason: 'Invalid QR token. No matching leave record exists in the system.',
        message: 'INVALID LEAVE'
      });
    }

    // Check if token was already used / revoked
    if (tokenRecord.revoked) {
      return res.status(200).json({
        success: false,
        valid: false,
        status: 'ALREADY_USED',
        errorReason: 'Verification Failed – This QR code/token has already been used.',
        message: 'Verification Failed – This QR code/token has already been used.'
      });
    }

    // Check if deadline has expired
    const now = new Date();
    if (tokenRecord.verification_deadline) {
      const deadline = new Date(tokenRecord.verification_deadline);
      if (now > deadline) {
        // Auto-reject leave due to deadline expiry
        db.prepare(`
          UPDATE leave_applications
          SET status = 'REJECTED',
              rejection_reason = 'Rejected – Verification Deadline Expired',
              updated_at = datetime('now')
          WHERE id = ?
        `).run(tokenRecord.leave_id);
        db.prepare('UPDATE qr_verification_tokens SET revoked = 1 WHERE id = ?').run(tokenRecord.id);

        return res.status(200).json({
          success: false,
          valid: false,
          status: 'EXPIRED',
          errorReason: 'Verification Failed – This leave verification period has expired.',
          message: 'Verification Failed – This leave verification period has expired.'
        });
      }
    }

    // Check if leave status is already VERIFIED
    if (tokenRecord.leave_status === 'VERIFIED') {
      return res.status(200).json({
        success: false,
        valid: false,
        alreadyVerified: true,
        status: 'ALREADY_VERIFIED',
        errorReason: 'Verification Failed – This QR code/token has already been used.',
        message: 'Verification Failed – This QR code/token has already been used.'
      });
    }

    // Check if leave was REJECTED
    if (tokenRecord.leave_status === 'REJECTED') {
      return res.status(200).json({
        success: false,
        valid: false,
        status: 'INVALID_LEAVE',
        errorReason: 'This leave application was rejected and cannot be verified.',
        message: 'INVALID LEAVE'
      });
    }

    // Check if duplicate verification in table
    const existingVerification = db.prepare('SELECT * FROM leave_verifications WHERE leave_id = ?').get(tokenRecord.leave_id);
    if (existingVerification) {
      return res.status(200).json({
        success: false,
        valid: false,
        alreadyVerified: true,
        status: 'ALREADY_VERIFIED',
        errorReason: 'Verification Failed – This QR code/token has already been used.',
        message: 'Verification Failed – This QR code/token has already been used.'
      });
    }

    // Valid leave ready for verification!
    return res.status(200).json({
      success: true,
      valid: true,
      status: 'VALID_LEAVE',
      message: 'VALID LEAVE',
      tokenRecordId: tokenRecord.id,
      leave: {
        id: tokenRecord.leave_id,
        tokenId: tokenRecord.id,
        token: tokenRecord.token,
        leaveNumber: tokenRecord.leave_application_number,
        studentName: tokenRecord.student_name,
        usn: tokenRecord.usn,
        standard: tokenRecord.standard,
        section: tokenRecord.section,
        email: tokenRecord.student_email,
        mobile: tokenRecord.student_mobile,
        department: tokenRecord.department_code || tokenRecord.standard,
        departmentName: tokenRecord.department_name || tokenRecord.standard,
        semester: tokenRecord.semester,
        college: tokenRecord.org_name,
        organizationType: tokenRecord.organization_type,
        leaveType: tokenRecord.leave_type,
        reason: tokenRecord.reason,
        startDate: tokenRecord.start_date,
        endDate: tokenRecord.end_date,
        numberOfDays: tokenRecord.number_of_days,
        graceDate: tokenRecord.grace_date,
        verificationDeadline: tokenRecord.verification_deadline,
        approvedBy: tokenRecord.approver_name || 'Authorized Officer',
        approverDesignation: tokenRecord.approver_designation || 'Proctor / Teacher',
        approvalDate: tokenRecord.approval_date,
        currentStatus: tokenRecord.leave_status
      }
    });
  } catch (err) {
    console.error('Scan QR error:', err);
    return res.status(500).json({ success: false, message: 'Server error during QR scan processing.' });
  }
});

// 3. Authority Performs Final Verification
// Prompt requirement:
// "before the leave is verifying by the scanning the qr code or the by typing manuvally the token number after cliking the verify button then show the enter the name of the proctor or the teacher name in the authority portal"
// "Immediately after successful QR verification: The leave must expire automatically. Remove that leave from the student's account. Remove that leave from the authority's leave approval/pending list. It must no longer appear anywhere as an active, pending, or available leave. Do not allow the same QR code/leave to be scanned and verified again. Show a clear success message after scanning, such as 'Leave Verified Successfully – Leave Expired.'"
router.post('/verify', requireAuth, requireAuthority, (req, res) => {
  try {
    const { leaveId, tokenId, verifiedByName, notes } = req.body;

    if (!leaveId) {
      return res.status(400).json({ success: false, message: 'Leave ID is required for verification.' });
    }

    if (!verifiedByName || !verifiedByName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Proctor / Teacher Name is required before confirming leave verification.'
      });
    }

    const leave = db.prepare(`
      SELECT l.*, s.profile_id as student_profile_id, s.usn, p.full_name as student_name
      FROM leave_applications l
      JOIN students s ON l.student_id = s.id
      JOIN profiles p ON s.profile_id = p.id
      WHERE l.id = ?
    `).get(leaveId);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found.' });
    }

    if (leave.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify leave with status "${leave.status}". Must be APPROVED.`
      });
    }

    // Check duplicate
    const existing = db.prepare('SELECT id FROM leave_verifications WHERE leave_id = ?').get(leaveId);
    if (existing) {
      return res.status(400).json({
        success: false,
        alreadyVerified: true,
        message: 'Verification Failed – This QR code/token has already been used.'
      });
    }

    // Verify token record
    let finalTokenId = tokenId;
    if (!finalTokenId) {
      const t = db.prepare('SELECT id FROM qr_verification_tokens WHERE leave_id = ?').get(leaveId);
      if (t) finalTokenId = t.id;
    }

    const verificationId = 'verif-' + uuidv4();
    const verifiedAt = new Date().toISOString();
    const verifierName = verifiedByName.trim();

    // 1. Insert verification audit record
    db.prepare(`
      INSERT INTO leave_verifications (
        id, leave_id, qr_token_id, verified_by, verified_by_name, organization_id, verification_status, verified_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', ?, ?)
    `).run(
      verificationId,
      leaveId,
      finalTokenId,
      req.user.authorityId,
      verifierName,
      leave.organization_id,
      verifiedAt,
      notes ? notes.trim() : `Verified upon return by ${verifierName}`
    );

    // 2. Mark leave as VERIFIED and student_hidden = 1 (auto-deleted from active & history as requested)
    db.prepare(`
      UPDATE leave_applications
      SET status = 'VERIFIED',
          verified_at = ?,
          verified_by_name = ?,
          student_hidden = 1,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(verifiedAt, verifierName, leaveId);

    // 3. Immediately invalidate/revoke token so it can never be scanned again
    if (finalTokenId) {
      db.prepare('UPDATE qr_verification_tokens SET revoked = 1 WHERE id = ?').run(finalTokenId);
    }

    // 4. Notify student
    createNotification({
      userId: leave.student_profile_id,
      title: 'Leave Verified – Leave Expired',
      message: `Your leave ${leave.leave_application_number} has been verified by ${verifierName}. The leave is now completed and has expired.`,
      type: 'LEAVE_VERIFIED'
    });

    // 5. Audit Log
    logAudit({
      userId: req.user.userId,
      action: 'LEAVE_VERIFIED',
      entityType: 'leave_verifications',
      entityId: verificationId,
      details: {
        leaveNumber: leave.leave_application_number,
        studentUsn: leave.usn,
        verifiedBy: verifierName,
        verifiedAt
      }
    });

    return res.json({
      success: true,
      message: 'Leave Verified Successfully – Leave Expired.',
      verification: {
        id: verificationId,
        leaveId,
        verifiedBy: verifierName,
        status: 'VERIFIED',
        verifiedAt
      }
    });
  } catch (err) {
    console.error('Final verification error:', err);
    return res.status(500).json({ success: false, message: 'Server error during leave verification.' });
  }
});

module.exports = router;
