const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Mitra = require('../models/Mitra');
const { sendNotification } = require('../services/notificationService');

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  // Middleware Autentikasi untuk Socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded; // { id, role }
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`Socket terhubung: ${socket.id} (User: ${socket.user.id})`);

    // Otomatis join room personal berbasis User ID untuk private updates
    socket.join(socket.user.id);

    // Event: Masuk ke room chat spesifik (transaksi)
    socket.on('join_chat', ({ chatId }) => {
      socket.join(chatId);
      console.log(`User ${socket.user.id} bergabung ke chat room: ${chatId}`);
    });

    // Event: Mengirim pesan
    socket.on('send_message', async ({ chatId, content, type }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const senderId = socket.user.id;
        const senderRole = socket.user.role;

        const newMessage = {
          senderId,
          senderRole,
          content,
          type: type || 'text',
          timestamp: new Date(),
          isRead: false
        };

        chat.messages.push(newMessage);
        chat.lastMessage = type === 'text' ? content : `[${type}]`;
        chat.lastActivity = new Date();
        await chat.save();

        // Broadcast pesan ke seluruh orang di room chat tersebut
        io.to(chatId).emit('new_message', newMessage);

        // --- Logika Push Notification (Opsional) ---
        // Cari partisipan lawan bicara
        const lawanBicara = chat.participants.find(p => p.userId.toString() !== senderId);
        if (lawanBicara) {
          let recipient;
          if (lawanBicara.role === 'mitra') {
            recipient = await Mitra.findById(lawanBicara.userId).select('fcmToken');
          } else {
            recipient = await User.findById(lawanBicara.userId).select('fcmToken');
          }

          if (recipient && recipient.fcmToken) {
            sendNotification(recipient.fcmToken, {
              title: 'Pesan Baru',
              body: newMessage.content,
              data: { chatId: chatId.toString() }
            });
          }
        }
      } catch (error) {
        console.error("Error socket send_message:", error);
      }
    });

    // Event: Tandai pesan sudah dibaca
    socket.on('mark_read', async ({ chatId }) => {
      try {
        const userId = socket.user.id;
        
        // Broadcast ke semua di room bahwa si X sudah membaca
        io.to(chatId).emit('message_read', { chatId, userId });
        
        // Update DB
        await Chat.updateOne(
          { _id: chatId },
          { $set: { "messages.$[elem].isRead": true } },
          { arrayFilters: [{ "elem.senderId": { $ne: userId } }], multi: true }
        );
      } catch (error) {
        console.error("Error socket mark_read:", error);
      }
    });

    // Event: Indikator sedang mengetik
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(chatId).emit('user_typing', { chatId, userId: socket.user.id, isTyping });
    });

    // Event: Real-time update GPS kurir (Mitra)
    // TransaksiId disamakan dengan ChatId atau bisa dibuat room spesifik transaksiId
    socket.on('update_location', ({ transaksiId, lat, lng }) => {
      if (socket.user.role === 'mitra') {
        // Broadcast posisi ke room transaksiId
        // Pastikan User juga sudah join room transaksiId ini dari frontend
        socket.to(transaksiId).emit('mitra_location_updated', { transaksiId, lat, lng });
      }
    });

    // Event: Masuk ke room transaksi spesifik (untuk tracking map)
    socket.on('join_tracking', ({ transaksiId }) => {
      socket.join(transaksiId);
      console.log(`User ${socket.user.id} bergabung ke tracking room: ${transaksiId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket terputus: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
