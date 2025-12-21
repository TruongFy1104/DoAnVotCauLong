const nodemailer = require('nodemailer');

// Cấu hình email transporter
// Bạn cần thay đổi thông tin email của mình tại đây
const transporter = nodemailer.createTransport({
  service: 'gmail', // Hoặc 'outlook', 'yahoo', etc.
  auth: {
    user: 'ngfitruong1104@gmail.com', // Thay bằng email của bạn
    pass: 'lquc xffd htjk gksk'     // Thay bằng App Password (không phải mật khẩu thường)
  }
});

// Hàm gửi OTP qua email
const sendOTPEmail = async (email, otp, username) => {
  try {
    const mailOptions = {
      from: '"NPT Badminton " <ngfitruong1104@gmail.com>', // Thay bằng email của bạn
      to: email,
      subject: 'Mã OTP khôi phục mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50; text-align: center;">🔐 Khôi phục mật khẩu</h2>
          
          <p>Xin chào <strong>${username}</strong>,</p>
          
          <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Mã OTP của bạn là:</p>
            <h1 style="color: #119ddeff; font-size: 36px; margin: 10px 0; letter-spacing: 5px;">${otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #999;">Mã này có hiệu lực trong 10 phút</p>
          </div>
          
          <p style="color: #ff6b6b; font-weight: 600;">⚠️ Lưu ý bảo mật:</p>
          <ul style="color: #666;">
            <li>Không chia sẻ mã OTP này với bất kỳ ai</li>
            <li>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này</li>
            <li>Liên hệ với chúng tôi ngay nếu bạn nghi ngờ tài khoản bị xâm phạm</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Email này được gửi tự động, vui lòng không trả lời.<br>
            © 2025 Badminton Shop. All rights reserved.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Hàm gửi email xác nhận đổi mật khẩu thành công
const sendPasswordChangedEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: '"Badminton Shop" <your-email@gmail.com>',
      to: email,
      subject: 'Mật khẩu đã được thay đổi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4CAF50; text-align: center;">✅ Mật khẩu đã được thay đổi</h2>
          
          <p>Xin chào <strong>${username}</strong>,</p>
          
          <p>Mật khẩu cho tài khoản của bạn đã được thay đổi thành công vào lúc <strong>${new Date().toLocaleString('vi-VN')}</strong>.</p>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #1197ebff; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32;">
              ✓ Bạn có thể đăng nhập ngay bây giờ với mật khẩu mới.
            </p>
          </div>
          
          <p style="color: #ff6b6b; font-weight: 600;">⚠️ Nếu bạn không thực hiện thay đổi này:</p>
          <p style="color: #666;">
            Vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            © 2025 NPT Badminton . All rights reserved.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordChangedEmail
};
