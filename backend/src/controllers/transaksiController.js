const Transaksi = require('../models/Transaksi');
const Mitra = require('../models/Mitra');

exports.createTransaksi = async (req, res, next) => {
  try {
    const { mitraId, items, lokasiPenjemputan, jadwalPenjemputan } = req.body;
    const userId = req.user.id;

    // Foto array from multer
    const fotoUrls = req.files ? req.files.map(file => file.path) : [];

    // Parse items if it's sent as JSON string in form-data
    let parsedItems = items;
    if (typeof items === 'string') {
      parsedItems = JSON.parse(items);
    }

    // Hitung total estimasi
    let totalEstimasi = 0;
    parsedItems.forEach(item => {
      totalEstimasi += item.beratEstimasi * item.hargaPerKg;
      item.subtotal = item.beratEstimasi * item.hargaPerKg;
    });

    // Parse lokasi jika string
    let parsedLokasi = lokasiPenjemputan;
    if (typeof lokasiPenjemputan === 'string') {
      parsedLokasi = JSON.parse(lokasiPenjemputan);
    }

    const newTransaksi = new Transaksi({
      userId,
      mitraId,
      items: parsedItems,
      lokasiPenjemputan: parsedLokasi,
      jadwalPenjemputan,
      totalEstimasi,
      foto: fotoUrls
    });

    await newTransaksi.save();
    res.status(201).json({ success: true, message: 'Permintaan penjemputan berhasil diajukan', data: newTransaksi, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

exports.getListTransaksi = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let query = role === 'mitra' ? { mitraId: id } : { userId: id };
    if (role === 'admin') query = {}; // Admin bisa lihat semua

    const transaksiList = await Transaksi.find(query)
      .populate('userId', 'nama email noTelp')
      .populate('mitraId', 'namaUsaha email noTelp')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: transaksiList, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.getDetailTransaksi = async (req, res, next) => {
  try {
    const transaksi = await Transaksi.findById(req.params.id)
      .populate('userId', 'nama email noTelp alamat')
      .populate('mitraId', 'namaUsaha email noTelp alamatUsaha');
      
    if (!transaksi) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan', errors: [], statusCode: 404 });
    
    res.status(200).json({ success: true, data: transaksi, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, alasanBatal } = req.body;
    const { id, role } = req.user;

    const transaksi = await Transaksi.findById(req.params.id);
    if (!transaksi) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan', errors: [], statusCode: 404 });

    // Pengecekan akses dan logika status
    if (role === 'user') {
      if (transaksi.userId.toString() !== id) return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
      if (status !== 'dibatalkan') return res.status(400).json({ success: false, message: 'User hanya boleh membatalkan transaksi', errors: [], statusCode: 400 });
      if (transaksi.status !== 'pending') return res.status(400).json({ success: false, message: 'Transaksi tidak dapat dibatalkan lagi', errors: [], statusCode: 400 });
    } else if (role === 'mitra') {
      if (transaksi.mitraId.toString() !== id) return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
      const validMitraStatus = ['diterima', 'dijemput', 'selesai', 'dibatalkan'];
      if (!validMitraStatus.includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid', errors: [], statusCode: 400 });
    }

    transaksi.status = status;
    if (status === 'dibatalkan' && alasanBatal) {
      transaksi.alasanBatal = alasanBatal;
    }

    await transaksi.save();
    res.status(200).json({ success: true, message: `Status berhasil diubah menjadi ${status}`, data: transaksi, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.konfirmasiTransaksi = async (req, res, next) => {
  try {
    const { itemsData } = req.body; // Array of { itemId, beratAktual }
    const { id: mitraId } = req.user;

    const transaksi = await Transaksi.findById(req.params.id);
    if (!transaksi) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan', errors: [], statusCode: 404 });
    if (transaksi.mitraId.toString() !== mitraId) return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
    if (transaksi.status !== 'dijemput') return res.status(400).json({ success: false, message: 'Harus dijemput terlebih dahulu sebelum dikonfirmasi', errors: [], statusCode: 400 });

    let totalAktual = 0;
    
    // Parse itemsData if stringified
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

    // Increment Total Transaksi Mitra
    await Mitra.findByIdAndUpdate(mitraId, { $inc: { totalTransaksi: 1 } });

    res.status(200).json({ success: true, message: 'Konfirmasi final berhasil, transaksi selesai', data: transaksi, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};
