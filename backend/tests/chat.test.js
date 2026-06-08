const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/app');
const User = require('../src/models/User');
const Mitra = require('../src/models/Mitra');
const Transaksi = require('../src/models/Transaksi');
const Chat = require('../src/models/Chat');
const jwt = require('jsonwebtoken');

describe('Chat API', () => {
  let userToken, userId, mitraId, transaksiId, chatId;

  beforeAll(async () => {
    await User.deleteMany();
    await Mitra.deleteMany();
    await Transaksi.deleteMany();
    await Chat.deleteMany();

    const user = await User.create({ nama: 'UChat', email: 'uchat@mail.com', password: 'x', role: 'user' });
    const mitra = await Mitra.create({ namaUsaha: 'MChat', email: 'mchat@mail.com', password: 'x' });
    userId = user._id;
    mitraId = mitra._id;
    userToken = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET || 'secret');

    const trx = await Transaksi.create({ userId, mitraId, items: [], status: 'diterima' });
    transaksiId = trx._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/chat/init', () => {
    it('berhasil inisiasi room chat untuk transaksi', async () => {
      const res = await request(app)
        .post('/api/chat/init')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ transaksiId });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.participants).toHaveLength(2);
      chatId = res.body.data._id;
    });

    it('mengembalikan room chat yang sudah ada jika di-init ulang', async () => {
      const res = await request(app)
        .post('/api/chat/init')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ transaksiId });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data._id).toEqual(chatId);
    });
  });
});
