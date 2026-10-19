const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

function logAudit({ userId, action, entityType, entityId, details }) {
  try {
    const id = 'audit-' + uuidv4();
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details || null);
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId || null, action, entityType, entityId || null, detailsStr);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAudit };
