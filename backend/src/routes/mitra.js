const express = require('express');
const { body } = require('express-validator');
const mitraController = require('../controllers/mitraController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Route Publik
router.get('/', mitraController.getAllMitra);
router.get('/nearby', mitraController.getNearbyMitra);
router.get('/:id', mitraController.getMitraById);

// Route Admin: Daftar mitra baru
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('email').isEmail().withMessage('Format email salah'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 karakter')
  ],
  mitraController.createMitraAdmin
);

// Route Mitra / Admin
router.put('/:id', verifyToken, requireRole('mitra', 'admin'), mitraController.updateProfile);
router.put('/:id/katalog', verifyToken, requireRole('mitra', 'admin'), mitraController.updateKatalog);

module.exports = router;
