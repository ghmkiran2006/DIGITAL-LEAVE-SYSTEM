const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAuth, requireAuthority } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// All routes require authority authentication
router.use(requireAuth, requireAuthority);

// Helper to normalize DOB
function normalizeDob(dobStr) {
  if (!dobStr) return { iso: '', formatted: '' };
  const d = new Date(dobStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return {
      iso: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${day}`,
      formatted: `${day}${month}${year}`
    };
  }
  return { iso: dobStr.trim(), formatted: dobStr.trim() };
}

// 1. List students (hierarchically organized by Department/Standard -> Semester/Section)
router.get('/', (req, res) => {
  try {
    const { search, department, semester, standard, section, status } = req.query;
    const orgId = req.user.orgId;

    let query = `
      SELECT 
        s.id, s.usn, s.dob, s.semester, s.standard, s.section, s.college, s.status, s.parent_contact, s.created_at,
        p.id as profile_id, p.full_name, p.email, p.mobile_number, p.profile_photo,
        d.id as department_id, d.code as department_code, d.name as department_name,
        o.id as organization_id, o.name as organization_name, o.organization_type
      FROM students s
      JOIN profiles p ON s.profile_id = p.id
      JOIN organizations o ON s.organization_id = o.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Isolation: only show students of this authority's organization
    if (orgId) {
      query += ` AND s.organization_id = ?`;
      params.push(orgId);
    }

    if (search) {
      query += ` AND (
        UPPER(s.usn) LIKE ? OR
        UPPER(p.full_name) LIKE ? OR
        UPPER(COALESCE(p.email, '')) LIKE ?
      )`;
      const term = `%${search.trim().toUpperCase()}%`;
      params.push(term, term, term);
    }

    if (department && department !== 'ALL') {
      query += ` AND (d.id = ? OR d.code = ?)`;
      params.push(department, department);
    }

    if (semester && semester !== 'ALL') {
      query += ` AND s.semester = ?`;
      params.push(parseInt(semester, 10));
    }

    if (standard && standard !== 'ALL') {
      query += ` AND s.standard = ?`;
      params.push(standard);
    }

    if (section && section !== 'ALL') {
      query += ` AND s.section = ?`;
      params.push(section);
    }

    if (status && status !== 'ALL') {
      query += ` AND s.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY s.created_at DESC`;

    const students = db.prepare(query).all(...params);

    const orgFilter = orgId ? `WHERE organization_id = '${orgId}'` : '';
    const totalStudents = db.prepare(`SELECT COUNT(*) as c FROM students ${orgFilter}`).get()?.c || 0;
    const activeStudents = db.prepare(`SELECT COUNT(*) as c FROM students ${orgFilter ? orgFilter + ' AND' : 'WHERE'} status = 'ACTIVE'`).get()?.c || 0;
    const inactiveStudents = db.prepare(`SELECT COUNT(*) as c FROM students ${orgFilter ? orgFilter + ' AND' : 'WHERE'} status = 'INACTIVE'`).get()?.c || 0;

    return res.json({
      success: true,
      stats: { totalStudents, activeStudents, inactiveStudents },
      students
    });
  } catch (err) {
    console.error('List students error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student list.' });
  }
});

