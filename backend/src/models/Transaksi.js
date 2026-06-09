const mongoose = require('mongoose');

/**
 * @typedef {Object} TransaksiItem
 * @property {string} jenisSampah - Nama jenis sampah
 * @property {number} beratEstimasi - Estimasi berat dari pengguna (kg)
 * @property {number} beratAktual - Berat aktual setelah ditimbang mitra (kg)
 * @property {number} hargaPerKg - Harga per kilogram
 * @property {number} subtotal - Subtotal untuk item ini
 */

/**
 * @typedef {Object} LokasiPenjemputan
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} alamat - Alamat lengkap
 * @property {string} [catatan] - Catatan tambahan untuk kurir/mitra
 */

/**
 * @typedef {Object} Transaksi
 * @property {mongoose.Types.ObjectId} userId - Referensi ke User
 * @property {mongoose.Types.ObjectId} mitraId - Referensi ke Mitra
 * @property {TransaksiItem[]} items - Daftar sampah yang disetor
 * @property {'pending' | 'diterima' | 'dijemput' | 'selesai' | 'dibatalkan'} status - Status transaksi
 * @property {number} totalEstimasi - Total pendapatan estimasi (Rp)
 * @property {number} totalAktual - Total pendapatan aktual (Rp)
 * @property {LokasiPenjemputan} lokasiPenjemputan - Lokasi penjemputan sampah
 * @property {Date} jadwalPenjemputan - Waktu penjemputan yang disepakati
 * @property {string[]} foto - Array URL foto sampah
 * @property {mongoose.Types.ObjectId} [chatId] - Referensi ke Chat room terkait
 * @property {string} [alasanBatal] - Alasan jika dibatalkan
 * @property {Date} createdAt - Waktu pembuatan
 * @property {Date} updatedAt - Waktu pembaruan
 */

const transaksiSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mitraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mitra', required: true },
    items: [
      {
        jenisSampah: { type: String, required: true },
        beratEstimasi: { type: Number, required: true },
        beratAktual: { type: Number, default: 0 },
        hargaPerKg: { type: Number, required: true },
        subtotal: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'diterima', 'dijemput', 'selesai', 'dibatalkan'],
      default: 'pending',
    },
    totalEstimasi: { type: Number, required: true },
    totalAktual: { type: Number, default: 0 },
    lokasiPenjemputan: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      alamat: { type: String, required: true },
      catatan: { type: String, default: '' },
    },
    jadwalPenjemputan: { type: Date, required: true },
    foto: [{ type: String }],
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    alasanBatal: { type: String, default: '' },
    rating: { type: Number, default: null },
    ulasan: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes
transaksiSchema.index({ userId: 1, status: 1 });
transaksiSchema.index({ mitraId: 1, status: 1 });
transaksiSchema.index({ jadwalPenjemputan: 1 });

module.exports = mongoose.model('Transaksi', transaksiSchema);
