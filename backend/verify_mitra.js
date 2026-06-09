require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await mongoose.connection.db.collection('mitras').updateMany({}, { $set: { isVerified: true } });
  console.log('Updated ' + result.modifiedCount + ' mitras');
  process.exit(0);
}
run();
