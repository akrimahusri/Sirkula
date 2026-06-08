const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * @typedef {Object} UserLokasi
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} alamatLengkap - Alamat lengkap pengguna
 */

/**
 * @typedef {Object} User
 * @property {string} nama - Nama pengguna
 * @property {string} email - Email pengguna
 * @property {string} password - Password (hashed)
 * @property {string} noTelp - Nomor telepon pengguna
 * @property {string} alamat - Alamat umum pengguna
 * @property {string} [foto] - URL foto profil
 * @property {'user' | 'mitra' | 'admin'} role - Peran pengguna
 * @property {number} poin - Poin reward
 * @property {mongoose.Types.ObjectId[]} riwayatTransaksi - Referensi ke transaksi
 * @property {string} [fcmToken] - Token Firebase Cloud Messaging
 * @property {UserLokasi} lokasi - Detail koordinat lokasi pengguna
 * @property {boolean} isVerified - Status verifikasi akun
 * @property {Date} createdAt - Waktu pembuatan
 * @property {Date} updatedAt - Waktu pembaruan
 */

const userSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    noTelp: { type: String, required: true },
    alamat: { type: String, required: true },
    foto: { type: String, default: '' },
    role: { type: String, enum: ['user', 'mitra', 'admin'], default: 'user' },
    poin: { type: Number, default: 0 },
    riwayatTransaksi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaksi' }],
    fcmToken: { type: String, default: '' },
    lokasi: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      alamatLengkap: { type: String, required: true },
    },
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'lokasi.lat': 1, 'lokasi.lng': 1 });

// Pre-save hook untuk enkripsi password
userSchema.pre('save', async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
