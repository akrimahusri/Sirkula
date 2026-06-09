const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Mitra = require('../models/Mitra');

// Helper function untuk generate tokens
const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role || 'mitra' };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
  
  return { accessToken, refreshToken };
};

// Error formatting helper untuk express-validator
const formatValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array().map(err => ({ field: err.path, message: err.msg }));
  }
  return null;
};

// --- CONTROLLERS ---

exports.register = async (req, res, next) => {
  try {
    const validationErrors = formatValidationErrors(req);
    if (validationErrors) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: validationErrors, statusCode: 400 });
    }

    const { role, email, password, noTelp, nama, alamat, namaUsaha, alamatUsaha, lat, lng, alamatLengkap } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ email });
    const existingMitra = await Mitra.findOne({ email });
    if (existingUser || existingMitra) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar', errors: [], statusCode: 400 });
    }

    if (role === 'mitra') {
      const newMitra = new Mitra({
        namaUsaha: namaUsaha || nama,
        email,
        password,
        noTelp,
        alamatUsaha: alamatUsaha || alamat,
        isVerified: true,
        areaCoverage: {
          pusat: { lat: lat || 0, lng: lng || 0 }
        }
      });
      await newMitra.save();
      return res.status(201).json({ success: true, message: 'Registrasi mitra berhasil', statusCode: 201 });
    } else {
      const newUser = new User({
        nama,
        email,
        password,
        noTelp,
        alamat,
        role: role === 'admin' ? 'admin' : 'user',
        lokasi: { lat: lat || 0, lng: lng || 0, alamatLengkap: alamatLengkap || alamat }
      });
      await newUser.save();
      return res.status(201).json({ success: true, message: 'Registrasi user berhasil', statusCode: 201 });
    }
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const validationErrors = formatValidationErrors(req);
    if (validationErrors) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: validationErrors, statusCode: 400 });
    }

    const { email, password } = req.body;

    let account = await User.findOne({ email });
    let role = account ? account.role : null;

    if (!account) {
      account = await Mitra.findOne({ email });
      role = 'mitra';
    }

    if (!account) {
      return res.status(401).json({ success: false, message: 'Email atau password salah', errors: [], statusCode: 401 });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah', errors: [], statusCode: 401 });
    }

    const tokens = generateTokens(account);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        role,
        user: { id: account._id, email: account.email, nama: account.nama || account.namaUsaha, role }
      },
      statusCode: 200
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'mitra') {
      await Mitra.findByIdAndUpdate(userId, { fcmToken: '' });
    } else {
      await User.findByIdAndUpdate(userId, { fcmToken: '' });
    }

    res.status(200).json({ success: true, message: 'Logout berhasil', statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token dibutuhkan', errors: [], statusCode: 400 });
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'Refresh token tidak valid atau kadaluarsa', errors: [], statusCode: 401 });
      }

      let account = null;
      if (decoded.role === 'mitra') {
        account = await Mitra.findById(decoded.id);
      } else {
        account = await User.findById(decoded.id);
      }

      if (!account) {
        return res.status(401).json({ success: false, message: 'Akun tidak ditemukan', errors: [], statusCode: 401 });
      }

      const tokens = generateTokens(account);
      res.status(200).json({
        success: true,
        message: 'Token berhasil diperbarui',
        data: { token: tokens.accessToken, refreshToken: tokens.refreshToken },
        statusCode: 200
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let account = await User.findOne({ email });
    let isMitra = false;

    if (!account) {
      account = await Mitra.findOne({ email });
      isMitra = true;
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Email tidak ditemukan', errors: [], statusCode: 404 });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    account.otpCode = otpCode;
    account.otpExpiry = otpExpiry;
    await account.save({ validateBeforeSave: false });

    // Mock sending email
    console.log(`\n\n=== MOCK EMAIL SERVICE ===\nTo: ${email}\nSubject: Reset Password OTP\nOTP Code: ${otpCode}\nValid for 15 minutes.\n==========================\n\n`);

    res.status(200).json({ success: true, message: 'OTP telah dikirim ke email Anda', statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const validationErrors = formatValidationErrors(req);
    if (validationErrors) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: validationErrors, statusCode: 400 });
    }

    const { email, otp, newPassword } = req.body;
    let account = await User.findOne({ email, otpCode: otp });
    
    if (!account) {
      account = await Mitra.findOne({ email, otpCode: otp });
    }

    if (!account) {
      return res.status(400).json({ success: false, message: 'OTP tidak valid atau email salah', errors: [], statusCode: 400 });
    }

    if (account.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP telah kadaluarsa', errors: [], statusCode: 400 });
    }

    account.password = newPassword;
    account.otpCode = undefined;
    account.otpExpiry = undefined;
    await account.save();

    res.status(200).json({ success: true, message: 'Password berhasil direset', statusCode: 200 });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    let account;
    
    if (role === 'mitra') {
      account = await Mitra.findById(id).select('-password -otpCode -otpExpiry');
    } else {
      account = await User.findById(id).select('-password -otpCode -otpExpiry');
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan', errors: [], statusCode: 404 });
    }

    res.status(200).json({ success: true, message: 'Profil berhasil diambil', data: { user: { ...account.toObject(), role } }, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};
