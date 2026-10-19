const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const db = require('../db/database');
const { requireAuth, requireStudent, requireAuthority } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { logAudit } = require('../utils/audit');
const { createNotification, notifyAllAuthorities } = require('../utils/notify');

// Helper to calculate days between dates (inclusive)
function calculateDays(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

// Calculate grace date (end_date + 1 day) and deadline (end of grace date)
function calculateVerificationDeadline(endDateStr) {
  const end = new Date(endDateStr);
  if (isNaN(end.getTime())) return { graceDate: endDateStr, deadline: endDateStr };

  // Add 1 calendar day for verification grace period
  const grace = new Date(end);
  grace.setDate(grace.getDate() + 1);

  const year = grace.getFullYear();
  const month = String(grace.getMonth() + 1).padStart(2, '0');
  const day = String(grace.getDate()).padStart(2, '0');
  const graceDate = `${year}-${month}-${day}`;
  // Deadline at 23:59:59 of grace date (IST)
  const deadline = `${graceDate}T23:59:59+05:30`;

  return { graceDate, deadline };
}

// Generate 12-digit numeric token
function generate12DigitToken() {
  const min = 100000000000;
  const max = 999999999999;
  return crypto.randomInt(min, max + 1).toString();
}

// Generate next Leave Application Number
function generateLeaveNumber(orgShortName = 'BITM') {
  const year = new Date().getFullYear();
  const countRow = db.prepare(`SELECT COUNT(*) as count FROM leave_applications`).get();
  const nextNum = (countRow ? countRow.count : 0) + 1;
  const padded = String(nextNum).padStart(5, '0');
  return `${orgShortName}-LEAVE-${year}-${padded}`;
}

// 1. Student applies for leave
router.post('/apply', requireAuth, requireStudent, (req, res) => {
  upload.single('supportingDocument')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message });
    }

    try {
      const { leaveType, reason, startDate, endDate, additionalRemarks } = req.body;

      if (!leaveType || !reason || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'All fields (Leave Type, Reason, Start Date, End Date) are required.'
        });
      }

      // Mandatory supporting document
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Supporting document is required. Please upload a medical certificate, prescription, invitation, or relevant proof.'
        });
      }

      // Validate date order
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid start or end date provided.' });
      }
      if (end < start) {
        return res.status(400).json({ success: false, message: 'End date cannot be prior to start date.' });
      }

      const numberOfDays = calculateDays(startDate, endDate);
      const { graceDate, deadline } = calculateVerificationDeadline(endDate);

      // Student info
      const student = db.prepare(`
        SELECT s.*, p.full_name, o.short_name as org_short_name
        FROM students s
        JOIN profiles p ON s.profile_id = p.id
        JOIN organizations o ON s.organization_id = o.id
        WHERE s.id = ?
      `).get(req.user.studentId);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }

      const leaveId = 'leave-' + uuidv4();
      const leaveAppNumber = generateLeaveNumber(student.org_short_name || 'BITM');

      // Insert leave application
      db.prepare(`
        INSERT INTO leave_applications (
          id, leave_application_number, student_id, organization_id, department_id,
          leave_type, reason, start_date, end_date, number_of_days, additional_remarks,
          status, grace_date, verification_deadline, student_hidden
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 0)
      `).run(
        leaveId,
        leaveAppNumber,
        student.id,
        student.organization_id,
        student.department_id || null,
        leaveType,
        reason.trim(),
        startDate,
        endDate,
        numberOfDays,
        additionalRemarks ? additionalRemarks.trim() : null,
        graceDate,
        deadline
      );

      // Insert document record
      const docId = 'doc-' + uuidv4();
      db.prepare(`
        INSERT INTO leave_documents (id, leave_id, student_id, original_name, file_path, file_type, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        docId,
        leaveId,
        student.id,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size
      );

      // Student notification
      createNotification({
        userId: student.profile_id,
        title: 'Leave Application Submitted',
        message: `Your leave application ${leaveAppNumber} (${numberOfDays} days) has been submitted for authority review. Verification deadline if approved will be ${graceDate}.`,
        type: 'LEAVE_STATUS'
      });

      // Authority notifications
      notifyAllAuthorities({
        title: 'New Leave Application',
        message: `New leave application ${leaveAppNumber} received from ${student.full_name} (${student.usn}).`,
        type: 'NEW_LEAVE_PENDING'
      });

      // Audit Log
      logAudit({
        userId: student.profile_id,
        action: 'LEAVE_APPLICATION_SUBMITTED',
        entityType: 'leave_application',
        entityId: leaveId,
        details: {
          leaveNumber: leaveAppNumber,
          leaveType,
          numberOfDays,
          document: req.file.originalname
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully.',
        leaveId,
        leaveApplicationNumber: leaveAppNumber,
        graceDate,
        verificationDeadline: deadline
      });
    } catch (err) {
      console.error('Submit leave error:', err);
      return res.status(500).json({ success: false, message: 'Server error while processing leave application.' });
    }
  });
});

// 2. Student gets their leave history & metrics
router.get('/student', requireAuth, requireStudent, (req, res) => {
  try {
    const studentId = req.user.studentId;
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    // Run background deadline check
    if (db.checkAndExpireLeaves) db.checkAndExpireLeaves();

    const leaves = db.prepare(`
      SELECT 
        l.*,
        d.original_name as document_name,
        d.file_path as document_file,
        d.file_type as document_type,
        v.verification_status,
        v.verified_at,
        v.verified_by_name,
        qrt.token as qr_token,
        qrt.revoked as token_revoked
      FROM leave_applications l
      LEFT JOIN leave_documents d ON l.id = d.leave_id
      LEFT JOIN leave_verifications v ON l.id = v.leave_id
      LEFT JOIN qr_verification_tokens qrt ON l.id = qrt.leave_id
      WHERE l.student_id = ? AND l.student_hidden = 0 AND l.status != 'VERIFIED'
      ORDER BY l.created_at DESC
    `).all(studentId);

    // Verified leaves count from database
    const verifiedTotal = db.prepare(`
      SELECT COUNT(*) as count FROM leave_applications WHERE student_id = ? AND status = 'VERIFIED'
    `).get(studentId)?.count || 0;

    // Compute metrics & check 3-day pending alert
    let pendingOverdueCount = 0;
    const mappedLeaves = leaves.map((l) => {
      const createdTime = new Date(l.created_at).getTime();
      const isPendingOverdue = l.status === 'PENDING' && (now - createdTime >= THREE_DAYS_MS);
      const pendingDays = isPendingOverdue ? Math.floor((now - createdTime) / (24 * 60 * 60 * 1000)) : 0;
      if (isPendingOverdue) pendingOverdueCount++;

      return {
        ...l,
        isPendingOverdue,
        pendingDays
      };
    });

    const stats = {
      total: mappedLeaves.length,
      pending: mappedLeaves.filter(l => l.status === 'PENDING').length,
      approved: mappedLeaves.filter(l => l.status === 'APPROVED').length,
      rejected: mappedLeaves.filter(l => l.status === 'REJECTED').length,
      verified: verifiedTotal,
      pendingOverdueCount
    };

    return res.json({
      success: true,
      stats,
      leaves: mappedLeaves
    });
  } catch (err) {
    console.error('Fetch student leaves error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student leave records.' });
  }
});

// 3. Authority gets leaves (Pending Only, or filtered)
router.get('/authority', requireAuth, requireAuthority, (req, res) => {
  try {
    const { status, department, search } = req.query;
    const orgId = req.user.orgId;

    // Run background deadline check
    if (db.checkAndExpireLeaves) db.checkAndExpireLeaves();

    let query = `
      SELECT 
        l.*,
        s.usn,
        s.semester,
        s.standard,
        s.section,
        p_stud.full_name as student_name,
        p_stud.email as student_email,
        p_stud.mobile_number as student_mobile,
        p_stud.profile_photo as student_photo,
        dept.code as department_code,
        dept.name as department_name,
        d.id as document_id,
        d.original_name as document_name,
        d.file_path as document_file,
        d.file_type as document_type,
        v.verification_status,
        v.verified_at,
        v.verified_by_name,
        qrt.token as qr_token,
        qrt.revoked as token_revoked
      FROM leave_applications l
      JOIN students s ON l.student_id = s.id
      JOIN profiles p_stud ON s.profile_id = p_stud.id
      LEFT JOIN departments dept ON l.department_id = dept.id
      LEFT JOIN leave_documents d ON l.id = d.leave_id
      LEFT JOIN leave_verifications v ON l.id = v.leave_id
      LEFT JOIN qr_verification_tokens qrt ON l.id = qrt.leave_id
      WHERE 1=1
    `;

    const params = [];

    // Isolate by organization
    if (orgId) {
      query += ` AND l.organization_id = ?`;
      params.push(orgId);
    }

    // IMPORTANT: If Pending leaves requested, show ONLY PENDING leaves
    if (status && status !== 'ALL') {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (department && department !== 'ALL') {
      query += ` AND (dept.code = ? OR s.standard = ?)`;
      params.push(department, department);
    }

    if (search) {
      query += ` AND (
        UPPER(s.usn) LIKE ? OR
        UPPER(p_stud.full_name) LIKE ? OR
        UPPER(l.leave_application_number) LIKE ? OR
        UPPER(l.leave_type) LIKE ?
      )`;
      const term = `%${search.trim().toUpperCase()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY l.created_at DESC`;

    const leaves = db.prepare(query).all(...params);

    // Compute stats for current organization
    const orgFilter = orgId ? ` WHERE organization_id = '${orgId}'` : '';
    const totalStudents = db.prepare(`SELECT COUNT(*) as count FROM students ${orgFilter}`).get()?.count || 0;
    const allLeavesCount = db.prepare(`SELECT COUNT(*) as count FROM leave_applications ${orgFilter}`).get()?.count || 0;
    const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM leave_applications ${orgFilter ? orgFilter + ' AND' : 'WHERE'} status = 'PENDING'`).get()?.count || 0;
    const approvedCount = db.prepare(`SELECT COUNT(*) as count FROM leave_applications ${orgFilter ? orgFilter + ' AND' : 'WHERE'} status = 'APPROVED'`).get()?.count || 0;
    const rejectedCount = db.prepare(`SELECT COUNT(*) as count FROM leave_applications ${orgFilter ? orgFilter + ' AND' : 'WHERE'} status = 'REJECTED'`).get()?.count || 0;
    const verifiedCount = db.prepare(`SELECT COUNT(*) as count FROM leave_applications ${orgFilter ? orgFilter + ' AND' : 'WHERE'} status = 'VERIFIED'`).get()?.count || 0;

    const stats = {
      totalStudents,
      totalLeaves: allLeavesCount,
      pendingLeaves: pendingCount,
      approvedLeaves: approvedCount,
      rejectedLeaves: rejectedCount,
      activeLeaves: approvedCount,
      completedLeaves: verifiedCount,
      verificationPending: approvedCount,
      verifiedLeaves: verifiedCount
    };

    return res.json({
      success: true,
      stats,
      leaves
    });
  } catch (err) {
    console.error('Fetch authority leaves error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve authority leave records.' });
  }
});

// 4. Single leave details (letter view)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const leaveId = req.params.id;

    const leave = db.prepare(`
      SELECT 
        l.*,
        s.usn,
        s.semester,
        s.standard,
        s.section,
        s.dob,
        s.college,
        p_stud.full_name as student_name,
        p_stud.email as student_email,
        p_stud.mobile_number as student_mobile,
        p_stud.profile_photo as student_photo,
        dept.code as department_code,
        dept.name as department_name,
        o.name as org_name,
        o.short_name as org_short_name,
        o.organization_type,
        o.app_name,
        o.logo_url as org_logo,
        d.id as document_id,
        d.original_name as document_name,
        d.file_path as document_file,
        d.file_type as document_type,
        d.file_size as document_size,
        v.verification_status,
        v.verified_at,
        v.verified_by_name,
        qrt.token as qr_token,
        qrt.revoked as token_revoked
      FROM leave_applications l
      JOIN students s ON l.student_id = s.id
      JOIN profiles p_stud ON s.profile_id = p_stud.id
      JOIN organizations o ON l.organization_id = o.id
      LEFT JOIN departments dept ON l.department_id = dept.id
      LEFT JOIN leave_documents d ON l.id = d.leave_id
      LEFT JOIN leave_verifications v ON l.id = v.leave_id
      LEFT JOIN qr_verification_tokens qrt ON l.id = qrt.leave_id
      WHERE l.id = ? OR l.leave_application_number = ?
    `).get(leaveId, leaveId);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    // Role check: student can only view their own
    if (req.user.userType === 'student' && leave.student_id !== req.user.studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only view your own leave record.' });
    }

    return res.json({ success: true, leave });
  } catch (err) {
    console.error('Fetch single leave error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load leave details.' });
  }
});

