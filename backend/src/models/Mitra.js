const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * @typedef {Object} KatalogItem
 * @property {string} jenisSampah - Nama jenis sampah
 * @property {number} hargaPerKg - Harga per kilogram
 * @property {number} satuanMinimum - Minimal berat yang bisa disetor
 */

/**
 * @typedef {Object} LokasiPusat
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 */

/**
 * @typedef {Object} AreaCoverage
 * @property {number} radius - Radius jangkauan dalam km
 * @property {LokasiPusat} pusat - Titik tengah jangkauan
 */

/**
 * @typedef {Object} Mitra
 * @property {string} namaUsaha - Nama entitas usaha pengepul/mitra
 * @property {string} email - Email mitra
 * @property {string} password - Password mitra
 * @property {string} noTelp - Nomor telepon
 * @property {string} alamatUsaha - Alamat lengkap usaha
 * @property {string} [foto] - URL foto atau logo usaha
 * @property {string} deskripsi - Deskripsi layanan
 * @property {string} jamOperasional - Info jam buka-tutup
 * @property {KatalogItem[]} katalog - Daftar harga sampah yang diterima mitra
 * @property {AreaCoverage} areaCoverage - Informasi jangkauan layanan mitra
 * @property {number} rating - Rating performa
 * @property {number} totalTransaksi - Total transaksi yang berhasil
 * @property {boolean} isVerified - Status verifikasi admin
 * @property {string} dokumenLegalitas - URL dokumen izin usaha
 * @property {string} [fcmToken] - Token Firebase Cloud Messaging
 * @property {Date} createdAt - Waktu pembuatan
 * @property {Date} updatedAt - Waktu pembaruan
 */

const mitraSchema = new mongoose.Schema(
  {
    namaUsaha: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    noTelp: { type: String, required: true },
    alamatUsaha: { type: String, required: true },
    foto: { type: String, default: '' },
    deskripsi: { type: String, default: '' },
    jamOperasional: { type: String, default: '' },
    katalog: [
      {
        jenisSampah: { type: String, required: true },
        hargaPerKg: { type: Number, required: true },
        satuanMinimum: { type: Number, required: true },
      },
    ],
    areaCoverage: {
      radius: { type: Number, default: 5 },
      pusat: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    rating: { type: Number, default: 0 },
    totalTransaksi: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    dokumenLegalitas: { type: String, default: '' },
    fcmToken: { type: String, default: '' },
    otpCode: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
mitraSchema.index({ email: 1 });
mitraSchema.index({ 'areaCoverage.pusat.lat': 1, 'areaCoverage.pusat.lng': 1 });
mitraSchema.index({ isVerified: 1 });

// Pre-save hook untuk enkripsi password
mitraSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method untuk membandingkan password
mitraSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Mitra', mitraSchema);
