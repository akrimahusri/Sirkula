const Chat = require('../models/Chat');
const Transaksi = require('../models/Transaksi');

exports.getListChat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Cari chat di mana pengguna (baik user atau mitra) adalah partisipan
    const chats = await Chat.find({ 'participants.userId': userId })
      .populate('transaksiId', 'status totalEstimasi createdAt')
      .sort({ lastActivity: -1 });

    res.status(200).json({ success: true, data: chats, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat tidak ditemukan', errors: [], statusCode: 404 });

    // Pastikan user adalah partisipan
    const isParticipant = chat.participants.some(p => p.userId.toString() === req.user.id);
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak', errors: [], statusCode: 403 });
    }

    // Pagination manual pada array messages (karena array tersimpan langsung di document)
    // Untuk performa pada production skala besar, direkomendasikan memisah schema Message.
    const startIndex = chat.messages.length - (page * limit);
    const endIndex = chat.messages.length - ((page - 1) * limit);
    
    let paginatedMessages = [];
    if (startIndex < chat.messages.length && endIndex > 0) {
       paginatedMessages = chat.messages.slice(Math.max(0, startIndex), endIndex);
    }

    res.status(200).json({
      success: true,
      data: {
        chatId: chat._id,
        transaksiId: chat.transaksiId,
        participants: chat.participants,
        messages: paginatedMessages,
        hasMore: startIndex > 0
      },
      statusCode: 200
    });
  } catch (error) {
    next(error);
  }
};

exports.initChat = async (req, res, next) => {
  try {
    const { transaksiId } = req.body;
    const transaksi = await Transaksi.findById(transaksiId);

    if (!transaksi) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan', errors: [], statusCode: 404 });
    }

    // Cek apakah chat sudah ada
    let chat = await Chat.findOne({ transaksiId });
    if (chat) {
      return res.status(200).json({ success: true, message: 'Chat sudah ada', data: chat, statusCode: 200 });
    }

    // Buat chat baru
    chat = new Chat({
      transaksiId,
      participants: [
        { userId: transaksi.userId, role: 'user' },
        { userId: transaksi.mitraId, role: 'mitra' }
      ]
    });
    await chat.save();

    // Update referensi chat di transaksi
    transaksi.chatId = chat._id;
    await transaksi.save();

    res.status(201).json({ success: true, message: 'Sesi chat dimulai', data: chat, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};
