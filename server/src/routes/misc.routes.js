const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth, requireAuthority } = require('../middleware/auth');

// Notifications for authenticated user
router.get('/notifications', requireAuth, (req, res) => {
  try {
    const notifs = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
    `).get(req.user.userId)?.count || 0;

    return res.json({ success: true, notifications: notifs, unreadCount });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// Mark single notification read
router.put('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.userId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// Mark all notifications read
router.put('/notifications/read-all', requireAuth, (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications SET read = 1 WHERE user_id = ?
    `).run(req.user.userId);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

// Departments list
router.get('/departments', (req, res) => {
  try {
    const depts = db.prepare(`SELECT * FROM departments ORDER BY code ASC`).all();
    return res.json({ success: true, departments: depts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
});

// Audit Logs (Authority only)
router.get('/audit-logs', requireAuth, requireAuthority, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, p.full_name as user_name, p.user_type, p.email
      FROM audit_logs a
      LEFT JOIN profiles p ON a.user_id = p.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
