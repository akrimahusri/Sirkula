const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiter spesifik untuk endpoint auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Limit setiap IP hingga 5 requests per 15 menit
  message: { success: false, message: "Terlalu banyak percobaan, silakan coba lagi setelah 15 menit.", statusCode: 429 }
});

// Validasi Password (minimal 8 karakter dan mengandung angka)
const passwordValidation = body('password')
  .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
  .matches(/\d/).withMessage('Password harus mengandung minimal satu angka');

const newPasswordValidation = body('newPassword')
  .isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter')
  .matches(/\d/).withMessage('Password baru harus mengandung minimal satu angka');

// Validasi Nomor Telepon Indonesia (08xx atau +628xx)
const noTelpValidation = body('noTelp')
  .matches(/^(?:\+62|0)8[1-9][0-9]{6,10}$/).withMessage('Format nomor telepon tidak valid (harus 08xx atau +628xx)');

// Validasi Email
const emailValidation = body('email').isEmail().withMessage('Format email tidak valid');

// --- ROUTES ---

router.post(
  '/register',
  [
    emailValidation,
    passwordValidation,
    noTelpValidation,
    body('role').isIn(['user', 'mitra', 'admin']).withMessage('Role tidak valid')
  ],
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    emailValidation,
    body('password').notEmpty().withMessage('Password tidak boleh kosong')
  ],
  authController.login
);

router.post('/logout', verifyToken, authController.logout);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token wajib disertakan')],
  authController.refresh
);

router.post(
  '/forgot-password',
  authLimiter,
  [emailValidation],
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  [
    emailValidation,
    body('otp').notEmpty().withMessage('OTP tidak boleh kosong'),
    newPasswordValidation
  ],
  authController.resetPassword
);

router.get('/me', verifyToken, authController.getMe);

module.exports = router;
