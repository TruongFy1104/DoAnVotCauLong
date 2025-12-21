const jwt = require("jsonwebtoken");
const Account = require("../app/models/Account");

const SECRET_KEY = "saddasdasadsasdadsas"; 
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; 
  if (!token) {
    return res.status(403).json({ message: "Token không được cung cấp" });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Kiểm tra tài khoản có bị khóa không
    const user = await Account.findOne({ where: { AccountId: decoded.userId } });
    
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }
    
    if (user.IsBanned === 1) {
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị khóa. Bạn không thể sử dụng các tính năng yêu cầu đăng nhập.",
        canBrowse: true,
        contactInfo: {
          email: "ngfitruong1104@gmail.com",
          phone: "0343439444",
          note: "Bạn vẫn có thể xem trang web như khách. Để mở khóa tài khoản, vui lòng liên hệ quản trị viên."
        }
      });
    }
    
    req.user = decoded; 
    next(); 
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
module.exports = authenticateJWT;