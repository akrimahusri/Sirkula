require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Impor Model
const User = require('../src/models/User');
const Mitra = require('../src/models/Mitra');
const Transaksi = require('../src/models/Transaksi');
const Chat = require('../src/models/Chat');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sirkula';

const seedDatabase = async () => {
  try {
    console.log('Menyambungkan ke MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Terhubung ke database. Memulai Seeding...');

    // Hapus data lama
    await User.deleteMany();
    await Mitra.deleteMany();
    await Transaksi.deleteMany();
    await Chat.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Buat User Masyarakat (Banda Aceh)
    const usersData = [
      { nama: 'Ahmad Faisal', email: 'ahmad@gmail.com', noTelp: '081122334455', alamat: 'Ulee Kareng, Banda Aceh', lokasi: { lat: 5.5649, lng: 95.3400, alamatLengkap: 'Jl. T. Nyak Arief, Ulee Kareng' } },
      { nama: 'Cut Nyak Dien', email: 'cut@gmail.com', noTelp: '081233445566', alamat: 'Syiah Kuala, Banda Aceh', lokasi: { lat: 5.5862, lng: 95.3340, alamatLengkap: 'Darussalam, Syiah Kuala' } },
      { nama: 'Teuku Ryan', email: 'teuku@gmail.com', noTelp: '081344556677', alamat: 'Baiturrahman, Banda Aceh', lokasi: { lat: 5.5483, lng: 95.3188, alamatLengkap: 'Kopelma Darussalam' } },
      { nama: 'Siti Aminah', email: 'siti@gmail.com', noTelp: '081455667788', alamat: 'Kuta Alam, Banda Aceh', lokasi: { lat: 5.5681, lng: 95.3256, alamatLengkap: 'Lampulo, Kuta Alam' } },
      { nama: 'Rizki Akbar', email: 'rizki@gmail.com', noTelp: '081566778899', alamat: 'Meuraxa, Banda Aceh', lokasi: { lat: 5.5487, lng: 95.2934, alamatLengkap: 'Ulee Lheue, Meuraxa' } },
    ];

    const users = [];
    for (const u of usersData) {
      const user = await User.create({ ...u, password: hashedPassword, role: 'user', isVerified: true });
      users.push(user);
    }

    // 2. Buat Admin
    const admin = await User.create({
      nama: 'Admin Sirkula', email: 'admin@sirkula.id', password: hashedPassword, role: 'admin', noTelp: '080011112222'
    });

    // 3. Buat Mitra (Pengepul)
    const mitraData = [
      {
        namaUsaha: 'Sirkula Hub Kuta Alam', email: 'mitra1@gmail.com', noTelp: '082100001111', alamatUsaha: 'Jl. T. Hasan Dek, Kuta Alam',
        isVerified: true, rating: 4.8, areaCoverage: { radius: 10, pusat: { lat: 5.5600, lng: 95.3300 } },
        katalog: [
          { jenisSampah: 'plastik', hargaPerKg: 3000, satuanMinimum: 1 },
          { jenisSampah: 'kertas', hargaPerKg: 1500, satuanMinimum: 2 }
        ]
      },
      {
        namaUsaha: 'Berkah Daur Ulang', email: 'mitra2@gmail.com', noTelp: '082100002222', alamatUsaha: 'Jl. Wedana, Banda Raya',
        isVerified: true, rating: 4.5, areaCoverage: { radius: 15, pusat: { lat: 5.5300, lng: 95.3200 } },
        katalog: [
          { jenisSampah: 'logam', hargaPerKg: 10000, satuanMinimum: 1 },
          { jenisSampah: 'plastik', hargaPerKg: 2500, satuanMinimum: 3 }
        ]
      },
      {
        namaUsaha: 'Pengepul Pak Din', email: 'mitra3@gmail.com', noTelp: '082100003333', alamatUsaha: 'Jl. Mata Ie, Darul Imarah',
        isVerified: false, rating: 0, areaCoverage: { radius: 5, pusat: { lat: 5.5100, lng: 95.3100 } },
        katalog: []
      }
    ];

    const mitras = [];
    for (const m of mitraData) {
      const mitra = await Mitra.create({ ...m, password: hashedPassword });
      mitras.push(mitra);
    }

    // 4. Buat Transaksi & Chat
    const statuses = ['pending', 'diterima', 'dijemput', 'selesai', 'dibatalkan'];
    
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const mitra = mitras[i % 2]; // Hanya ambil mitra 1 atau 2 yg verified
      const status = statuses[i % statuses.length];

      const transaksi = await Transaksi.create({
        userId: user._id,
        mitraId: mitra._id,
        items: [{ jenisSampah: 'plastik', beratEstimasi: 5, hargaEstimasi: 15000 }],
        totalEstimasi: 15000,
        totalAktual: status === 'selesai' ? 15000 : 0,
        lokasiPenjemputan: user.lokasi,
        jadwalPenjemputan: new Date(),
        status: status
      });

      // Buat History Chat untuk transaksi yg sdh lewat status pending
      if (status !== 'pending' && status !== 'dibatalkan') {
        const chat = await Chat.create({
          transaksiId: transaksi._id,
          participants: [user._id, mitra._id],
          messages: [
            { senderId: user._id, senderModel: 'User', content: 'Halo pak, saya mau jual botol plastik 5kg.', timestamp: new Date() },
            { senderId: mitra._id, senderModel: 'Mitra', content: 'Siap bu, nanti sore saya jemput ya.', timestamp: new Date() }
          ]
        });
        
        // Update chat ID ke transaksi
        transaksi.chatId = chat._id;
        await transaksi.save();
      }
    }

    console.log('Seeding selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
