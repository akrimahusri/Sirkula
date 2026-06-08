const express = require('express');
const { body } = require('express-validator');
const katalogController = require('../controllers/katalogController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', katalogController.getAllKatalog);
router.get('/:kategori', katalogController.getKatalogByKategori);

// Route untuk Admin: Tambah master data baru
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('nama').notEmpty().withMessage('Nama sampah diperlukan'),
    body('kategori').isIn(['plastik', 'kertas', 'logam', 'elektronik', 'kaca', 'organik']).withMessage('Kategori tidak valid'),
    body('hargaRataRata').isNumeric().withMessage('Harga rata-rata harus berupa angka')
  ],
  katalogController.createKatalog
);

module.exports = router;
