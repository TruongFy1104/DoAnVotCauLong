const Account = require('../models/Account');
const { sendOTPEmail, sendPasswordChangedEmail } = require('../../Common/emailService');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Store OTP in memory (trong production nên dùng Redis)
const otpStore = new Map();

// Hàm tạo OTP 6 số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// API: Gửi OTP qua email
exports.sendOTP = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    if (!username) {
      return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập' });
    }

    // Tìm tài khoản theo CẢ email VÀ username
    const account = await Account.findOne({ 
      where: { 
        Email: email,
        Username: username 
      } 
    });

    if (!account) {
      return res.status(404).json({ 
        message: 'Không tìm thấy tài khoản với email và tên đăng nhập này' 
      });
    }

    // Tạo OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP có hiệu lực 10 phút

    // Lưu OTP vào store với key là email+username để tránh trùng
    const otpKey = `${email}:${username}`;
    otpStore.set(otpKey, {
      otp,
      expiry: otpExpiry,
      username: account.Username,
      email: email,
      attempts: 0
    });

    // Gửi email
    const emailResult = await sendOTPEmail(email, otp, account.Username);

    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Không thể gửi email. Vui lòng thử lại sau.',
        error: emailResult.error 
      });
    }

    console.log(`OTP sent to ${email} for user ${username}: ${otp}`); // Debug - xóa dòng này trong production

    res.json({ 
      message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      email: email,
      username: username
    });

  } catch (error) {
    console.error('Error in sendOTP:', error);
    res.status(500).json({ 
      message: 'Đã xảy ra lỗi khi gửi OTP',
      error: error.message 
    });
  }
};

// API: Xác thực OTP và đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { email, username, otp, newPassword } = req.body;

    if (!email || !username || !otp || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // Kiểm tra OTP có tồn tại không (dùng key email:username)
    const otpKey = `${email}:${username}`;
    const otpData = otpStore.get(otpKey);

    if (!otpData) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    // Kiểm tra số lần thử
    if (otpData.attempts >= 5) {
      otpStore.delete(otpKey);
      return res.status(429).json({ message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu OTP mới.' });
    }

    // Kiểm tra OTP đã hết hạn chưa
    if (Date.now() > otpData.expiry) {
      otpStore.delete(otpKey);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    // Kiểm tra OTP có đúng không
    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      return res.status(400).json({ 
        message: `Mã OTP không đúng. Bạn còn ${5 - otpData.attempts} lần thử.` 
      });
    }

    // Kiểm tra độ dài mật khẩu
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Tìm tài khoản theo email VÀ username
    const account = await Account.findOne({ 
      where: { 
        Email: email,
        Username: username 
      } 
    });

    if (!account) {
      otpStore.delete(otpKey);
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    console.log('=== DEBUG RESET PASSWORD ===');
    console.log('Username:', account.Username);
    console.log('Email:', account.Email);
    console.log('Old Password Hash:', account.Password);
    console.log('New Password (plain):', newPassword);

    // Hash mật khẩu mới với bcrypt (giống như khi đăng ký)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('New Password Hash:', hashedPassword);

    // Cập nhật mật khẩu
    account.Password = hashedPassword;
    await account.save();
    
    console.log('Password updated in database');
    
    // Test verify ngay
    const testVerify = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Test verify result:', testVerify);
    console.log('=== END DEBUG ===');

    // Xóa OTP khỏi store
    otpStore.delete(otpKey);

    // Gửi email thông báo đổi mật khẩu thành công (bất đồng bộ - không đợi)
    sendPasswordChangedEmail(email, account.Username)
      .catch(err => console.error('Error sending password changed email:', err));

    res.json({ 
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.',
      success: true
    });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ 
      message: 'Đã xảy ra lỗi khi đặt lại mật khẩu',
      error: error.message 
    });
  }
};

// API: Kiểm tra OTP (tùy chọn - để tách riêng bước verify OTP)
exports.verifyOTP = async (req, res) => {
  try {
    const { email, username, otp } = req.body;

    if (!email || !username || !otp) {
      return res.status(400).json({ message: 'Vui lòng nhập email, tên đăng nhập và OTP' });
    }

    const otpKey = `${email}:${username}`;
    const otpData = otpStore.get(otpKey);

    if (!otpData) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    if (otpData.attempts >= 5) {
      otpStore.delete(otpKey);
      return res.status(429).json({ message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu OTP mới.' });
    }

    if (Date.now() > otpData.expiry) {
      otpStore.delete(otpKey);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      return res.status(400).json({ 
        message: `Mã OTP không đúng. Bạn còn ${5 - otpData.attempts} lần thử.` 
      });
    }

    res.json({ 
      message: 'Xác thực OTP thành công',
      success: true 
    });

  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ 
      message: 'Đã xảy ra lỗi khi xác thực OTP',
      error: error.message 
    });
  }
};
