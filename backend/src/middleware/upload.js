const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary
// Pastikan variabel CLOUDINARY_URL tersedia di .env
// Format: cloudinary://my_key:my_secret@my_cloud_name
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    // konfigurasi akan dimuat otomatis dari process.env.CLOUDINARY_URL
  });
} else {
  // Fallback / Mock Warning
  console.warn("⚠️ CLOUDINARY_URL tidak ditemukan. Modul upload mungkin akan gagal di production.");
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sirkula/transaksi', // Folder di Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

// Middleware multer khusus untuk foto sampah (maksimal 5 foto, 5MB per file)
const uploadPhotos = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // maksimal 5 file dalam 1 request
  }
});

module.exports = { uploadPhotos };
