const express = require('express');
const { body } = require('express-validator');
const transaksiController = require('../controllers/transaksiController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { uploadPhotos } = require('../middleware/upload');

const router = express.Router();

// Terapkan proteksi JWT pada semua rute transaksi
router.use(verifyToken);

router.get('/', transaksiController.getListTransaksi);
router.get('/:id', transaksiController.getDetailTransaksi);

// User: Ajukan permintaan
router.post(
  '/',
  requireRole('user'),
  uploadPhotos.array('foto', 5), // maksimal 5 file foto
  [
    body('mitraId').notEmpty().withMessage('ID Mitra dibutuhkan'),
    body('items').notEmpty().withMessage('Item sampah tidak boleh kosong'),
    body('jadwalPenjemputan').notEmpty().withMessage('Jadwal penjemputan harus diisi')
  ],
  transaksiController.createTransaksi
);

// User & Mitra: Update status
router.patch('/:id/status', requireRole('user', 'mitra'), transaksiController.updateStatus);

// Mitra: Konfirmasi final
router.post('/:id/konfirmasi', requireRole('mitra'), transaksiController.konfirmasiTransaksi);

// User: Beri Rating
router.post('/:id/rating', requireRole('user'), transaksiController.beriRating);

module.exports = router;
