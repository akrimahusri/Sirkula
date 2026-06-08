const Mitra = require('../models/Mitra');
const Transaksi = require('../models/Transaksi');
const { filterMitraByRadius } = require('../services/locationService');
const { sendNotification } = require('../services/notificationService');

// Alias untuk mendapatkan mitra terdekat, sama seperti mitraController.getNearbyMitra
// Ditambahkan di sini agar rapi sesuai struktur REST /api/pickup
exports.getNearbyMitra = async (req, res, next) => {
  try {
    const { lat, lng, radius, jenisSampah } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Koordinat lat & lng dibutuhkan', errors: [], statusCode: 400 });
    }

    let query = { isVerified: true };
    if (jenisSampah) {
      query['katalog.jenisSampah'] = { $regex: new RegExp(jenisSampah, 'i') };
    }

    const mitraList = await Mitra.find(query).select('-password -otpCode -otpExpiry');
    const nearby = filterMitraByRadius(mitraList, parseFloat(lat), parseFloat(lng), parseFloat(radius || 10));

    res.status(200).json({ success: true, data: nearby, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.mulaiPenjemputan = async (req, res, next) => {
  try {
    const { id } = req.params; // transaksiId
    const mitraId = req.user.id;

    const transaksi = await Transaksi.findById(id).populate('userId', 'fcmToken');
    if (!transaksi) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan', errors: [], statusCode: 404 });
    if (transaksi.mitraId.toString() !== mitraId) return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
    if (transaksi.status !== 'diterima') return res.status(400).json({ success: false, message: 'Status harus diterima sebelum dapat dimulai', errors: [], statusCode: 400 });

    transaksi.status = 'dijemput'; // Dalam perjalanan
    await transaksi.save();

    if (transaksi.userId && transaksi.userId.fcmToken) {
      sendNotification(transaksi.userId.fcmToken, {
        title: 'Mitra Sedang Dalam Perjalanan',
        body: 'Mitra penjemput sampah sedang menuju ke lokasi Anda.',
        data: { transaksiId: transaksi._id.toString(), type: 'pickup_started' }
      });
    }

    res.status(200).json({ success: true, message: 'Perjalanan penjemputan dimulai', data: transaksi, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.tibaDiLokasi = async (req, res, next) => {
  try {
    const { id } = req.params; // transaksiId
    const mitraId = req.user.id;

    const transaksi = await Transaksi.findById(id).populate('userId', 'fcmToken');
    if (!transaksi) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan', errors: [], statusCode: 404 });
    if (transaksi.mitraId.toString() !== mitraId) return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });

    // Cukup trigger notifikasi tanpa merubah status database (masih dalam status "dijemput")
    // atau kita bisa membiarkannya sesuai workflow bisnis (misalnya tambah flag "isArrived")
    
    if (transaksi.userId && transaksi.userId.fcmToken) {
      sendNotification(transaksi.userId.fcmToken, {
        title: 'Mitra Telah Tiba',
        body: 'Mitra telah sampai di lokasi penjemputan Anda.',
        data: { transaksiId: transaksi._id.toString(), type: 'pickup_arrived' }
      });
    }

    res.status(200).json({ success: true, message: 'Notifikasi tiba telah dikirim ke user', statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

// Logika penyelesaian ini secara esensial sama dengan transaksiController.konfirmasiTransaksi
exports.selesaikanPenjemputan = async (req, res, next) => {
  try {
    const { itemsData } = req.body; // Array of { itemId, beratAktual }
    const { id: transaksiId } = req.params;
    const mitraId = req.user.id;

    const transaksi = await Transaksi.findById(transaksiId).populate('userId', 'fcmToken');
    if (!transaksi) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan', errors: [], statusCode: 404 });
    if (transaksi.mitraId.toString() !== mitraId) return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
    if (transaksi.status !== 'dijemput') return res.status(400).json({ success: false, message: 'Transaksi harus dalam status dijemput (perjalanan)', errors: [], statusCode: 400 });

    let totalAktual = 0;
    let parsedData = itemsData;
    if (typeof itemsData === 'string') parsedData = JSON.parse(itemsData);

    parsedData.forEach(update => {
      const item = transaksi.items.id(update.itemId);
      if (item) {
        item.beratAktual = update.beratAktual;
        item.subtotal = update.beratAktual * item.hargaPerKg;
        totalAktual += item.subtotal;
      }
    });

    transaksi.totalAktual = totalAktual;
    transaksi.status = 'selesai';
    await transaksi.save();

    await Mitra.findByIdAndUpdate(mitraId, { $inc: { totalTransaksi: 1 } });

    // Notifikasi Selesai & Total Harga
    if (transaksi.userId && transaksi.userId.fcmToken) {
      sendNotification(transaksi.userId.fcmToken, {
        title: 'Transaksi Selesai!',
        body: `Penjemputan berhasil. Total pendapatan Anda: Rp${totalAktual.toLocaleString('id-ID')}`,
        data: { transaksiId: transaksi._id.toString(), type: 'pickup_completed' }
      });
    }

    res.status(200).json({ success: true, message: 'Penjemputan selesai', data: transaksi, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};
