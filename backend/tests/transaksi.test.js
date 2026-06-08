const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/app');
const User = require('../src/models/User');
const Mitra = require('../src/models/Mitra');
const Transaksi = require('../src/models/Transaksi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Transaksi API', () => {
  let userToken, mitraToken, userId, mitraId, transaksiId;

  beforeAll(async () => {
    // Kosongkan DB test
    await User.deleteMany();
    await Mitra.deleteMany();
    await Transaksi.deleteMany();

    const pass = await bcrypt.hash('pass123', 10);
    
    // Buat User
    const user = await User.create({ nama: 'U1', email: 'u1@mail.com', password: pass, role: 'user', noTelp: '111', isVerified: true });
    userId = user._id;
    userToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // Buat Mitra
    const mitra = await Mitra.create({ namaUsaha: 'M1', email: 'm1@mail.com', password: pass, noTelp: '222', isVerified: true });
    mitraId = mitra._id;
    mitraToken = jwt.sign({ id: mitra._id, role: 'mitra' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/transaksi', () => {
    it('berhasil membuat transaksi penjemputan valid (User)', async () => {
      const res = await request(app)
        .post('/api/transaksi')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mitraId: mitraId,
          items: [{ jenisSampah: 'plastik', beratEstimasi: 5 }],
          lokasiPenjemputan: { lat: 0, lng: 0, address: 'Test' },
          jadwalPenjemputan: new Date().toISOString()
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBeTruthy();
      transaksiId = res.body.data._id;
    });

    it('gagal membuat transaksi jika role adalah mitra (hanya user yg boleh)', async () => {
      const res = await request(app)
        .post('/api/transaksi')
        .set('Authorization', `Bearer ${mitraToken}`)
        .send({ mitraId: mitraId, items: [] });
      
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PATCH /api/transaksi/:id/status', () => {
    it('berhasil update status ke diterima (oleh Mitra)', async () => {
      const res = await request(app)
        .patch(`/api/transaksi/${transaksiId}/status`)
        .set('Authorization', `Bearer ${mitraToken}`)
        .send({ status: 'diterima' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('diterima');
    });

    it('gagal update status oleh User yang tidak punya hak untuk status diterima', async () => {
      // User tidak boleh set status ke 'diterima'
      const res = await request(app)
        .patch(`/api/transaksi/${transaksiId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'diterima' });

      expect(res.statusCode).toEqual(403);
    });
  });
});
