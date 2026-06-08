const mongoose = require('mongoose');

/**
 * @typedef {Object} KatalogSampah
 * @property {string} nama - Nama sampah (misal: Botol Plastik PET)
 * @property {'plastik' | 'kertas' | 'logam' | 'elektronik' | 'kaca' | 'organik'} kategori - Kategori sampah
 * @property {string} [icon] - URL icon representasi sampah
 * @property {string} deskripsi - Penjelasan jenis sampah
 * @property {number} hargaRataRata - Harga indikasi rata-rata pasar per satuan (Rp)
 * @property {string} satuan - Satuan berat (misal: 'kg', 'pcs')
 * @property {string[]} tips - Tips memilah atau menangani sampah ini
 * @property {boolean} isActive - Status aktif di katalog sistem
 * @property {Date} createdAt - Waktu pembuatan
 * @property {Date} updatedAt - Waktu pembaruan
 */

const katalogSampahSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    kategori: {
      type: String,
      enum: ['plastik', 'kertas', 'logam', 'elektronik', 'kaca', 'organik'],
      required: true,
    },
    icon: { type: String, default: '' },
    deskripsi: { type: String, default: '' },
    hargaRataRata: { type: Number, required: true },
    satuan: { type: String, default: 'kg' },
    tips: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
katalogSampahSchema.index({ kategori: 1 });
katalogSampahSchema.index({ isActive: 1 });
katalogSampahSchema.index({ nama: 'text' }); // Untuk pencarian nama

module.exports = mongoose.model('KatalogSampah', katalogSampahSchema);
