const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

function createNotification({ userId, title, message, type = 'INFO' }) {
  try {
    const id = 'notif-' + uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(id, userId, title, message, type);
    return id;
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
}

function notifyAllAuthorities({ title, message, type = 'LEAVE_APPLICATION' }) {
  try {
    const authorities = db.prepare(`SELECT profile_id FROM authorities`).all();
    for (const auth of authorities) {
      createNotification({
        userId: auth.profile_id,
        title,
        message,
        type
      });
    }
  } catch (err) {
    console.error('Authority broadcast notification error:', err.message);
  }
}

module.exports = { createNotification, notifyAllAuthorities };