// 5. Authority Approves Leave (Requires Approver Name)
router.post('/:id/approve', requireAuth, requireAuthority, async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { approverName, approverDesignation, comments } = req.body;

    if (!approverName || !approverName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Approving Proctor / Teacher Name is required before final approval.'
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
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    if (leave.status === 'APPROVED' || leave.status === 'VERIFIED') {
      return res.status(400).json({ success: false, message: `Leave is already ${leave.status}.` });
    }

    const approvalDate = new Date().toISOString();

    // Update status to APPROVED
    db.prepare(`
      UPDATE leave_applications
      SET status = 'APPROVED',
          assigned_authority_id = ?,
          approver_name = ?,
          approver_designation = ?,
          approval_date = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      req.user.authorityId,
      approverName.trim(),
      approverDesignation ? approverDesignation.trim() : 'Proctor / Teacher',
      approvalDate,
      leaveId
    );

    // Record approval log
    const approvalId = 'appr-' + uuidv4();
    db.prepare(`
      INSERT INTO leave_approvals (id, leave_id, authority_id, authority_role, approver_name, action, comments, action_at)
      VALUES (?, ?, ?, ?, ?, 'APPROVED', ?, datetime('now'))
    `).run(
      approvalId,
      leaveId,
      req.user.authorityId,
      req.user.role,
      approverName.trim(),
      comments ? comments.trim() : `Approved by ${approverName.trim()}`
    );

    // Generate EXACT 12-digit numeric token
    const numericToken = generate12DigitToken();
    const tokenId = 'qrt-' + uuidv4();

    // Check if token already exists
    const existingToken = db.prepare('SELECT id, token FROM qr_verification_tokens WHERE leave_id = ?').get(leaveId);
    let finalToken = numericToken;

    if (existingToken) {
      finalToken = existingToken.token;
      db.prepare('UPDATE qr_verification_tokens SET revoked = 0 WHERE id = ?').run(existingToken.id);
    } else {
      const expiresAt = leave.verification_deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`
        INSERT INTO qr_verification_tokens (id, leave_id, token, expires_at, revoked)
        VALUES (?, ?, ?, ?, 0)
      `).run(tokenId, leaveId, finalToken, expiresAt);
    }

    // Generate high-resolution QR Code Data URL
    const qrDataUrl = await QRCode.toDataURL(finalToken, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 350,
      color: {
        dark: '#07162c',
        light: '#ffffff'
      }
    });

    // Notify student
    createNotification({
      userId: leave.student_profile_id,
      title: 'Leave Approved!',
      message: `Your leave application ${leave.leave_application_number} has been approved by ${approverName.trim()}. Your 12-digit verification token is ${finalToken}.`,
      type: 'LEAVE_APPROVED'
    });

    // Audit Log
    logAudit({
      userId: req.user.userId,
      action: 'LEAVE_APPROVED',
      entityType: 'leave_application',
      entityId: leaveId,
      details: {
        approver: approverName.trim(),
        leaveNumber: leave.leave_application_number,
        studentUsn: leave.usn,
        token: finalToken
      }
    });

    return res.json({
      success: true,
      message: 'Leave application approved successfully. QR verification token generated.',
      token: finalToken,
      qrDataUrl,
      approverName: approverName.trim()
    });
  } catch (err) {
    console.error('Approve leave error:', err);
    return res.status(500).json({ success: false, message: 'Server error while approving leave.' });
  }
});

// 6. Authority Rejects Leave (Requires Rejecting Name + Mandatory Reason)
router.post('/:id/reject', requireAuth, requireAuthority, (req, res) => {
  try {
    const leaveId = req.params.id;
    const { rejectionReason, rejectingName } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory. You must provide a valid justification for rejection.'
      });
    }

    const leave = db.prepare(`
      SELECT l.*, s.profile_id as student_profile_id, s.usn
      FROM leave_applications l
      JOIN students s ON l.student_id = s.id
      WHERE l.id = ?
    `).get(leaveId);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    const reviewerName = rejectingName ? rejectingName.trim() : req.user.name;

    // Update status to REJECTED
    db.prepare(`
      UPDATE leave_applications
      SET status = 'REJECTED',
          assigned_authority_id = ?,
          rejected_by_name = ?,
          rejection_reason = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(req.user.authorityId, reviewerName, rejectionReason.trim(), leaveId);

    // Record rejection in approvals table
    const approvalId = 'appr-' + uuidv4();
    db.prepare(`
      INSERT INTO leave_approvals (id, leave_id, authority_id, authority_role, approver_name, action, comments, action_at)
      VALUES (?, ?, ?, ?, ?, 'REJECTED', ?, datetime('now'))
    `).run(approvalId, leaveId, req.user.authorityId, req.user.role, reviewerName, rejectionReason.trim());

    // Invalidate QR token if one existed
    db.prepare('UPDATE qr_verification_tokens SET revoked = 1 WHERE leave_id = ?').run(leaveId);

    // Notify student
    createNotification({
      userId: leave.student_profile_id,
      title: 'Leave Application Rejected',
      message: `Your leave application ${leave.leave_application_number} was rejected by ${reviewerName}. Reason: ${rejectionReason.trim()}`,
      type: 'LEAVE_REJECTED'
    });

    // Audit Log
    logAudit({
      userId: req.user.userId,
      action: 'LEAVE_REJECTED',
      entityType: 'leave_application',
      entityId: leaveId,
      details: {
        rejectedBy: reviewerName,
        leaveNumber: leave.leave_application_number,
        studentUsn: leave.usn,
        rejectionReason: rejectionReason.trim()
      }
    });

    return res.json({
      success: true,
      message: 'Leave application rejected.',
      leaveId
    });
  } catch (err) {
    console.error('Reject leave error:', err);
    return res.status(500).json({ success: false, message: 'Server error while rejecting leave.' });
  }
});

