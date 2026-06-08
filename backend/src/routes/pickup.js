const express = require('express');
const { body } = require('express-validator');
const pickupController = require('../controllers/pickupController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// User & Mitra: Lihat mitra terdekat
router.get('/mitra/nearby', pickupController.getNearbyMitra);

// Mitra Actions (menggunakan parameter transaksiId)
router.post('/:id/mulai', requireRole('mitra'), pickupController.mulaiPenjemputan);
router.post('/:id/tiba', requireRole('mitra'), pickupController.tibaDiLokasi);
router.post('/:id/selesai', requireRole('mitra'), pickupController.selesaikanPenjemputan);

module.exports = router;
