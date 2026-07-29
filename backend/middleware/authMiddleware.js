const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'finflow_super_secret_jwt_key_2026';

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // Provide fallback user context for guest / local JSON mode compatibility
    req.user = { id: 'guest_user_id', name: 'Guest User', email: 'guest@finflow.app' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Fallback to guest user context if token is expired or invalid
    req.user = { id: 'guest_user_id', name: 'Guest User', email: 'guest@finflow.app' };
    next();
  }
};

module.exports = { protect, JWT_SECRET };
