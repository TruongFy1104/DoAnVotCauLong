const CommentReply = require("../models/CommentReply");
const Account = require("../models/Account");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY || "saddasdasadsasdadsas";

// Lấy danh sách reply cho 1 comment
exports.getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const replies = await CommentReply.findAll({
      where: { CommentId: commentId },
      include: {
        model: Account,
        attributes: ["Username", "Firstname", "Lastname", "Email"],
      },
      order: [["CreatedAt", "ASC"]],
    });
    res.json(replies);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy phản hồi", error });
  }
};

// Thêm reply mới
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

    const reply = await CommentReply.create({ CommentId, AccountId, Content });
    const account = await Account.findByPk(AccountId, {
      attributes: ["Username", "Firstname", "Lastname", "Email"],
    });
    res.status(201).json({ ...reply.toJSON(), Account: account });
  } catch (error) {
    console.error(error); // log lỗi ra terminal
    res
      .status(500)
      .json({ message: "Lỗi khi thêm phản hồi", error: error.message });
  }
};
// DELETE /comments/reply/:replyId  (MỚI)     -> DELETE REPLY COMMENT
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
    const reply = await CommentReply.findByPk(replyId);
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
