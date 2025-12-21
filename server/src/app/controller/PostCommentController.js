const PostComment = require("../models/PostComment");
const PostCommentReply = require("../models/PostReplyCommnet");
const Account = require("../models/Account");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY || "saddasdasadsasdadsas";

// Lấy các bình luận theo PostId và bao gồm thông tin tài khoản
exports.getCommentsByPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await PostComment.findAll({
      where: { PostId: postId },
      include: {
        model: Account,
        as: "Account",
        attributes: ["Firstname", "Lastname", "Email", "Username", "Avatar"],
      },
      order: [["CreatedAt", "DESC"]],
    });
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching post comments:", error);
    res.status(500).json({ message: "Error fetching post comments." });
  }
};

// Thêm bình luận mới cho bài đăng
exports.addComment = async (req, res) => {
  const { PostId, Content } = req.body;
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
    const newComment = await PostComment.create({
      PostId,
      AccountId: userId,
      Content,
      CreatedAt: new Date(),
    });
    const account = await Account.findByPk(userId, {
      attributes: ["Username", "Firstname", "Lastname", "Email", "Avatar"],
    });
    res.status(201).json({
      ...newComment.toJSON(),
      Account: account,
    });
  } catch (error) {
    console.error("Error adding post comment:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi thêm bình luận." });
  }
};

// Xóa bình luận bài đăng (và các reply liên quan)
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Thiếu hoặc sai token." });

    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded?.userId)
      return res.status(401).json({ message: "Token không hợp lệ." });

    const me = await Account.findByPk(decoded.userId);
    const comment = await PostComment.findByPk(commentId);
    if (!comment)
      return res.status(404).json({ message: "Không tìm thấy bình luận." });

    const isOwner = String(comment.AccountId) === String(decoded.userId);
    const isAdmin = String(me?.IdGroup) === "1";

    if (!(isOwner || isAdmin)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bình luận này." });
    }

    // Xóa kèm replies
    await PostCommentReply.destroy({ where: { CommentId: commentId } });
    await comment.destroy();

    res.json({ message: "Đã xóa bình luận và các phản hồi liên quan." });
  } catch (error) {
    console.error("Error deleting post comment:", error);
    res.status(500).json({ message: "Lỗi khi xóa bình luận." });
  }
};

// Lấy danh sách reply cho 1 bình luận bài đăng
exports.getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const replies = await PostCommentReply.findAll({
      where: { CommentId: commentId },
      include: {
        model: Account,
        attributes: ["Username", "Firstname", "Lastname", "Email", "Avatar"],
      },
      order: [["CreatedAt", "ASC"]],
    });
    res.json(replies);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy phản hồi", error });
  }
};

// Thêm reply mới cho bình luận bài đăng
exports.addReply = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token không hợp lệ." });
    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded || !decoded.userId)
      return res.status(401).json({ message: "Token không hợp lệ." });

    const { CommentId, Content } = req.body;
    const AccountId = decoded.userId;

    if (!CommentId || !Content) {
      return res.status(400).json({ message: "Thiếu CommentId hoặc Content" });
    }

    const reply = await PostCommentReply.create({
      CommentId,
      AccountId,
      Content,
      CreatedAt: new Date(),
    });
    const account = await Account.findByPk(AccountId, {
      attributes: ["Username", "Firstname", "Lastname", "Email", "Avatar"],
    });
    res.status(201).json({ ...reply.toJSON(), Account: account });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Lỗi khi thêm phản hồi", error: error.message });
  }
};

// Xóa reply của bình luận bài đăng
exports.deleteReply = async (req, res) => {
  const { replyId } = req.params;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Thiếu hoặc sai token." });

    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded?.userId)
      return res.status(401).json({ message: "Token không hợp lệ." });

    const me = await Account.findByPk(decoded.userId);
    const reply = await PostCommentReply.findByPk(replyId);
    if (!reply)
      return res.status(404).json({ message: "Không tìm thấy phản hồi." });

    const isOwner = String(reply.AccountId) === String(decoded.userId);
    const isAdmin = String(me?.IdGroup) === "1";

    if (!(isOwner || isAdmin)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa phản hồi này." });
    }

    await reply.destroy();
    res.json({ message: "Đã xóa phản hồi." });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ message: "Lỗi khi xóa phản hồi." });
  }
};