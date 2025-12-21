const Comment = require("../models/Comment");
const Account = require("../models/Account");
const CommentReply = require("../models/CommentReply");
const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "saddasdasadsasdadsas"; // Replace with your actual secret key

// Lấy các bình luận theo ProductId và bao gồm thông tin của tài khoản (Account)
exports.getCommentsByProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const comments = await Comment.findAll({
      where: { ProductId: productId, IsApproved: true },
      include: {
        model: Account,
        as: "Account",
        attributes: ["Firstname", "Lastname", "Email", "Username"],
      },
    });
    // Luôn trả về mảng (có thể rỗng)
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments." });
  }
};

// Lấy TẤT CẢ bình luận theo ProductId (bao gồm chưa duyệt) - chỉ dành cho admin
exports.getAllCommentsByProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Thiếu hoặc sai token." });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded?.userId) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }

    const me = await Account.findByPk(decoded.userId);
    const isAdminOrStaff = me?.IdGroup === 1 || me?.IdGroup === 3;

    if (!isAdminOrStaff) {
      return res.status(403).json({ 
        message: "Chỉ quản trị viên và nhân viên mới có thể xem tất cả bình luận." 
      });
    }

    const comments = await Comment.findAll({
      where: { ProductId: productId },
      include: {
        model: Account,
        as: "Account",
        attributes: ["Firstname", "Lastname", "Email", "Username"],
      },
      order: [["createdAt", "DESC"]],
    });
    
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching all comments:", error);
    res.status(500).json({ message: "Error fetching comments." });
  }
};


exports.addComment = async (req, res) => {
  const { ProductId, Content } = req.body;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc không có quyền truy cập." });
    }
    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }
    const userId = decoded.userId;
    
    // Tạo bình luận mới (cần duyệt trước khi hiển thị)
    const newComment = await Comment.create({
      ProductId,
      AccountId: userId,
      Content,
      IsApproved: false,
    });
    const account = await Account.findByPk(userId, {
      attributes: ["Username", "Firstname", "Lastname", "Email"],
    });
    res.status(201).json({
      message: "Bình luận của bạn đang chờ quản trị viên duyệt.",
      comment: {
        ...newComment.toJSON(),
        Account: account,
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi thêm bình luận." });
  }
};

// DELETE /comments/:commentId   -> DELETE COMMENT
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Thiếu hoặc sai token." });

    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded?.userId)
      return res.status(401).json({ message: "Token không hợp lệ." });

    const me = await Account.findByPk(decoded.userId); // có cột IdGroup trong bảng account
    const comment = await Comment.findByPk(commentId);
    if (!comment)
      return res.status(404).json({ message: "Không tìm thấy bình luận." });

    const isOwner = String(comment.AccountId) === String(decoded.userId);
    const isAdmin = String(me?.IdGroup) === "1"; // 1 = Admin
    const isStaff = String(me?.IdGroup) === "3"; // 3 = Nhân viên

    if (!(isOwner || isAdmin || isStaff)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bình luận này." });
    }

    // Xóa kèm replies để sạch dữ liệu (có thể thay bằng ON DELETE CASCADE ở FK DB)
    await CommentReply.destroy({ where: { CommentId: commentId } });
    await comment.destroy();

    res.json({ message: "Đã xóa bình luận và các phản hồi liên quan." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Lỗi khi xóa bình luận." });
  }
};

// Duyệt bình luận (chỉ admin/nhân viên)
exports.approveComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Thiếu hoặc sai token." });

    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded?.userId)
      return res.status(401).json({ message: "Token không hợp lệ." });

    const me = await Account.findByPk(decoded.userId);
    const isAdminOrStaff = me?.IdGroup === 1 || me?.IdGroup === 3;

    if (!isAdminOrStaff) {
      return res.status(403).json({ 
        message: "Chỉ quản trị viên và nhân viên mới có thể duyệt bình luận." 
      });
    }

    const comment = await Comment.findByPk(commentId);
    if (!comment)
      return res.status(404).json({ message: "Không tìm thấy bình luận." });

    comment.IsApproved = true;
    await comment.save();

    res.json({ message: "Duyệt bình luận thành công!", comment });
  } catch (error) {
    console.error("Error approving comment:", error);
    res.status(500).json({ message: "Lỗi khi duyệt bình luận." });
  }
};
