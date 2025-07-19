const jwt = require("jsonwebtoken");
const SECRET_KEY = "saddasdasadsasdadsas"; // Đảm bảo sử dụng cùng SECRET_KEY
const GroupAccount = require('../app/models/GroupAccount')

const authorize = (requiredRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Token không được cung cấp" });
    }

    try {
      const user = jwt.verify(token, SECRET_KEY);
      req.user = user; // Gán thông tin người dùng vào req

      // Kiểm tra quyền truy cập nếu cần
      if (requiredRoles.length > 0) {
        const userRoles = await IdGroupToName(user.idgroup); // Chờ kết quả từ hàm async
        if (!userRoles) {
          return res.status(403).json({ message: "Không tìm thấy quyền của người dùng" });
        }
        const hasRole = requiredRoles.some(role => userRoles.includes(role));
        if (!hasRole) {
          return res.status(403).json({ message: "Không có quyền truy cập" });
        }
      }
      next(); // Tiếp tục xử lý
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  };
};

const IdGroupToName = async (idgroup) => {
  const groupAcc = await GroupAccount.findOne({
    where: { GroupId: idgroup },
  });
  return groupAcc ? groupAcc.GroupName : null; // Trả về GroupName hoặc null nếu không tìm thấy
};

module.exports = authorize;