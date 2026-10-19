const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { generateToken, requireAuth, requireAuthority } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// Helper to normalize DOB into comparison formats
function normalizeDob(dobStr) {
  if (!dobStr) return '';
  // Clean string
  const clean = dobStr.trim();
  // Try parsing date
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return {
      iso: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${day}`,
      formatted: `${day}${month}${year}`,
      spaced: `${day} ${month} ${year}`
    };
  }
  return { iso: clean, formatted: clean, spaced: clean };
}

// 1. Get all organizations for institution selection in login page
router.get('/organizations', (req, res) => {
  try {
    const orgs = db.prepare(`
      SELECT id, name, short_name, organization_type, app_name, logo_url, address, email, phone
      FROM organizations
      ORDER BY name
    `).all();
    return res.json({ success: true, organizations: orgs });
  } catch (err) {
    console.error('Fetch organizations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch institutions.' });
  }
});

// 2. Get single organization details
router.get('/organizations/:id', (req, res) => {
  try {
    const org = db.prepare(`
      SELECT * FROM organizations WHERE id = ?
    `).get(req.params.id);

    if (!org) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }
    return res.json({ success: true, organization: org });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch institution.' });
  }
});

// 3. Create a new organization (Authority creates School / College / University)
router.post('/organizations', requireAuth, requireAuthority, (req, res) => {
  try {
    const name = req.body.name;
    const shortName = req.body.shortName || req.body.short_name;
    const organizationType = req.body.organizationType || req.body.organization_type;
    const appName = req.body.appName || req.body.app_name;
    const logoUrl = req.body.logoUrl !== undefined ? req.body.logoUrl : req.body.logo_url;
    const address = req.body.address;
    const email = req.body.email;
    const phone = req.body.phone;

    if (!name || !organizationType) {
      return res.status(400).json({ success: false, message: 'Institution Name and Type are required.' });
    }

    const type = ['School', 'College', 'University'].includes(organizationType) ? organizationType : 'College';
    const id = 'org-' + uuidv4().substring(0, 8);
    const short = shortName ? shortName.trim().toUpperCase() : name.substring(0, 6).toUpperCase();
    const app = appName ? appName.trim() : `${short} Smart Leave`;

    db.prepare(`
      INSERT INTO organizations (id, name, short_name, organization_type, app_name, logo_url, address, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), short, type, app, logoUrl || null, address || null, email || null, phone || null);

    // If School mode: seed standard 1st to 10th Standard
    if (type === 'School') {
      const standards = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      const insertStd = db.prepare(`
        INSERT OR IGNORE INTO departments (id, organization_id, code, name, type)
        VALUES (?, ?, ?, ?, 'standard')
      `);
      standards.forEach((std, idx) => {
        insertStd.run(`std-${id}-${idx + 1}`, id, `${std} Std`, `${std} Standard`);
      });
    }

    logAudit({
      userId: req.user.userId,
      action: 'ORGANIZATION_CREATED',
      entityType: 'organization',
      entityId: id,
      details: { name, type, short }
    });

    return res.status(201).json({
      success: true,
      message: `${type} "${name}" created successfully.`,
      organization: { id, name, shortName: short, organizationType: type, appName: app }
    });
  } catch (err) {
    console.error('Create org error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create institution.' });
  }
});

