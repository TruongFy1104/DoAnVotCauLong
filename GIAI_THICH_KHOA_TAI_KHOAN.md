# GIẢI THÍCH Cơ CHẾ KHÓA TÀI KHOẢN

## Câu hỏi: Sao khóa tài khoản thì người dùng không đăng nhập được vậy cũng không thể xem trang web như khách không có tài khoản à?

## Trả lời:

### ✅ NGƯỜI DÙNG BỊ KHÓA VẪN CÓ THỂ XEM WEB NHƯ KHÁCH

Hệ thống được thiết kế để:

1. **Người dùng bị khóa VẪN có thể:**
   - ✅ Truy cập trang web
   - ✅ Xem các trang công khai (không yêu cầu đăng nhập)
   - ✅ Xem sản phẩm, bài viết công khai
   - ✅ Đọc thông tin như một khách vãng lai

2. **Người dùng bị khóa KHÔNG thể:**
   - ❌ Đăng nhập vào hệ thống
   - ❌ Mua hàng, đặt sân
   - ❌ Bình luận, đăng bài
   - ❌ Sử dụng các tính năng yêu cầu đăng nhập

---

## CƠ CHẾ HOẠT ĐỘNG

### 1. Kiểm tra khi ĐĂNG NHẬP
- File: `LoginController.js`
- Khi người dùng cố gắng đăng nhập, hệ thống kiểm tra `IsBanned`
- Nếu `IsBanned = 1`: Từ chối đăng nhập, hiển thị thông báo:
  ```
  "Tài khoản của bạn đã bị khóa. Bạn không thể đăng nhập và sử dụng các tính năng yêu cầu đăng nhập."
  
  Bạn vẫn có thể xem trang web như khách.
  
  📧 Email: ngfitruong1104@gmail.com
  📞 Điện thoại: 0343439444
  ```

### 2. Kiểm tra khi SỬ DỤNG TÍNH NĂNG
- File: `Authentication.js` (middleware)
- Chỉ áp dụng cho các route yêu cầu đăng nhập (protected routes)
- Các trang công khai KHÔNG đi qua middleware này
- Nếu user đã đăng nhập trước đó mà bị khóa sau: Session bị vô hiệu hóa

### 3. Trang công khai (Không cần đăng nhập)
- Các trang này KHÔNG kiểm tra IsBanned
- Ví dụ:
  - `/` - Trang chủ
  - `/products` - Danh sách sản phẩm
  - `/about` - Giới thiệu
  - `/login` - Đăng nhập
  - `/register` - Đăng ký

### 4. Trang riêng tư (Yêu cầu đăng nhập)
- Các trang này SẼ kiểm tra IsBanned qua middleware
- Ví dụ:
  - `/cart` - Giỏ hàng
  - `/checkout` - Thanh toán
  - `/profile` - Hồ sơ cá nhân
  - `/booking` - Đặt sân

---

## VÍ DỤ THỰC TẾ

### Trường hợp 1: Người dùng chưa đăng nhập (Khách)
```
Người dùng A chưa đăng nhập
→ Vào trang web
→ Xem sản phẩm ✅
→ Xem bài viết ✅
→ Muốn mua hàng → Yêu cầu đăng nhập
```

### Trường hợp 2: Người dùng bị khóa tài khoản
```
Người dùng B bị khóa tài khoản (IsBanned = 1)
→ Vào trang web
→ Xem sản phẩm ✅ (như khách)
→ Xem bài viết ✅ (như khách)
→ Cố gắng đăng nhập → BỊ TỪ CHỐI ❌
→ Vẫn có thể xem web như khách ✅
```

### Trường hợp 3: Người dùng đăng nhập bình thường
```
Người dùng C có tài khoản bình thường (IsBanned = 0)
→ Vào trang web
→ Đăng nhập thành công ✅
→ Mua hàng ✅
→ Đặt sân ✅
→ Bình luận ✅
```

---

## LỢI ÍCH CỦA CƠ CHẾ NÀY

1. **Công bằng:** Người dùng bị khóa vẫn có thể xem thông tin công khai
2. **Linh hoạt:** Không cần tạo tài khoản mới để xem web
3. **Bảo mật:** Ngăn chặn hành vi xấu nhưng không cấm hoàn toàn
4. **UX tốt:** Người dùng biết rõ tại sao không đăng nhập được và làm gì tiếp theo

---

## CODE IMPLEMENTATION

### Backend - LoginController.js
```javascript
if (user.IsBanned === 1) {
  return res.status(403).json({ 
    message: 'Tài khoản của bạn đã bị khóa. Bạn không thể đăng nhập...',
    canBrowse: true,  // ← Cờ cho biết vẫn xem web được
    contactInfo: {...}
  });
}
```

### Backend - Authentication.js (Middleware)
```javascript
// CHỈ áp dụng cho protected routes
const authenticateJWT = async (req, res, next) => {
  // Kiểm tra token
  // Kiểm tra IsBanned
  // Nếu banned → trả lỗi
}

// Public routes KHÔNG dùng middleware này
```

### Frontend - Routes
```javascript
// Public routes - KHÔNG cần authentication
<Route path="/" element={<HomePage />} />
<Route path="/products" element={<Products />} />

// Protected routes - CẦN authentication
<Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
```

---

## KẾT LUẬN

**Khóa tài khoản ≠ Cấm truy cập website**

- Khóa tài khoản = Không cho đăng nhập + Không dùng tính năng cá nhân
- Người dùng bị khóa vẫn xem web được như khách vãng lai
- Đây là cách tiếp cận chuẩn trong các hệ thống web hiện đại (Facebook, Twitter, v.v.)

---

**Tóm lại:** Người dùng bị khóa tài khoản vẫn có thể xem trang web như bình thường, chỉ không thể đăng nhập và sử dụng các tính năng yêu cầu xác thực.
