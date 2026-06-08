require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const connectDB = require('./config/db');
const initializeSocket = require('./socket/socket');

const app = express();
const server = http.createServer(app);

// Inisialisasi Socket.IO
const io = initializeSocket(server);

// Middleware Keamanan
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Mengizinkan frontend lokal
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Limit setiap IP hingga 100 requests per 15 menit
  message: { success: false, message: "Terlalu banyak permintaan dari IP ini, coba lagi nanti.", statusCode: 429 }
});
app.use(limiter);

// Koneksi ke Database
connectDB();

// Rute Dasar
app.get('/', (req, res) => {
  res.send('API Sirkula berjalan...');
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Marketplace & Transaksi Routes
const katalogRoutes = require('./routes/katalog');
const mitraRoutes = require('./routes/mitra');
const transaksiRoutes = require('./routes/transaksi');
const chatRoutes = require('./routes/chat');
const pickupRoutes = require('./routes/pickup');

app.use('/api/katalog', katalogRoutes);
app.use('/api/mitra', mitraRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pickup', pickupRoutes);

// Middleware Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
  });
}

module.exports = { app, server };




