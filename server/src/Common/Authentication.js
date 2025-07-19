const jwt = require("jsonwebtoken");

const SECRET_KEY = "saddasdasadsasdadsas"; // Đảm bảo sử dụng cùng SECRET_KEY

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; 
  if (!token) {
    return res.status(403).json({ message: "Token không được cung cấp" });
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
    req.user = user; 
    next(); 
  });
};
module.exports = authenticateJWT;