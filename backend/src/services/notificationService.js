const admin = require('firebase-admin');

// Inisialisasi Firebase Admin dengan Mock Fallback
let isFirebaseInitialized = false;

try {
  // Coba inisialisasi dari default environment credentials jika ada
  // Pastikan Anda memuat GOOGLE_APPLICATION_CREDENTIALS di .env yang menunjuk ke service_account.json
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    isFirebaseInitialized = true;
    console.log("Firebase Admin SDK berhasil diinisialisasi.");
  } else {
    console.warn("⚠️ GOOGLE_APPLICATION_CREDENTIALS tidak ditemukan. Mode Mocking Push Notification aktif.");
  }
} catch (error) {
  console.warn("⚠️ Gagal inisialisasi Firebase Admin:", error.message);
}

/**
 * Mengirim notifikasi tunggal ke satu FCM Token
 * @param {string} fcmToken 
 * @param {Object} payload { title, body, data }
 */
const sendNotification = async (fcmToken, { title, body, data }) => {
  if (!fcmToken) return;

  const message = {
    notification: { title, body },
    data: data || {},
    token: fcmToken
  };

  if (isFirebaseInitialized) {
    try {
      const response = await admin.messaging().send(message);
      console.log('Notifikasi terkirim:', response);
    } catch (error) {
      console.error('Error pengiriman notifikasi FCM:', error);
    }
  } else {
    console.log(`\n=== MOCK PUSH NOTIFICATION ===\nKepada (Token): ${fcmToken}\nJudul: ${title}\nPesan: ${body}\nData: ${JSON.stringify(data)}\n==============================\n`);
  }
};

/**
 * Mengirim notifikasi secara massal ke array FCM Token
 * @param {string[]} fcmTokens 
 * @param {Object} payload { title, body, data }
 */
const sendToMultiple = async (fcmTokens, { title, body, data }) => {
  if (!fcmTokens || fcmTokens.length === 0) return;

  const message = {
    notification: { title, body },
    data: data || {},
    tokens: fcmTokens
  };

  if (isFirebaseInitialized) {
    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('Notifikasi terkirim secara massal:', response.successCount);
    } catch (error) {
      console.error('Error pengiriman notifikasi massal:', error);
    }
  } else {
    console.log(`\n=== MOCK MULTICAST PUSH NOTIFICATION ===\nKepada (Tokens): ${fcmTokens.join(', ')}\nJudul: ${title}\nPesan: ${body}\n========================================\n`);
  }
};

module.exports = {
  sendNotification,
  sendToMultiple
};
