const Mitra = require('../models/Mitra');
const { filterMitraByRadius } = require('../services/locationService');
const bcrypt = require('bcrypt');

exports.getAllMitra = async (req, res, next) => {
  try {
    const { rating, kategori } = req.query;
    let query = { isVerified: true };

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }
    if (kategori) {
      query['katalog.jenisSampah'] = { $regex: new RegExp(kategori, 'i') };
    }

    const mitraList = await Mitra.find(query).select('-password -otpCode -otpExpiry');
    res.status(200).json({ success: true, data: mitraList, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.getMitraById = async (req, res, next) => {
  try {
    const mitra = await Mitra.findById(req.params.id).select('-password -otpCode -otpExpiry');
    if (!mitra) return res.status(404).json({ success: false, message: 'Mitra tidak ditemukan', errors: [], statusCode: 404 });
    
    res.status(200).json({ success: true, data: mitra, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.getNearbyMitra = async (req, res, next) => {
  try {
    const { lat, lng, radius, kategori } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Koordinat (lat, lng) diperlukan', errors: [], statusCode: 400 });
    }

    let query = { isVerified: true };
    if (kategori) {
      query['katalog.jenisSampah'] = { $regex: new RegExp(kategori, 'i') };
    }

    const mitraList = await Mitra.find(query).select('-password -otpCode -otpExpiry');
    const nearby = filterMitraByRadius(mitraList, parseFloat(lat), parseFloat(lng), parseFloat(radius || 10));

    res.status(200).json({ success: true, data: nearby, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.createMitraAdmin = async (req, res, next) => {
  try {
    const { namaUsaha, email, password, noTelp, alamatUsaha, lat, lng } = req.body;
    
    const existingMitra = await Mitra.findOne({ email });
    if (existingMitra) return res.status(400).json({ success: false, message: 'Email sudah terdaftar', errors: [], statusCode: 400 });

    const newMitra = new Mitra({
      namaUsaha, email, password, noTelp, alamatUsaha,
      areaCoverage: { pusat: { lat: parseFloat(lat), lng: parseFloat(lng) } },
      isVerified: true // Admin buat otomatis terverifikasi
    });

    await newMitra.save();
    res.status(201).json({ success: true, message: 'Mitra berhasil didaftarkan oleh Admin', statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
    }

    const updates = req.body;
    // Cegah update password via endpoint ini
    delete updates.password;

    const updatedMitra = await Mitra.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password -otpCode -otpExpiry');
    if (!updatedMitra) return res.status(404).json({ success: false, message: 'Mitra tidak ditemukan', errors: [], statusCode: 404 });

    res.status(200).json({ success: true, message: 'Profil diperbarui', data: updatedMitra, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.updateKatalog = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
    }

    const { katalog } = req.body; // Array of { jenisSampah, hargaPerKg, satuanMinimum }
    if (!Array.isArray(katalog)) {
      return res.status(400).json({ success: false, message: 'Format katalog harus berupa array', errors: [], statusCode: 400 });
    }

    const updatedMitra = await Mitra.findByIdAndUpdate(req.params.id, { katalog }, { new: true }).select('katalog');
    res.status(200).json({ success: true, message: 'Katalog berhasil diperbarui', data: updatedMitra.katalog, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};
