const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/app');
const User = require('../src/models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    // Gunakan database test terpisah
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/sirkula_test';
    // Kita cek koneksi yg sudah ada dari app.js, karena app.js auto-connect ke db berdasarkan URI
    // Tapi karena Mongoose.connect dipanggil di app.js, kita bisa biarkan atau kita timpakan URI-nya.
    // Untuk amannya, kita kosongkan data user saja
    await User.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  const testUser = {
    nama: 'Test User',
    email: 'test@mail.com',
    password: 'Password123',
    noTelp: '081234567890',
    role: 'user'
  };

  describe('POST /api/auth/register', () => {
    it('berhasil register pengguna baru', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.email).toEqual(testUser.email);
    });

    it('gagal register jika email sudah digunakan (duplikat)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Email sudah terdaftar/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('berhasil login dengan kredensial valid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data).toHaveProperty('token');
    });

    it('gagal jika password salah — return 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toMatch(/Kredensial tidak valid/i);
    });

    it('gagal jika email tidak terdaftar — return 401/404', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@mail.com', password: 'Password123' });
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('gagal akses profil jika tanpa token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
    });
  });
});
