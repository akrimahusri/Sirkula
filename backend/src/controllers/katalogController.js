const KatalogSampah = require('../models/KatalogSampah');

// Ambil semua master data katalog
exports.getAllKatalog = async (req, res, next) => {
  try {
    const katalog = await KatalogSampah.find({ isActive: true }).sort({ nama: 1 });
    res.status(200).json({ success: true, data: katalog, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

// Ambil katalog spesifik berdasarkan kategori
exports.getKatalogByKategori = async (req, res, next) => {
  try {
    const { kategori } = req.params;
    const katalog = await KatalogSampah.find({ kategori, isActive: true });
    res.status(200).json({ success: true, data: katalog, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

// Tambah jenis sampah baru (Khusus Admin)
exports.createKatalog = async (req, res, next) => {
  try {
    const { nama, kategori, icon, deskripsi, hargaRataRata, satuan, tips } = req.body;
    
    const newKatalog = new KatalogSampah({
      nama, kategori, icon, deskripsi, hargaRataRata, satuan, tips
    });
    
    await newKatalog.save();
    
    res.status(201).json({ success: true, message: 'Data katalog berhasil ditambahkan', data: newKatalog, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};