// 7. Authority Marks Leave as Invalid / False Leave (with Attendance Penalty)
router.post('/:id/mark-invalid', requireAuth, requireAuthority, (req, res) => {
  try {
    const leaveId = req.params.id;
    const { authorityName, reason, attendancePenaltyDays } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason for marking leave as invalid/false is mandatory.'
      });
    }

    const penaltyDays = parseInt(attendancePenaltyDays, 10);
    if (isNaN(penaltyDays) || penaltyDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please select or enter the number of upcoming attendance days affected (at least 1 day).'
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
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    const authName = authorityName ? authorityName.trim() : req.user.name;

    // Update leave application record
    db.prepare(`
      UPDATE leave_applications
      SET status = 'REJECTED',
          assigned_authority_id = ?,
          rejected_by_name = ?,
          rejection_reason = ?,
          is_invalid = 1,
          attendance_penalty_days = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      req.user.authorityId,
      authName,
      `Rejected – Invalid Leave: ${reason.trim()}`,
      penaltyDays,
      leaveId
    );

    // Invalidate QR Token
    db.prepare('UPDATE qr_verification_tokens SET revoked = 1 WHERE leave_id = ?').run(leaveId);

    // Record Disciplinary Audit Log
    logAudit({
      userId: req.user.userId,
      action: 'LEAVE_MARKED_INVALID_ATTENDANCE_PENALTY',
      entityType: 'leave_application',
      entityId: leaveId,
      details: {
        studentId: leave.student_id,
        studentName: leave.student_name,
        studentUsn: leave.usn,
        authorityName: authName,
        reason: reason.trim(),
        attendancePenaltyDays: penaltyDays,
        decisionDate: new Date().toISOString()
      }
    });

    // Notify Student
    createNotification({
      userId: leave.student_profile_id,
      title: 'Leave Rejected – Invalid Application',
      message: `Your leave application ${leave.leave_application_number} was reviewed and rejected as invalid by ${authName}. An attendance restriction has been applied for the next ${penaltyDays} applicable attendance day(s). Reason: ${reason.trim()}`,
      type: 'LEAVE_REJECTED'
    });

    return res.json({
      success: true,
      message: `Leave successfully marked as invalid. Attendance restriction for ${penaltyDays} day(s) recorded.`,
      leaveId,
      attendancePenaltyDays: penaltyDays
    });
  } catch (err) {
    console.error('Mark invalid leave error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing disciplinary action.' });
  }
});

// 8. Document Retrieval (In-App Document Viewer)
router.get('/documents/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.resolve(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found.' });
    }

    // Set appropriate headers for inline viewing in browser iframe/img
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    }

    return res.sendFile(filePath);
  } catch (err) {
    console.error('Document download error:', err);
    return res.status(500).json({ success: false, message: 'Failed to access document.' });
  }
});

module.exports = router;
