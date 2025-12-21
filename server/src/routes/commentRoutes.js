const express = require("express");
const router = express.Router();
const PostCommentController = require("../app/controller/PostCommentController");
const Authentication = require("../Common/Authentication");

// ===== BÌNH LUẬN (COMMENTS) =====
// Tạo bình luận mới
router.post("/create", Authentication, PostCommentController.createComment);

// Lấy danh sách bình luận của bài đăng
router.get("/post/:postId", PostCommentController.getCommentsByPost);

// Cập nhật bình luận
router.put("/:commentId", Authentication, PostCommentController.updateComment);

// Xóa bình luận
router.delete("/:commentId", Authentication, PostCommentController.deleteComment);

// ===== PHẢN HỒI BÌNH LUẬN (REPLIES) =====
// Tạo phản hồi bình luận
router.post("/reply/create", Authentication, PostCommentController.createReply);

// Lấy danh sách phản hồi của bình luận
router.get("/reply/:commentId", PostCommentController.getRepliesByComment);

// Cập nhật phản hồi
router.put("/reply/:replyId", Authentication, PostCommentController.updateReply);

// Xóa phản hồi
router.delete("/reply/:replyId", Authentication, PostCommentController.deleteReply);

module.exports = router;
