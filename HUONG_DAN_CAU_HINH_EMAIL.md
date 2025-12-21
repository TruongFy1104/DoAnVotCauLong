# HƯỚNG DẪN CẤU HÌNH EMAIL CHO CHỨC NĂNG QUÊN MẬT KHẨU

## 🔧 Cấu hình Email Service

Để chức năng "Quên mật khẩu" hoạt động, bạn cần cấu hình email trong file:
**`server/src/Common/emailService.js`**

### Bước 1: Tạo App Password cho Gmail

1. **Đăng nhập Gmail** của bạn
2. Vào **Google Account Settings** → **Security**
3. Bật **2-Step Verification** (bắt buộc)
4. Tìm **App passwords** (Mật khẩu ứng dụng)
5. Chọn **Other (Custom name)** → Nhập "Badminton Shop"
6. Click **Generate** → Copy mật khẩu 16 ký tự

### Bước 2: Cập nhật file emailService.js

Mở file `server/src/Common/emailService.js` và thay đổi:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',        // ← Thay bằng email của bạn
    pass: 'your-app-password'             // ← Thay bằng App Password (16 ký tự)
  }
});
```

Và cập nhật trong cả 2 hàm:
- `sendOTPEmail`: Dòng `from: '"Badminton Shop" <your-email@gmail.com>'`
- `sendPasswordChangedEmail`: Dòng `from: '"Badminton Shop" <your-email@gmail.com>'`

### Bước 3: Test chức năng

1. Khởi động server: `cd server && npm start`
2. Khởi động client: `cd client && npm start`
3. Vào trang login → Click "Quên mật khẩu?"
4. Nhập email đã đăng ký → Nhận OTP qua email
5. Nhập OTP và mật khẩu mới

---

## 📧 Hỗ trợ các Email Provider khác

### Outlook/Hotmail:
```javascript
service: 'hotmail'
// hoặc
host: 'smtp-mail.outlook.com',
port: 587
```

### Yahoo:
```javascript
service: 'yahoo'
```

### Custom SMTP:
```javascript
host: 'smtp.example.com',
port: 587,
secure: false, // true for 465, false for other ports
auth: {
  user: 'your-email@example.com',
  pass: 'your-password'
}
```

---

## 🔐 Lưu ý bảo mật

1. **KHÔNG commit** thông tin email/password lên Git
2. Nên sử dụng **biến môi trường** (.env file):

```javascript
// .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

// emailService.js
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
}
```

3. Thêm `.env` vào `.gitignore`

---

## ✨ Tính năng đã triển khai

### Backend:
- ✅ API gửi OTP: `POST /forgot-password/send-otp`
- ✅ API xác thực OTP: `POST /forgot-password/verify-otp`
- ✅ API reset password: `POST /forgot-password/reset`
- ✅ Gửi email OTP với template đẹp
- ✅ Gửi email thông báo đổi mật khẩu thành công
- ✅ OTP có hiệu lực 10 phút
- ✅ Giới hạn 5 lần nhập sai OTP

### Frontend:
- ✅ Trang Forgot Password với 3 bước
- ✅ Stepper hiển thị tiến trình
- ✅ Countdown timer cho OTP
- ✅ Validation form
- ✅ Responsive design

---

## 🚀 API Endpoints

### 1. Gửi OTP
```
POST http://localhost:3000/forgot-password/send-otp
Body: { "email": "user@example.com" }
```

### 2. Xác thực OTP
```
POST http://localhost:3000/forgot-password/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
```

### 3. Reset Password
```
POST http://localhost:3000/forgot-password/reset
Body: { 
  "email": "user@example.com", 
  "otp": "123456",
  "newPassword": "newpass123"
}
```

---

## 🐛 Troubleshooting

**Lỗi: "Invalid login"**
- Kiểm tra email/password đúng chưa
- Đảm bảo đã bật 2-Step Verification
- Sử dụng App Password, không phải mật khẩu Gmail thường

**Lỗi: "connect ECONNREFUSED"**
- Kiểm tra kết nối internet
- Kiểm tra firewall/antivirus

**Email không nhận được:**
- Kiểm tra thư mục Spam/Junk
- Đợi vài phút (có thể bị delay)
- Kiểm tra email có đúng trong database không

---

Chúc bạn thành công! 🎉