// 2. Create a new student account (Authority Only)
router.post('/', (req, res) => {
  try {
    const {
      fullName,
      usn,
      dob,
      email,
      mobileNumber,
      departmentId,
      semester,
      standard,
      section,
      parentContact,
      profilePhoto
    } = req.body;

    const orgId = req.user.orgId || 'org-bitm';
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    const orgType = org?.organization_type || 'College';

    if (!fullName || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Student Name and Date of Birth are mandatory.'
      });
    }

    // Generate or use USN/Student ID
    let finalUSN = usn ? usn.trim().toUpperCase() : '';
    if (!finalUSN) {
      if (orgType === 'School') {
        const count = db.prepare('SELECT COUNT(*) as c FROM students WHERE organization_id = ?').get(orgId)?.c || 0;
        finalUSN = `${org?.short_name || 'SCH'}-STD-${String(count + 1).padStart(4, '0')}`;
      } else {
        return res.status(400).json({
          success: false,
          message: 'USN / Student ID is mandatory for College / University students.'
        });
      }
    }

    // Check uniqueness
    const existing = db.prepare('SELECT id FROM students WHERE UPPER(usn) = ?').get(finalUSN);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A student with ID/USN "${finalUSN}" already exists.`
      });
    }

    // Password format: Day + Full Month Name + Year (e.g. 15March2006)
    const norm = normalizeDob(dob);
    const passHash = bcrypt.hashSync(norm.formatted, 10);

    const profileId = 'prof-' + uuidv4();
    const studentId = 'stud-' + uuidv4();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    if (cleanEmail) {
      const emailCheck = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ?').get(cleanEmail);
      if (emailCheck) {
        return res.status(409).json({
          success: false,
          message: `Email "${cleanEmail}" is already registered.`
        });
      }
    }

    // Create profile
    db.prepare(`
      INSERT INTO profiles (id, user_type, full_name, email, mobile_number, profile_photo)
      VALUES (?, 'student', ?, ?, ?, ?)
    `).run(
      profileId,
      fullName.trim(),
      cleanEmail,
      mobileNumber ? mobileNumber.trim() : null,
      profilePhoto || ''
    );

    // Create student record
    db.prepare(`
      INSERT INTO students (
        id, profile_id, usn, dob, organization_id, department_id, standard, section, semester, college,
        password_hash, status, must_change_password, parent_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, ?)
    `).run(
      studentId,
      profileId,
      finalUSN,
      dob.trim(),
      orgId,
      departmentId || null,
      standard || null,
      section ? section.trim().toUpperCase() : null,
      semester ? parseInt(semester, 10) : 1,
      org?.name || 'Ballari Institute of Technology and Management',
      passHash,
      parentContact ? parentContact.trim() : null
    );

    logAudit({
      userId: req.user.userId,
      action: 'STUDENT_ACCOUNT_CREATED',
      entityType: 'student',
      entityId: studentId,
      details: {
        usn: finalUSN,
        fullName: fullName.trim(),
        dob: dob.trim(),
        standard,
        departmentId,
        createdBy: req.user.name
      }
    });

    return res.status(201).json({
      success: true,
      message: `Student account created successfully for ${fullName.trim()} (${finalUSN}).`,
      student: {
        id: studentId,
        usn: finalUSN,
        fullName: fullName.trim(),
        dob: dob.trim(),
        standard,
        section,
        departmentId,
        semester
      }
    });
  } catch (err) {
    console.error('Create student error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create student account.' });
  }
});

// 3. Edit Student Details (Authority Only)
router.put('/:id', (req, res) => {
  try {
    const studentId = req.params.id;
    const {
      fullName,
      usn,
      email,
      mobileNumber,
      dob,
      departmentId,
      semester,
      standard,
      section,
      parentContact,
      profilePhoto,
      status
    } = req.body;

    const student = db.prepare(`
      SELECT s.*, p.id as pid FROM students s JOIN profiles p ON s.profile_id = p.id WHERE s.id = ?
    `).get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Update Profile
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    if (cleanEmail) {
      const emailCheck = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ? AND id != ?').get(cleanEmail, student.pid);
      if (emailCheck) {
        return res.status(409).json({ success: false, message: 'Email already registered to another user.' });
      }
    }

    if (fullName) db.prepare('UPDATE profiles SET full_name = ? WHERE id = ?').run(fullName.trim(), student.pid);
    if (cleanEmail !== undefined) db.prepare('UPDATE profiles SET email = ? WHERE id = ?').run(cleanEmail, student.pid);
    if (mobileNumber !== undefined) db.prepare('UPDATE profiles SET mobile_number = ? WHERE id = ?').run(mobileNumber ? mobileNumber.trim() : null, student.pid);
    if (profilePhoto !== undefined) db.prepare('UPDATE profiles SET profile_photo = ? WHERE id = ?').run(profilePhoto, student.pid);

    // Update Student
    if (usn) {
      const cleanUSN = usn.trim().toUpperCase();
      const usnCheck = db.prepare('SELECT id FROM students WHERE UPPER(usn) = ? AND id != ?').get(cleanUSN, studentId);
      if (usnCheck) {
        return res.status(409).json({ success: false, message: `USN/ID "${cleanUSN}" is already in use.` });
      }
      db.prepare('UPDATE students SET usn = ? WHERE id = ?').run(cleanUSN, studentId);
    }

    if (dob) {
      const norm = normalizeDob(dob);
      const passHash = bcrypt.hashSync(norm.formatted, 10);
      db.prepare('UPDATE students SET dob = ?, password_hash = ? WHERE id = ?').run(dob.trim(), passHash, studentId);
    }

    if (departmentId !== undefined) db.prepare('UPDATE students SET department_id = ? WHERE id = ?').run(departmentId || null, studentId);
    if (semester !== undefined) db.prepare('UPDATE students SET semester = ? WHERE id = ?').run(parseInt(semester, 10) || 1, studentId);
    if (standard !== undefined) db.prepare('UPDATE students SET standard = ? WHERE id = ?').run(standard || null, studentId);
    if (section !== undefined) db.prepare('UPDATE students SET section = ? WHERE id = ?').run(section ? section.trim().toUpperCase() : null, studentId);
    if (parentContact !== undefined) db.prepare('UPDATE students SET parent_contact = ? WHERE id = ?').run(parentContact ? parentContact.trim() : null, studentId);
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) db.prepare('UPDATE students SET status = ? WHERE id = ?').run(status, studentId);

    logAudit({
      userId: req.user.userId,
      action: 'STUDENT_DETAILS_UPDATED',
      entityType: 'student',
      entityId: studentId,
      details: { updatedBy: req.user.name, studentUsn: student.usn }
    });

    return res.json({ success: true, message: 'Student details updated successfully.' });
  } catch (err) {
    console.error('Update student error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update student details.' });
  }
});

// 4. Update student photo with cropped image
router.post('/:id/photo', (req, res) => {
  try {
    const studentId = req.params.id;
    const { photoDataUrl } = req.body;

    if (!photoDataUrl) {
      return res.status(400).json({ success: false, message: 'No photo data provided.' });
    }

    const student = db.prepare('SELECT profile_id FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    db.prepare('UPDATE profiles SET profile_photo = ? WHERE id = ?').run(photoDataUrl, student.profile_id);

    return res.json({ success: true, message: 'Student profile photo updated successfully.' });
  } catch (err) {
    console.error('Update student photo error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update student photo.' });
  }
});

// 5. Delete student account
router.delete('/:id', (req, res) => {
  try {
    const studentId = req.params.id;
    const student = db.prepare('SELECT profile_id, usn FROM students WHERE id = ?').get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    db.prepare('DELETE FROM students WHERE id = ?').run(studentId);
    db.prepare('DELETE FROM profiles WHERE id = ?').run(student.profile_id);

    logAudit({
      userId: req.user.userId,
      action: 'STUDENT_DELETED',
      entityType: 'student',
      entityId: studentId,
      details: { usn: student.usn, deletedBy: req.user.name }
    });

    return res.json({ success: true, message: 'Student account deleted successfully.' });
  } catch (err) {
    console.error('Delete student error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete student.' });
  }
});

module.exports = router;
