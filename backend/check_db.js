const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/sirkula');
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  const mitras = await mongoose.connection.db.collection('mitras').find({}).toArray();
  console.log('--- USERS ---');
  console.log(users.map(u => ({ email: u.email, role: u.role, nama: u.nama })));
  console.log('--- MITRAS ---');
  console.log(mitras.map(m => ({ email: m.email, namaUsaha: m.namaUsaha, isVerified: m.isVerified })));
  process.exit(0);
}
run();
