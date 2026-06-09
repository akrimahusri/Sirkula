require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Update semua mitra yang memiliki lat === 0 (nilai default) ke lokasi sekitar Aceh
  const result = await mongoose.connection.db.collection('mitras').updateMany(
    { "areaCoverage.pusat.lat": 0 }, 
    { $set: { 
        "areaCoverage.pusat.lat": 5.56841, 
        "areaCoverage.pusat.lng": 95.36881 
      } 
    }
  );
  
  console.log('Moved ' + result.modifiedCount + ' mitras to Aceh');
  process.exit(0);
}
run();
