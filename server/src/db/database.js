const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'bitm_leave.db');
const db = new DatabaseSync(dbPath);

// Enable Foreign Keys and WAL mode
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      organization_type TEXT NOT NULL DEFAULT 'College',
      app_name TEXT DEFAULT 'BITM Smart Leave',
      logo_url TEXT,
      address TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'department',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_type TEXT NOT NULL CHECK(user_type IN ('student', 'authority')),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      mobile_number TEXT,
      profile_photo TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL UNIQUE,
      usn TEXT NOT NULL UNIQUE,
      dob TEXT NOT NULL,
      organization_id TEXT NOT NULL DEFAULT 'org-bitm',
      department_id TEXT,
      standard TEXT,
      section TEXT,
      semester INTEGER NOT NULL DEFAULT 1,
      college TEXT NOT NULL DEFAULT 'Ballari Institute of Technology and Management',
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
      parent_contact TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS authorities (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'Authorized Leave Officer',
      organization_id TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leave_applications (
      id TEXT PRIMARY KEY,
      leave_application_number TEXT NOT NULL UNIQUE,
      student_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      department_id TEXT,
      assigned_authority_id TEXT,
      leave_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      number_of_days INTEGER NOT NULL,
      additional_remarks TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      approver_name TEXT,
      approver_designation TEXT,
      approval_date TEXT,
      rejected_by_name TEXT,
      rejection_reason TEXT,
      is_invalid INTEGER DEFAULT 0,
      attendance_penalty_days INTEGER DEFAULT 0,
      grace_date TEXT,
      verification_deadline TEXT,
      student_hidden INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leave_approvals (
      id TEXT PRIMARY KEY,
      leave_id TEXT NOT NULL,
      authority_id TEXT,
      authority_role TEXT,
      approver_name TEXT,
      action TEXT NOT NULL,
      comments TEXT,
      action_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (leave_id) REFERENCES leave_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leave_documents (
      id TEXT PRIMARY KEY,
      leave_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (leave_id) REFERENCES leave_applications(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qr_verification_tokens (
      id TEXT PRIMARY KEY,
      leave_id TEXT NOT NULL UNIQUE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (leave_id) REFERENCES leave_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leave_verifications (
      id TEXT PRIMARY KEY,
      leave_id TEXT NOT NULL UNIQUE,
      qr_token_id TEXT NOT NULL,
      verified_by TEXT,
      verified_by_name TEXT,
      organization_id TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
      verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      FOREIGN KEY (leave_id) REFERENCES leave_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'INFO',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL UNIQUE,
      admin_id TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'SYSTEM_ADMIN',
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_invitations (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      email TEXT,
      created_by TEXT,
      used INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrate profiles check constraint if 'admin' is not included
  try {
    const profTable = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='profiles'").get();
    if (profTable && profTable.sql && !profTable.sql.includes("'admin'")) {
      db.exec('PRAGMA foreign_keys = OFF;');
      db.exec(`
        CREATE TABLE profiles_v2 (
          id TEXT PRIMARY KEY,
          user_type TEXT NOT NULL CHECK(user_type IN ('student', 'authority', 'admin')),
          full_name TEXT NOT NULL,
          email TEXT UNIQUE,
          mobile_number TEXT,
          profile_photo TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO profiles_v2 SELECT * FROM profiles;
        DROP TABLE profiles;
        ALTER TABLE profiles_v2 RENAME TO profiles;
      `);
      db.exec('PRAGMA foreign_keys = ON;');
    }
  } catch (migErr) {
    console.error('Profile table migration notice:', migErr.message);
  }

  // Migrate columns gracefully if needed
  const migrations = [
    `ALTER TABLE departments ADD COLUMN type TEXT DEFAULT 'department'`,
    `ALTER TABLE organizations ADD COLUMN app_name TEXT DEFAULT 'BITM Smart Leave'`,
    `ALTER TABLE organizations ADD COLUMN logo_url TEXT`,
    `ALTER TABLE organizations ADD COLUMN address TEXT`,
    `ALTER TABLE organizations ADD COLUMN email TEXT`,
    `ALTER TABLE organizations ADD COLUMN phone TEXT`,
    `ALTER TABLE organizations ADD COLUMN website TEXT`,
    `ALTER TABLE organizations ADD COLUMN status TEXT DEFAULT 'ACTIVE'`,
    `ALTER TABLE authorities ADD COLUMN status TEXT DEFAULT 'ACTIVE'`,
    `ALTER TABLE authorities ADD COLUMN authority_id_code TEXT`,
    `ALTER TABLE students ADD COLUMN organization_id TEXT NOT NULL DEFAULT 'org-bitm'`,
    `ALTER TABLE students ADD COLUMN standard TEXT`,
    `ALTER TABLE students ADD COLUMN section TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN approver_name TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN approver_designation TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN approval_date TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN rejected_by_name TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN rejection_reason TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN is_invalid INTEGER DEFAULT 0`,
    `ALTER TABLE leave_applications ADD COLUMN attendance_penalty_days INTEGER DEFAULT 0`,
    `ALTER TABLE leave_applications ADD COLUMN grace_date TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN verification_deadline TEXT`,
    `ALTER TABLE leave_applications ADD COLUMN student_hidden INTEGER DEFAULT 0`,
    `ALTER TABLE leave_approvals ADD COLUMN approver_name TEXT`,
    `ALTER TABLE leave_verifications ADD COLUMN verified_by_name TEXT`
  ];

  for (const m of migrations) {
    try {
      db.exec(m);
    } catch (e) {
      // Column already exists
    }
  }

  seedData();
}

function seedData() {
  // Seed primary College: Ballari Institute of Technology and Management
  db.prepare(`
    INSERT OR IGNORE INTO organizations (id, name, short_name, organization_type, app_name, address, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'org-bitm',
    'Ballari Institute of Technology and Management',
    'BITM',
    'College',
    'BITM Smart Leave System',
    'Jnana Gangotri Campus, Bellary-Hospet Road, Ballari, Karnataka 583104',
    'principal@bitm.edu.in',
    '+91 83922 24800'
  );

  // Seed School: BITM Central Public School
  db.prepare(`
    INSERT OR IGNORE INTO organizations (id, name, short_name, organization_type, app_name, address, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'org-school',
    'BITM Central Public School & PU College',
    'BITM-School',
    'School',
    'BITM School Leave System',
    'Jnana Gangotri Campus, Ballari, Karnataka 583104',
    'school@bitm.edu.in',
    '+91 83922 24810'
  );

  // Seed University: BITM Deemed University
  db.prepare(`
    INSERT OR IGNORE INTO organizations (id, name, short_name, organization_type, app_name, address, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'org-univ',
    'BITM Deemed University',
    'BITM-Univ',
    'University',
    'BITM University Leave System',
    'University Campus, Ballari, Karnataka 583104',
    'registrar@bitm.edu.in',
    '+91 83922 24820'
  );

  // Seed default college departments for BITM
  const departments = [
    { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' },
    { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering' },
    { id: 'dept-ise', code: 'ISE', name: 'Information Science & Engineering' },
    { id: 'dept-me', code: 'ME', name: 'Mechanical Engineering' },
    { id: 'dept-eee', code: 'EEE', name: 'Electrical & Electronics Engineering' },
    { id: 'dept-civil', code: 'Civil', name: 'Civil Engineering' },
    { id: 'dept-aiml', code: 'AI&ML', name: 'Artificial Intelligence & Machine Learning' },
    { id: 'dept-ds', code: 'CSE-DS', name: 'CSE (Data Science)' }
  ];

  const insertDept = db.prepare(`
    INSERT OR IGNORE INTO departments (id, organization_id, code, name, type)
    VALUES (?, ?, ?, ?, 'department')
  `);
  for (const dept of departments) {
    insertDept.run(dept.id, 'org-bitm', dept.code, dept.name);
  }

  // Seed School Standards (1st to 10th) for org-school
  const schoolStandards = [
    { id: 'std-1', code: '1st Std', name: '1st Standard' },
    { id: 'std-2', code: '2nd Std', name: '2nd Standard' },
    { id: 'std-3', code: '3rd Std', name: '3rd Standard' },
    { id: 'std-4', code: '4th Std', name: '4th Standard' },
    { id: 'std-5', code: '5th Std', name: '5th Standard' },
    { id: 'std-6', code: '6th Std', name: '6th Standard' },
    { id: 'std-7', code: '7th Std', name: '7th Standard' },
    { id: 'std-8', code: '8th Std', name: '8th Standard' },
    { id: 'std-9', code: '9th Std', name: '9th Standard' },
    { id: 'std-10', code: '10th Std', name: '10th Standard' }
  ];
  for (const std of schoolStandards) {
    insertDept.run(`school-${std.id}`, 'org-school', std.code, std.name);
  }

  // Seed University Academic Divisions for org-univ
  const univDivisions = [
    { id: 'univ-eng', code: 'SOE', name: 'School of Engineering & Technology' },
    { id: 'univ-comp', code: 'SOCA', name: 'School of Computer Applications' },
    { id: 'univ-mgmt', code: 'SOM', name: 'School of Management Studies' },
    { id: 'univ-sci', code: 'SOAS', name: 'School of Applied Sciences' }
  ];
  for (const div of univDivisions) {
    insertDept.run(`univ-${div.id}`, 'org-univ', div.code, div.name);
  }

  // EXACT DEFAULT AUTHORITY CREDENTIALS:
  // Email: BITM@gmail.com
  // Password: BITM1234
  // ONLY THIS ONE DEFAULT ACCOUNT. DO NOT CREATE ANY OTHER DEFAULT ACCOUNTS.
  const authProfileId = 'prof-bitm-authority';
  const authId = 'auth-bitm-authority';
  const defaultPassHash = bcrypt.hashSync('BITM1234', 10);

  const existingAuthProfile = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ?').get('bitm@gmail.com');
  if (!existingAuthProfile) {
    db.prepare(`
      INSERT INTO profiles (id, user_type, full_name, email, mobile_number, profile_photo)
      VALUES (?, 'authority', 'BITM Authority Admin', 'BITM@gmail.com', '+91 83922 24800', '')
    `).run(authProfileId);

    db.prepare(`
      INSERT INTO authorities (id, profile_id, role, organization_id, password_hash, must_change_password)
      VALUES (?, ?, 'Authorized Leave Officer', ?, ?, 0)
    `).run(authId, authProfileId, 'org-bitm', defaultPassHash);
  } else {
    // Ensure password hash matches BITM1234 exactly
    const existingAuth = db.prepare('SELECT id FROM authorities WHERE profile_id = ?').get(existingAuthProfile.id);
    if (existingAuth) {
      db.prepare('UPDATE authorities SET password_hash = ? WHERE id = ?').run(defaultPassHash, existingAuth.id);
    }
  }

  // Remove test student accounts to adhere to rule:
  // "Do not create any additional default/test accounts. Only the logged-in authority can create student accounts"
  try {
    const testStud = db.prepare("SELECT id, profile_id FROM students WHERE usn = 'BITMTEST001'").get();
    if (testStud) {
      db.prepare('DELETE FROM students WHERE id = ?').run(testStud.id);
      db.prepare('DELETE FROM profiles WHERE id = ?').run(testStud.profile_id);
    }
  } catch (e) {
    // ignore
  }

  // --- SEED INITIAL SYSTEM ADMINISTRATOR (If none exists) ---
  const existingAdmin = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (!existingAdmin) {
    const adminProfId = 'prof-system-admin-01';
    const adminId = 'adm-system-admin-01';
    const adminPassHash = bcrypt.hashSync('Admin@1234', 10);

    const existingProf = db.prepare('SELECT id FROM profiles WHERE LOWER(email) = ?').get('admin@system.local');
    if (!existingProf) {
      db.prepare(`
        INSERT INTO profiles (id, user_type, full_name, email, mobile_number, profile_photo)
        VALUES (?, 'admin', 'System Administrator', 'admin@system.local', '+91 99000 00001', '')
      `).run(adminProfId);

      db.prepare(`
        INSERT INTO admins (id, profile_id, admin_id, role, password_hash, status)
        VALUES (?, ?, 'ADMIN-001', 'Super System Administrator', ?, 'ACTIVE')
      `).run(adminId, adminProfId, adminPassHash);
    }
  }

  // Seed default admin authorization / setup key if none exists
  db.prepare(`
    INSERT OR IGNORE INTO admin_invitations (id, code, email, created_by, used, expires_at)
    VALUES ('inv-setup-01', 'ADMIN-SETUP-KEY-2026', 'admin@system.local', 'system', 0, '2099-12-31')
  `).run();
}

// Background Expiry Engine: checks verification deadlines and auto-rejects
function checkAndExpireLeaves() {
  try {
    const now = new Date();
    // Get all approved leaves awaiting verification
    const activeLeaves = db.prepare(`
      SELECT l.*, qrt.id as token_id
      FROM leave_applications l
      LEFT JOIN qr_verification_tokens qrt ON l.id = qrt.leave_id
      WHERE l.status = 'APPROVED'
    `).all();

    for (const leave of activeLeaves) {
      if (leave.verification_deadline) {
        const deadline = new Date(leave.verification_deadline);
        if (now > deadline) {
          // Expire this leave
          db.prepare(`
            UPDATE leave_applications
            SET status = 'REJECTED',
                rejection_reason = 'Rejected – Verification Deadline Expired',
                updated_at = datetime('now')
            WHERE id = ?
          `).run(leave.id);

          if (leave.token_id) {
            db.prepare('UPDATE qr_verification_tokens SET revoked = 1 WHERE id = ?').run(leave.token_id);
          }

          // Student notification
          const stud = db.prepare('SELECT profile_id FROM students WHERE id = ?').get(leave.student_id);
          if (stud) {
            db.prepare(`
              INSERT INTO notifications (id, user_id, title, message, type)
              VALUES ('notif-' || abs(random()), ?, 'Leave Verification Expired', ?, 'LEAVE_REJECTED')
            `).run(
              stud.profile_id,
              `Your leave application ${leave.leave_application_number} has been automatically rejected because the 1-day verification grace period has expired.`
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('Background expiry check error:', err);
  }
}

initSchema();

// Run expiry check on startup and periodically every 60 seconds
checkAndExpireLeaves();
const expiryTimer = setInterval(checkAndExpireLeaves, 60000);
if (expiryTimer.unref) expiryTimer.unref();

db.checkAndExpireLeaves = checkAndExpireLeaves;

module.exports = db;
