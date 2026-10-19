const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// All endpoints in this router strictly require Authentication and Admin role
router.use(requireAuth);
router.use(requireAdmin);

// 1. Dashboard Statistics
router.get('/stats', (req, res) => {
  try {
    const totalOrganizations = db.prepare('SELECT COUNT(*) as count FROM organizations').get()?.count || 0;
    const activeOrganizations = db.prepare("SELECT COUNT(*) as count FROM organizations WHERE status != 'DEACTIVATED'").get()?.count || 0;
    const totalAuthorities = db.prepare('SELECT COUNT(*) as count FROM authorities').get()?.count || 0;
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get()?.count || 0;
    const totalLeaves = db.prepare('SELECT COUNT(*) as count FROM leave_applications').get()?.count || 0;

    const recentActivity = db.prepare(`
      SELECT a.*, p.full_name as user_name
      FROM audit_logs a
      LEFT JOIN profiles p ON a.user_id = p.id
      ORDER BY a.created_at DESC
      LIMIT 15
    `).all();

    const orgTypes = db.prepare(`
      SELECT organization_type, COUNT(*) as count
      FROM organizations
      GROUP BY organization_type
    `).all();

    return res.json({
      success: true,
      stats: {
        totalOrganizations,
        activeOrganizations,
        totalAuthorities,
        totalStudents,
        totalLeaves,
        orgTypes,
        recentActivity
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// 2. Organizations Management: List all organizations with stats
router.get('/organizations', (req, res) => {
  try {
    const orgs = db.prepare(`
      SELECT o.*,
             (SELECT COUNT(*) FROM authorities WHERE organization_id = o.id) as authority_count,
             (SELECT COUNT(*) FROM students WHERE organization_id = o.id) as student_count,
             (SELECT COUNT(*) FROM leave_applications WHERE organization_id = o.id) as leave_count
      FROM organizations o
      ORDER BY o.name ASC
    `).all();

    return res.json({ success: true, organizations: orgs });
  } catch (err) {
    console.error('Admin get organizations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch organizations.' });
  }
});

// 3. Add Organisation
router.post('/organizations', (req, res) => {
  try {
    const { name, shortName, organizationType, appName, logoUrl, address, email, phone, website } = req.body;

    if (!name || !organizationType) {
      return res.status(400).json({ success: false, message: 'Organisation Name and Type are required.' });
    }

    const type = ['School', 'College', 'University'].includes(organizationType) ? organizationType : 'College';
    const id = 'org-' + uuidv4().substring(0, 8);
    const short = shortName ? shortName.trim().toUpperCase() : name.substring(0, 6).toUpperCase();
    const app = appName ? appName.trim() : `${short} Smart Leave`;

    db.prepare(`
      INSERT INTO organizations (id, name, short_name, organization_type, app_name, logo_url, address, email, phone, website, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      id,
      name.trim(),
      short,
      type,
      app,
      logoUrl || null,
      address || null,
      email || null,
      phone || null,
      website || null
    );

    // Auto-seed structure based on type
    if (type === 'School') {
      const standards = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      const insertStd = db.prepare(`
        INSERT OR IGNORE INTO departments (id, organization_id, code, name, type)
        VALUES (?, ?, ?, ?, 'standard')
      `);
      standards.forEach((std, idx) => {
        insertStd.run(`std-${id}-${idx + 1}`, id, `${std} Std`, `${std} Standard`);
      });
    } else if (type === 'College') {
      const depts = [
        { code: 'CSE', name: 'Computer Science & Engineering' },
        { code: 'ECE', name: 'Electronics & Communication Engineering' },
        { code: 'ME', name: 'Mechanical Engineering' },
        { code: 'Civil', name: 'Civil Engineering' }
      ];
      const insertDept = db.prepare(`
        INSERT OR IGNORE INTO departments (id, organization_id, code, name, type)
        VALUES (?, ?, ?, ?, 'department')
      `);
      depts.forEach((d, idx) => {
        insertDept.run(`dept-${id}-${idx + 1}`, id, d.code, d.name);
      });
    }

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_ORGANIZATION_CREATED',
      entityType: 'organization',
      entityId: id,
      details: { name: name.trim(), type, short, createdByAdmin: req.user.email }
    });

    return res.status(201).json({
      success: true,
      message: `${type} "${name}" created successfully.`,
      organizationId: id
    });
  } catch (err) {
    console.error('Admin create org error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create organization.' });
  }
});

// 4. Update Organisation
router.put('/organizations/:id', (req, res) => {
  try {
    const orgId = req.params.id;
    const { name, shortName, organizationType, appName, logoUrl, address, email, phone, website, status } = req.body;

    const existing = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Organisation not found.' });
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
          website = COALESCE(?, website),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      shortName ? shortName.trim() : null,
      organizationType || null,
      appName ? appName.trim() : null,
      logoUrl !== undefined ? logoUrl : null,
      address !== undefined ? address : null,
      email !== undefined ? email : null,
      phone !== undefined ? phone : null,
      website !== undefined ? website : null,
      status || null,
      orgId
    );

    // If switched to School, verify standards exist
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
      action: 'ADMIN_ORGANIZATION_UPDATED',
      entityType: 'organization',
      entityId: orgId,
      details: { name, appName, organizationType, status, updatedBy: req.user.email }
    });

    return res.json({ success: true, message: 'Organisation updated successfully.' });
  } catch (err) {
    console.error('Admin update org error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update organization.' });
  }
});

// 5. Toggle Organisation Status (Activate / Deactivate)
router.post('/organizations/:id/toggle-status', (req, res) => {
  try {
    const orgId = req.params.id;
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organisation not found.' });
    }

    const currentStatus = org.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';

    db.prepare('UPDATE organizations SET status = ? WHERE id = ?').run(newStatus, orgId);

    logAudit({
      userId: req.user.userId,
      action: newStatus === 'DEACTIVATED' ? 'ADMIN_ORGANIZATION_DEACTIVATED' : 'ADMIN_ORGANIZATION_ACTIVATED',
      entityType: 'organization',
      entityId: orgId,
      details: { previousStatus: currentStatus, newStatus, orgName: org.name }
    });

    return res.json({
      success: true,
      message: `Organisation ${org.name} has been ${newStatus.toLowerCase()}.`,
      status: newStatus
    });
  } catch (err) {
    console.error('Admin toggle status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update organization status.' });
  }
});

// 6. Delete Organisation
router.delete('/organizations/:id', (req, res) => {
  try {
    const orgId = req.params.id;

    if (orgId === 'org-bitm') {
      return res.status(400).json({
        success: false,
        message: 'The default primary institution (BITM) cannot be deleted. You may deactivate it instead.'
      });
    }

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organisation not found.' });
    }

    db.prepare('DELETE FROM organizations WHERE id = ?').run(orgId);

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_ORGANIZATION_DELETED',
      entityType: 'organization',
      entityId: orgId,
      details: { deletedOrgName: org.name, deletedBy: req.user.email }
    });

    return res.json({ success: true, message: `Organisation "${org.name}" permanently deleted.` });
  } catch (err) {
    console.error('Admin delete org error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete organization.' });
  }
});

// 7. Authorities Management: List all authorities
router.get('/authorities', (req, res) => {
  try {
    const authorities = db.prepare(`
      SELECT a.id, a.profile_id, a.role, a.organization_id, a.status, a.authority_id_code, a.created_at,
             p.full_name, p.email, p.mobile_number, p.profile_photo,
             o.name as organization_name, o.short_name as organization_short_name, o.organization_type
      FROM authorities a
      JOIN profiles p ON a.profile_id = p.id
      JOIN organizations o ON a.organization_id = o.id
      ORDER BY p.full_name ASC
    `).all();

    return res.json({ success: true, authorities });
  } catch (err) {
    console.error('Admin get authorities error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch authorities.' });
  }
});

// 8. Add Authority
router.post('/authorities', (req, res) => {
  try {
    const { fullName, email, authorityIdCode, mobileNumber, designation, organizationId, role, password } = req.body;

    if (!fullName || !email || !organizationId) {
      return res.status(400).json({ success: false, message: 'Full Name, Email, and Organisation are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingProfile = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingProfile) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const org = db.prepare('SELECT id, name FROM organizations WHERE id = ?').get(organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Selected Organisation does not exist.' });
    }

    const initialPassword = password && password.trim() ? password.trim() : 'Auth@' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = bcrypt.hashSync(initialPassword, 10);

    const profileId = 'prof-' + uuidv4().substring(0, 8);
    const authorityId = 'auth-' + uuidv4().substring(0, 8);
    const assignedRole = designation || role || 'Authorized Leave Officer';
    const idCode = authorityIdCode ? authorityIdCode.trim().toUpperCase() : 'AUTH-' + Math.floor(100 + Math.random() * 900);

    db.prepare(`
      INSERT INTO profiles (id, user_type, full_name, email, mobile_number, profile_photo)
      VALUES (?, 'authority', ?, ?, ?, '')
    `).run(profileId, fullName.trim(), cleanEmail, mobileNumber || null);

    db.prepare(`
      INSERT INTO authorities (id, profile_id, role, organization_id, password_hash, status, authority_id_code, must_change_password)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, 1)
    `).run(authorityId, profileId, assignedRole, organizationId, passwordHash, idCode);

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_AUTHORITY_CREATED',
      entityType: 'authority',
      entityId: authorityId,
      details: { fullName, email: cleanEmail, organizationName: org.name, role: assignedRole }
    });

    return res.status(201).json({
      success: true,
      message: `Authority account for ${fullName} created successfully.`,
      initialPassword,
      authority: { id: authorityId, fullName, email: cleanEmail, role: assignedRole, orgName: org.name }
    });
  } catch (err) {
    console.error('Admin create authority error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create authority account.' });
  }
});

// 9. Update Authority
router.put('/authorities/:id', (req, res) => {
  try {
    const authId = req.params.id;
    const { fullName, mobileNumber, designation, role, organizationId, status, authorityIdCode } = req.body;

    const auth = db.prepare('SELECT a.*, p.id as profile_id FROM authorities a JOIN profiles p ON a.profile_id = p.id WHERE a.id = ?').get(authId);
    if (!auth) {
      return res.status(404).json({ success: false, message: 'Authority not found.' });
    }

    if (fullName || mobileNumber !== undefined) {
      db.prepare(`
        UPDATE profiles
        SET full_name = COALESCE(?, full_name),
            mobile_number = COALESCE(?, mobile_number)
        WHERE id = ?
      `).run(fullName ? fullName.trim() : null, mobileNumber !== undefined ? mobileNumber : null, auth.profile_id);
    }

    const updatedRole = designation || role;
    db.prepare(`
      UPDATE authorities
      SET role = COALESCE(?, role),
          organization_id = COALESCE(?, organization_id),
          status = COALESCE(?, status),
          authority_id_code = COALESCE(?, authority_id_code)
      WHERE id = ?
    `).run(
      updatedRole ? updatedRole.trim() : null,
      organizationId || null,
      status || null,
      authorityIdCode ? authorityIdCode.trim().toUpperCase() : null,
      authId
    );

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_AUTHORITY_UPDATED',
      entityType: 'authority',
      entityId: authId,
      details: { fullName, updatedRole, organizationId, status }
    });

    return res.json({ success: true, message: 'Authority updated successfully.' });
  } catch (err) {
    console.error('Admin update authority error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update authority.' });
  }
});

// 10. Reset Authority Password
router.post('/authorities/:id/reset-password', (req, res) => {
  try {
    const authId = req.params.id;
    const { newPassword } = req.body;

    const auth = db.prepare('SELECT a.*, p.email, p.full_name FROM authorities a JOIN profiles p ON a.profile_id = p.id WHERE a.id = ?').get(authId);
    if (!auth) {
      return res.status(404).json({ success: false, message: 'Authority not found.' });
    }

    const tempPass = newPassword && newPassword.trim() ? newPassword.trim() : 'Pass@' + Math.floor(1000 + Math.random() * 9000);
    const hash = bcrypt.hashSync(tempPass, 10);

    db.prepare('UPDATE authorities SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(hash, authId);

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_AUTHORITY_PASSWORD_RESET',
      entityType: 'authority',
      entityId: authId,
      details: { email: auth.email, full_name: auth.full_name }
    });

    return res.json({
      success: true,
      message: `Password reset successfully for ${auth.full_name}.`,
      temporaryPassword: tempPass
    });
  } catch (err) {
    console.error('Admin reset pass error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset authority password.' });
  }
});

// 11. Toggle Authority Status (Activate / Deactivate)
router.post('/authorities/:id/toggle-status', (req, res) => {
  try {
    const authId = req.params.id;
    const auth = db.prepare('SELECT a.*, p.full_name, p.email FROM authorities a JOIN profiles p ON a.profile_id = p.id WHERE a.id = ?').get(authId);

    if (!auth) {
      return res.status(404).json({ success: false, message: 'Authority not found.' });
    }

    if (auth.email.toLowerCase() === 'bitm@gmail.com') {
      return res.status(400).json({ success: false, message: 'The primary default authority account cannot be deactivated.' });
    }

    const currentStatus = auth.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';

    db.prepare('UPDATE authorities SET status = ? WHERE id = ?').run(newStatus, authId);

    logAudit({
      userId: req.user.userId,
      action: newStatus === 'DEACTIVATED' ? 'ADMIN_AUTHORITY_DEACTIVATED' : 'ADMIN_AUTHORITY_ACTIVATED',
      entityType: 'authority',
      entityId: authId,
      details: { previousStatus: currentStatus, newStatus, authorityName: auth.full_name }
    });

    return res.json({
      success: true,
      message: `Authority ${auth.full_name} has been ${newStatus.toLowerCase()}.`,
      status: newStatus
    });
  } catch (err) {
    console.error('Admin toggle auth status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update authority status.' });
  }
});

// 12. Delete Authority
router.delete('/authorities/:id', (req, res) => {
  try {
    const authId = req.params.id;
    const auth = db.prepare('SELECT a.*, p.email, p.id as profile_id FROM authorities a JOIN profiles p ON a.profile_id = p.id WHERE a.id = ?').get(authId);

    if (!auth) {
      return res.status(404).json({ success: false, message: 'Authority not found.' });
    }

    if (auth.email.toLowerCase() === 'bitm@gmail.com') {
      return res.status(400).json({ success: false, message: 'The default primary authority account cannot be deleted.' });
    }

    db.prepare('DELETE FROM authorities WHERE id = ?').run(authId);
    db.prepare('DELETE FROM profiles WHERE id = ?').run(auth.profile_id);

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_AUTHORITY_DELETED',
      entityType: 'authority',
      entityId: authId,
      details: { deletedEmail: auth.email }
    });

    return res.json({ success: true, message: 'Authority account deleted successfully.' });
  } catch (err) {
    console.error('Admin delete authority error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete authority.' });
  }
});

// 13. System Audit Logs
router.get('/audit-logs', (req, res) => {
  try {
    const { action, entityType, search } = req.query;
    let query = `
      SELECT a.*, p.full_name as user_name, p.email as user_email
      FROM audit_logs a
      LEFT JOIN profiles p ON a.user_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }
    if (entityType) {
      query += ' AND a.entity_type = ?';
      params.push(entityType);
    }
    if (search) {
      query += ' AND (a.action LIKE ? OR a.details LIKE ? OR p.full_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY a.created_at DESC LIMIT 300';

    const logs = db.prepare(query).all(...params);
    return res.json({ success: true, logs });
  } catch (err) {
    console.error('Admin audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

// 14. Security Events (Failed Logins, Unauthorized attempts)
router.get('/security-events', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT * FROM audit_logs
      WHERE action LIKE '%FAIL%' OR action LIKE '%DENIED%' OR action LIKE '%SECURITY%' OR action LIKE '%ADMIN%'
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return res.json({ success: true, events });
  } catch (err) {
    console.error('Admin security events error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch security events.' });
  }
});

// 15. Administrators List
router.get('/admins', (req, res) => {
  try {
    const admins = db.prepare(`
      SELECT a.id, a.profile_id, a.admin_id, a.role, a.status, a.created_at,
             p.full_name, p.email, p.mobile_number, p.profile_photo
      FROM admins a
      JOIN profiles p ON a.profile_id = p.id
      ORDER BY a.created_at ASC
    `).all();

    return res.json({ success: true, admins });
  } catch (err) {
    console.error('Admin list error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch administrators.' });
  }
});

// 16. Invite / Create Administrator
router.post('/admins', (req, res) => {
  try {
    const { fullName, email, adminIdCode, phone, password, role } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Full Name and Email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingProfile = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingProfile) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const code = adminIdCode ? adminIdCode.trim().toUpperCase() : 'ADMIN-' + Math.floor(100 + Math.random() * 900);
    const existingAdminCode = db.prepare('SELECT id FROM admins WHERE admin_id = ?').get(code);
    if (existingAdminCode) {
      return res.status(409).json({ success: false, message: 'This Admin ID code is already assigned.' });
    }

    const initialPassword = password && password.trim() ? password.trim() : 'Admin@' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = bcrypt.hashSync(initialPassword, 10);

    const profileId = 'prof-' + uuidv4().substring(0, 8);
    const adminRecordId = 'adm-' + uuidv4().substring(0, 8);
    const assignedRole = role || 'System Administrator';

    db.prepare(`
      INSERT INTO profiles (id, user_type, full_name, email, mobile_number, profile_photo)
      VALUES (?, 'admin', ?, ?, ?, '')
    `).run(profileId, fullName.trim(), cleanEmail, phone || null);

    db.prepare(`
      INSERT INTO admins (id, profile_id, admin_id, role, password_hash, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `).run(adminRecordId, profileId, code, assignedRole, passwordHash);

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_INVITED_ADMIN',
      entityType: 'admin',
      entityId: adminRecordId,
      details: { fullName, email: cleanEmail, adminId: code, createdBy: req.user.email }
    });

    return res.status(201).json({
      success: true,
      message: `Administrator account created for ${fullName}.`,
      admin: { id: adminRecordId, adminId: code, fullName, email: cleanEmail, role: assignedRole },
      temporaryPassword: initialPassword
    });
  } catch (err) {
    console.error('Admin create admin error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create administrator.' });
  }
});

// 17. Generate Admin Invitation Code
router.post('/invite-code', (req, res) => {
  try {
    const { email } = req.body;
    const code = 'ADM-INV-' + uuidv4().substring(0, 8).toUpperCase();
    const id = 'inv-' + uuidv4().substring(0, 8);

    db.prepare(`
      INSERT INTO admin_invitations (id, code, email, created_by, used, expires_at)
      VALUES (?, ?, ?, ?, 0, datetime('now', '+7 days'))
    `).run(id, code, email ? email.trim().toLowerCase() : null, req.user.email);

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_INVITATION_CODE_GENERATED',
      entityType: 'admin_invitation',
      entityId: id,
      details: { code, email: email || 'any', createdBy: req.user.email }
    });

    return res.status(201).json({
      success: true,
      message: 'Admin invitation code generated successfully (valid for 7 days).',
      code
    });
  } catch (err) {
    console.error('Admin invite code error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate invitation code.' });
  }
});

// 18. Update Admin Profile
router.put('/profile', (req, res) => {
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
      mobileNumber !== undefined ? mobileNumber : null,
      profilePhoto !== undefined ? profilePhoto : null,
      req.user.userId
    );

    return res.json({ success: true, message: 'Admin profile updated successfully.' });
  } catch (err) {
    console.error('Admin profile update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// 19. Change Admin Password
router.post('/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and New passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const admin = db.prepare('SELECT a.* FROM admins a WHERE a.profile_id = ?').get(req.user.userId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin record not found.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password does not match.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, admin.id);

    logAudit({
      userId: req.user.userId,
      action: 'ADMIN_PASSWORD_CHANGED',
      entityType: 'admin',
      entityId: admin.id,
      details: { email: req.user.email }
    });

    return res.json({ success: true, message: 'Admin password changed successfully.' });
  } catch (err) {
    console.error('Admin change pass error:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

module.exports = router;
