const mongoose = require('mongoose');

/**
 * @typedef {Object} ChatParticipant
 * @property {mongoose.Types.ObjectId} userId - ID pengguna atau mitra
 * @property {'user' | 'mitra'} role - Peran partisipan dalam transaksi ini
 */

/**
 * @typedef {Object} ChatMessage
 * @property {mongoose.Types.ObjectId} senderId - ID pengirim pesan
 * @property {'user' | 'mitra'} senderRole - Peran pengirim
 * @property {string} content - Isi pesan (teks atau URL)
 * @property {'text' | 'gambar' | 'lokasi'} type - Tipe pesan
 * @property {Date} timestamp - Waktu pesan dikirim
 * @property {boolean} isRead - Status pesan sudah dibaca atau belum
 */

/**
 * @typedef {Object} Chat
 * @property {mongoose.Types.ObjectId} transaksiId - Referensi ke Transaksi terkait
 * @property {ChatParticipant[]} participants - Partisipan chat
 * @property {ChatMessage[]} messages - Riwayat pesan
 * @property {string} lastMessage - Pesan terakhir untuk preview
 * @property {Date} lastActivity - Waktu aktivitas terakhir
 */

const chatSchema = new mongoose.Schema(
  {
    transaksiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaksi', required: true },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        role: { type: String, enum: ['user', 'mitra'], required: true },
      },
    ],
    messages: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
        senderRole: { type: String, enum: ['user', 'mitra'], required: true },
        content: { type: String, required: true },
        type: { type: String, enum: ['text', 'gambar', 'lokasi'], default: 'text' },
        timestamp: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
      },
    ],
    lastMessage: { type: String, default: '' },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
chatSchema.index({ transaksiId: 1 });
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Chat', chatSchema);
