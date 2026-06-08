const jwt = require('jsonwebtoken');

/**
 * Middleware untuk memverifikasi JWT
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan atau format salah.',
      errors: [],
      statusCode: 401
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    let message = 'Token tidak valid';
    if (error.name === 'TokenExpiredError') message = 'Token sudah kadaluarsa';
    
    return res.status(401).json({
      success: false,
      message,
      errors: [],
      statusCode: 401
    });
  }
};

/**
 * Middleware untuk membatasi akses berdasarkan role
 * @param {...string} roles - Daftar role yang diizinkan (contoh: 'admin', 'mitra')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki izin untuk resource ini.',
        errors: [],
        statusCode: 403
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
