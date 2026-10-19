const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bitm_leave_super_secret_jwt_key_2026';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
}

function requireStudent(req, res, next) {
  if (!req.user || req.user.userType !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied. Student authorization required.' });
  }
  next();
}

function requireAuthority(req, res, next) {
  if (!req.user || req.user.userType !== 'authority') {
    return res.status(403).json({ success: false, message: 'Access denied. Authority authorization required.' });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  requireAuth,
  requireStudent,
  requireAuthority
};