// 4. Update organization branding & details
router.put('/organizations/:id', requireAuth, requireAuthority, (req, res) => {
  try {
    const orgId = req.params.id;
    const name = req.body.name;
    const shortName = req.body.shortName || req.body.short_name;
    const organizationType = req.body.organizationType || req.body.organization_type;
    const appName = req.body.appName || req.body.app_name;
    const logoUrl = req.body.logoUrl !== undefined ? req.body.logoUrl : req.body.logo_url;
    const address = req.body.address;
    const email = req.body.email;
    const phone = req.body.phone;
    const website = req.body.website;

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // Only allow updating if this authority belongs to this organization or is master admin
    const userEmail = (req.user.email || '').toLowerCase();
    if (req.user.orgId !== orgId && userEmail !== 'bitm@gmail.com') {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this institution.' });
    }

    db.prepare(`
      UPDATE organizations
      SET name = COALESCE(?, name),
          short_name = COALESCE(?, short_name),
          organization_type = COALESCE(?, organization_type),
          app_name = COALESCE(?, app_name),
          logo_url = COALESCE(?, logo_url),
          address = COALESCE(?, address),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          website = COALESCE(?, website)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      shortName ? shortName.trim() : null,
      organizationType || null,
      appName ? appName.trim() : null,
      logoUrl !== undefined ? logoUrl : null,
      address || null,
      email || null,
      phone || null,
      website || null,
      orgId
    );

    // If switched to School mode, ensure standards exist
    if (organizationType === 'School') {
      const standards = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      const insertStd = db.prepare(`
        INSERT OR IGNORE INTO departments (id, organization_id, code, name, type)
        VALUES (?, ?, ?, ?, 'standard')
      `);
      standards.forEach((std, idx) => {
        insertStd.run(`std-${orgId}-${idx + 1}`, orgId, `${std} Std`, `${std} Standard`);
      });
    }

    logAudit({
      userId: req.user.userId,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'organization',
      entityId: orgId,
      details: { name, appName, organizationType }
    });

    return res.json({ success: true, message: 'Institution settings updated successfully.' });
  } catch (err) {
    console.error('Update org error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update institution settings.' });
  }
});

// 5. Delete organization (strictly allowed only from within that particular institution's account)
router.delete('/organizations/:id', requireAuth, requireAuthority, (req, res) => {
  try {
    const orgId = req.params.id;

    if (orgId === 'org-bitm') {
      return res.status(400).json({
        success: false,
        message: 'The default primary BITM institution cannot be deleted.'
      });
    }

    // Authority must belong to this institution or be master admin
    if (req.user.orgId !== orgId && req.user.email !== 'bitm@gmail.com') {
      return res.status(403).json({ success: false, message: 'You can only delete an institution from within its own authority portal.' });
    }

    // Delete associated data
    db.prepare('DELETE FROM organizations WHERE id = ?').run(orgId);

    logAudit({
      userId: req.user.userId,
      action: 'ORGANIZATION_DELETED',
      entityType: 'organization',
      entityId: orgId,
      details: { deletedBy: req.user.email }
    });

    return res.json({ success: true, message: 'Institution and its records deleted successfully.' });
  } catch (err) {
    console.error('Delete org error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete institution.' });
  }
});

// 6. Student Login (Adapts automatically for School vs College / University)
router.post('/student/login', (req, res) => {
  try {
    const { usn, studentName, dob, organizationId } = req.body;

    if (!dob) {
      return res.status(400).json({ success: false, message: 'Date of Birth is required for login.' });
    }

    const norm = normalizeDob(dob);

    let student = null;

    // Check by USN / Student ID first if provided
    if (usn && usn.trim()) {
      const cleanUSN = usn.trim().toUpperCase();
      let query = `
        SELECT s.*, p.full_name, p.email, p.mobile_number, p.profile_photo,
               d.code as department_code, d.name as department_name,
               o.id as org_id, o.name as org_name, o.short_name as org_short_name, o.organization_type, o.app_name, o.logo_url as org_logo
        FROM students s
        JOIN profiles p ON s.profile_id = p.id
        LEFT JOIN departments d ON s.department_id = d.id
        JOIN organizations o ON s.organization_id = o.id
        WHERE UPPER(s.usn) = ?
      `;
      const params = [cleanUSN];
      if (organizationId) {
        query += ` AND s.organization_id = ?`;
        params.push(organizationId);
      }
      student = db.prepare(query).get(...params);
    }

    // If not found and in School mode or studentName provided: check by Full Name
    if (!student && studentName && studentName.trim()) {
      const cleanName = studentName.trim().toUpperCase();
      let query = `
        SELECT s.*, p.full_name, p.email, p.mobile_number, p.profile_photo,
               d.code as department_code, d.name as department_name,
               o.id as org_id, o.name as org_name, o.short_name as org_short_name, o.organization_type, o.app_name, o.logo_url as org_logo
        FROM students s
        JOIN profiles p ON s.profile_id = p.id
        LEFT JOIN departments d ON s.department_id = d.id
        JOIN organizations o ON s.organization_id = o.id
        WHERE UPPER(p.full_name) = ?
      `;
      const params = [cleanName];
      if (organizationId) {
        query += ` AND s.organization_id = ?`;
        params.push(organizationId);
      }
      student = db.prepare(query).get(...params);
    }

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'No student record found matching the provided credentials.'
      });
    }

    if (student.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your student account is deactivated. Please contact your institution authority.'
      });
    }

    // Verify Date of Birth:
    // Check against student.dob directly or normalized variations, or compare bcrypt hash
    const targetNorm = normalizeDob(student.dob);
    const dobMatches =
      student.dob === dob.trim() ||
      targetNorm.iso === norm.iso ||
      targetNorm.formatted.toLowerCase() === norm.formatted.toLowerCase() ||
      targetNorm.spaced.toLowerCase() === norm.spaced.toLowerCase() ||
      bcrypt.compareSync(norm.formatted, student.password_hash) ||
      bcrypt.compareSync(student.dob, student.password_hash) ||
      bcrypt.compareSync(dob.trim(), student.password_hash);

    if (!dobMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Date of Birth. Please select your registered Date of Birth.'
      });
    }

    const token = generateToken({
      userId: student.profile_id,
      studentId: student.id,
      userType: 'student',
      usn: student.usn,
      name: student.full_name,
      orgId: student.organization_id,
      orgType: student.organization_type
    });

    logAudit({
      userId: student.profile_id,
      action: 'STUDENT_LOGIN',
      entityType: 'student',
      entityId: student.id,
      details: { usn: student.usn, org: student.org_name }
    });

    return res.json({
      success: true,
      message: 'Student login successful.',
      token,
      user: {
        id: student.profile_id,
        studentId: student.id,
        userType: 'student',
        fullName: student.full_name,
        usn: student.usn,
        dob: student.dob,
        email: student.email,
        mobileNumber: student.mobile_number,
        organizationId: student.organization_id,
        organizationName: student.org_name,
        organizationType: student.organization_type,
        appName: student.app_name || `${student.org_short_name} Smart Leave`,
        orgLogo: student.org_logo,
        department: student.department_code || student.standard || '',
        departmentName: student.department_name || student.standard || '',
        standard: student.standard || '',
        section: student.section || '',
        semester: student.semester,
        college: student.org_name,
        profilePhoto: student.profile_photo || ''
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during student login.' });
  }
});

// 7. Authority Login
// DEFAULT AUTHORITY ACCOUNT:
// Email: BITM@gmail.com
// Password: BITM1234
router.post('/authority/login', (req, res) => {
  try {
    const { email, password, organizationId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both Email and Password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const candidatePassword = password.trim();

    let query = `
      SELECT a.*, p.full_name, p.email, p.mobile_number, p.profile_photo,
             o.id as org_id, o.name as org_name, o.short_name as org_short_name, o.organization_type, o.app_name, o.logo_url as org_logo
      FROM authorities a
      JOIN profiles p ON a.profile_id = p.id
      JOIN organizations o ON a.organization_id = o.id
      WHERE LOWER(p.email) = ?
    `;
    const params = [cleanEmail];

    if (organizationId && cleanEmail !== 'bitm@gmail.com') {
      query += ` AND a.organization_id = ?`;
      params.push(organizationId);
    }

    const authority = db.prepare(query).get(...params);

    if (!authority) {
      return res.status(401).json({ success: false, message: 'Invalid Authority credentials.' });
    }

    const isMatch = bcrypt.compareSync(candidatePassword, authority.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Authority credentials.' });
    }

    const token = generateToken({
      userId: authority.profile_id,
      authorityId: authority.id,
      userType: 'authority',
      role: authority.role,
      email: authority.email,
      name: authority.full_name,
      orgId: authority.organization_id,
      orgType: authority.organization_type
    });

    logAudit({
      userId: authority.profile_id,
      action: 'AUTHORITY_LOGIN',
      entityType: 'authority',
      entityId: authority.id,
      details: { email: authority.email, role: authority.role }
    });

    return res.json({
      success: true,
      message: 'Authority login successful.',
      token,
      user: {
        id: authority.profile_id,
        authorityId: authority.id,
        userType: 'authority',
        fullName: authority.full_name,
        email: authority.email,
        mobileNumber: authority.mobile_number,
        role: authority.role,
        organizationId: authority.organization_id,
        organization_id: authority.organization_id,
        organization: authority.org_name,
        organizationType: authority.organization_type,
        organization_type: authority.organization_type,
        orgShortName: authority.org_short_name,
        appName: authority.app_name || `${authority.org_short_name} Smart Leave`,
        orgLogo: authority.org_logo,
        profilePhoto: authority.profile_photo || ''
      }
    });
  } catch (err) {
    console.error('Authority login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authority login.' });
  }
});

// 8. Authority Change Password
router.post('/authority/change-password', requireAuth, requireAuthority, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const auth = db.prepare('SELECT password_hash FROM authorities WHERE id = ?').get(req.user.authorityId);
    if (!auth) {
      return res.status(404).json({ success: false, message: 'Authority record not found.' });
    }

    if (currentPassword && !bcrypt.compareSync(currentPassword, auth.password_hash)) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const newHash = bcrypt.hashSync(newPassword.trim(), 10);
    db.prepare(`
      UPDATE authorities
      SET password_hash = ?, must_change_password = 0
      WHERE id = ?
    `).run(newHash, req.user.authorityId);

    logAudit({
      userId: req.user.userId,
      action: 'AUTHORITY_PASSWORD_CHANGED',
      entityType: 'authority',
      entityId: req.user.authorityId,
      details: { email: req.user.email }
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Error changing password.' });
  }
});

// 9. Update Profile (Authority or Student Profile Photo)
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { fullName, mobileNumber, profilePhoto } = req.body;

    db.prepare(`
      UPDATE profiles
      SET full_name = COALESCE(?, full_name),
          mobile_number = COALESCE(?, mobile_number),
          profile_photo = COALESCE(?, profile_photo)
      WHERE id = ?
    `).run(
      fullName ? fullName.trim() : null,
      mobileNumber ? mobileNumber.trim() : null,
      profilePhoto !== undefined ? profilePhoto : null,
      req.user.userId
    );

    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// 10. Get Current User Session
router.get('/me', requireAuth, (req, res) => {
  try {
    const { userType, userId } = req.user;

    const notifCount = db.prepare(`
      SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND read = 0
    `).get(userId)?.unread_count || 0;

    if (userType === 'student') {
      const student = db.prepare(`
        SELECT s.*, p.full_name, p.email, p.mobile_number, p.profile_photo,
               d.code as department_code, d.name as department_name,
               o.id as org_id, o.name as org_name, o.short_name as org_short_name, o.organization_type, o.app_name, o.logo_url as org_logo
        FROM students s
        JOIN profiles p ON s.profile_id = p.id
        LEFT JOIN departments d ON s.department_id = d.id
        JOIN organizations o ON s.organization_id = o.id
        WHERE p.id = ?
      `).get(userId);

      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

      return res.json({
        success: true,
        user: {
          id: student.profile_id,
          studentId: student.id,
          userType: 'student',
          fullName: student.full_name,
          usn: student.usn,
          dob: student.dob,
          email: student.email,
          mobileNumber: student.mobile_number,
          organizationId: student.organization_id,
          organizationName: student.org_name,
          organizationType: student.organization_type,
          appName: student.app_name || `${student.org_short_name} Smart Leave`,
          orgLogo: student.org_logo,
          department: student.department_code || student.standard || '',
          departmentName: student.department_name || student.standard || '',
          standard: student.standard || '',
          section: student.section || '',
          semester: student.semester,
          college: student.org_name,
          profilePhoto: student.profile_photo || '',
          unreadNotifications: notifCount
        }
      });
    } else {
      const authority = db.prepare(`
        SELECT a.*, p.full_name, p.email, p.mobile_number, p.profile_photo,
               o.id as org_id, o.name as org_name, o.short_name as org_short_name, o.organization_type, o.app_name, o.logo_url as org_logo
        FROM authorities a
        JOIN profiles p ON a.profile_id = p.id
        JOIN organizations o ON a.organization_id = o.id
        WHERE p.id = ?
      `).get(userId);

      if (!authority) return res.status(404).json({ success: false, message: 'Authority profile not found.' });

      return res.json({
        success: true,
        user: {
          id: authority.profile_id,
          authorityId: authority.id,
          userType: 'authority',
          fullName: authority.full_name,
          email: authority.email,
          mobileNumber: authority.mobile_number,
          role: authority.role,
          organizationId: authority.organization_id,
          organization: authority.org_name,
          organizationType: authority.organization_type,
          orgShortName: authority.org_short_name,
          appName: authority.app_name || `${authority.org_short_name} Smart Leave`,
          orgLogo: authority.org_logo,
          profilePhoto: authority.profile_photo || '',
          unreadNotifications: notifCount
        }
      });
    }
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving user session.' });
  }
});

module.exports = router;
