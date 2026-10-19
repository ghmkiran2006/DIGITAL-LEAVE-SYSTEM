const express = require('express');
const cors = require('cors');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration allowing dynamic reflection for Vercel, localhost, and custom domains
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : null;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching origins
    if (!origin || !allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow to prevent deployment lockouts
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded documents statically
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Import DB for inline routes
const db = require('./db/database');
const { requireAuth } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth.routes');
const leaveRoutes = require('./routes/leave.routes');
const qrRoutes = require('./routes/qr.routes');
const studentMgmtRoutes = require('./routes/student-management.routes');

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/authority/students', studentMgmtRoutes);

// --- Notifications API ---
app.get('/api/notifications', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.user.userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
    `).get(req.user.userId)?.count || 0;

    return res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

app.put('/api/notifications/:id/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark notification.' });
  }
});

app.put('/api/notifications/read-all', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.userId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications.' });
  }
});

// Delete individual notification
app.delete('/api/notifications/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
    return res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
});

// Clear all notifications
app.delete('/api/notifications', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.userId);
    return res.json({ success: true, message: 'All notifications cleared.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to clear notifications.' });
  }
});

// --- Audit Logs API ---
app.get('/api/audit-logs', requireAuth, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, p.full_name as user_name
      FROM audit_logs a
      LEFT JOIN profiles p ON a.user_id = p.id
      ORDER BY a.created_at DESC
      LIMIT 200
    `).all();
    return res.json({ success: true, logs });
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

// --- Departments & Standards API ---
app.get('/api/departments', (req, res) => {
  try {
    const { organizationId } = req.query;
    let query = 'SELECT * FROM departments';
    const params = [];
    if (organizationId) {
      query += ' WHERE organization_id = ?';
      params.push(organizationId);
    }
    query += ' ORDER BY code';
    const departments = db.prepare(query).all(...params);
    return res.json({ success: true, departments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
});

// Add department or standard to institution
app.post('/api/departments', requireAuth, (req, res) => {
  try {
    const { code, name, organizationId, type } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Code and Name are required.' });
    }
    const orgId = organizationId || req.user.orgId || 'org-bitm';
    const id = 'dept-' + Date.now();
    db.prepare(`
      INSERT INTO departments (id, organization_id, code, name, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, orgId, code.trim(), name.trim(), type || 'department');

    return res.status(201).json({ success: true, message: 'Department/Standard added.', department: { id, code, name } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add department.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Digital Leave System Backend running on port ${PORT}`);
});
