const express = require("express");
const cors = require("cors");
const sequelize = require("./src/config/db");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http"); // Thêm http module
const { Server } = require("socket.io"); // Thêm socket.io module
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const ChatMessage = require("./src/app/models/ChatMessage");
const Account = require("./src/app/models/Account");
const PORT = process.env.PORT || 3000;

// Gắn io vào app để controller có thể sử dụng
app.set('io', io);

// Socket.io logic
const models = require("./src/app/models");
// const chatSocket = require("./src/app/socket/chatSocket");
// chatSocket(io, models);


app.use(cors({ origin: "http://localhost:3001", credentials: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "src", "app", "uploads"))
);


// Socket.io logic - XÓA HOẶC COMMENT đoạn này vì không dùng nữa
/*
io.on("connection", (socket) => {
  socket.on("sendMessage", async (data) => {
    // Đảm bảo lấy đúng key thường hoặc viết hoa
    const senderId = data.senderId || data.SenderId;
    const receiverId = data.receiverId || data.ReceiverId;
    const content = data.content || data.Content;
    const imageUrl = data.imageUrl || data.ImageUrl || null;
    const sentAt = data.sentAt || data.SentAt || new Date();


    // Kiểm tra dữ liệu bắt buộc
    if (!senderId || !receiverId || (!content && !imageUrl)) {
      console.error("Thiếu dữ liệu bắt buộc:", data);
      return;
    }

    try {
      // Lưu vào DB
      const message = await ChatMessage.create({
        SenderId: senderId,
        ReceiverId: receiverId,
        Content: content,
        ImageUrl: imageUrl,
        SentAt: sentAt
      });

      io.emit("receiveMessage", message);
    } catch (err) {
      console.error("Lỗi khi lưu tin nhắn:", err);
    }
  });

  socket.on("disconnect", () => {
    // Xử lý khi user disconnect nếu cần
  });
});
*/

// Chỉ giữ lại connection tracking
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  
  socket.on("sendMessage", async (data) => {
    // Đảm bảo lấy đúng key thường hoặc viết hoa
    const senderId = data.senderId || data.SenderId;
    const receiverId = data.receiverId || data.ReceiverId;
    const content = data.content || data.Content;
    const imageUrl = data.imageUrl || data.ImageUrl || null;
    const sentAt = data.sentAt || data.SentAt || new Date();

    console.log("SOCKET sendMessage received:", { senderId, receiverId, content, imageUrl });

    // Kiểm tra dữ liệu bắt buộc
    if (!senderId || !receiverId || (!content && !imageUrl)) {
      console.error("Thiếu dữ liệu bắt buộc:", data);
      return;
    }

    try {
      // Lưu vào DB
      const message = await ChatMessage.create({
        SenderId: senderId,
        ReceiverId: receiverId,
        Content: content,
        ImageUrl: imageUrl,
        SentAt: sentAt
      });

      // Chuyển sang plain object trước khi emit (giống như controller)
      const plainMessage = message.get({ plain: true });

      io.emit("receiveMessage", plainMessage);
      console.log("SOCKET EMIT receiveMessage (text):", plainMessage);
    } catch (err) {
      console.error("Lỗi khi lưu tin nhắn:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Các route hiện có
const {
  getRepliesByComment,
  addReply,
  deleteReply,
} = require("./src/app/controller/CommentReplyContronller.js");
const {
  getCommentsByProduct,
  getAllCommentsByProduct,
  addComment,
  deleteComment,
  approveComment,
} = require("./src/app/controller/CommentController");
const {
  sendOTP,
  resetPassword,
  verifyOTP,
} = require("./src/app/controller/ForgotPasswordController");
const privateSiteRoutes = require("./src/routes/privateSiteRoutes");
const brandRoutes = require("./src/routes/brandRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const authenticateJWT = require("./src/Common/Authentication.js");
const authorize = require("./src/Common/Authorize");
const authRoutes = require("./src/routes/authenRoutes");
const productRoutes = require("./src/routes/productRoutes");
const {
  getAllAccountsUser,
  getProfileUser,
  updateProfileUser,
  changePasswordUser,
  getOrderDetails,
  getOrderUser,
} = require("./src/app/controller/AccountUserController.js");
const { cancelOrderByUser } = require("./src/app/controller/OrderController.js");
const cartRoutes = require("./src/routes/cartRoutes");
const checkoutRoutes = require("./src/routes/checkoutRoutes");
const {
  getAllBranches,
  getCourtsByBranch,
  getAllTimeSlots,
  createBooking,
  getBookedSlots,
  getBookingHistory,
  cancelManyBookings,
} = require("./src/app/controller/BookingController.js");
const {
  createPost,
  getFeed,
  deletePost,
  toggleLikePost,
  getLikeStatus,
  updatePost,
  deleteImage,
} = require("./src/app/controller/PostContronller.js");
const postCommentController = require("./src/app/controller/PostCommentController");
//chat
const chatController = require("./src/app/controller/ChatController.js");
const { get } = require("express/lib/response.js");


app.get("/chat/users", chatController.getAllUsersForChat);
app.get(
  "/accountmanagementUser",
  authenticateJWT,
  authorize(["Người dùng"]),
  getAllAccountsUser
);
app.get(
  "/profileUser",
  authenticateJWT,
  authorize(["Người dùng"]),
  getProfileUser
);
app.put(
  "/updateprofileUser",
  authenticateJWT,
  authorize(["Người dùng"]),
  updateProfileUser
);
app.put(
  "/profile/changepasswordUser",
  authenticateJWT,
  authorize(["Người dùng"]),
  changePasswordUser
);
///
app.use("/privatesite", privateSiteRoutes);
app.use("/brands", brandRoutes);
app.use("/auth", authRoutes);

// Forgot Password Routes
app.post("/forgot-password/send-otp", sendOTP);
app.post("/forgot-password/verify-otp", verifyOTP);
app.post("/forgot-password/reset", resetPassword);

app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
// comments
app.get("/comments/admin/:productId", getAllCommentsByProduct); // Phải đặt trước route :productId
app.get("/comments/:productId", getCommentsByProduct);
app.post("/comments", addComment);
app.delete("/comments/:commentId", deleteComment);
app.put("/comments/approve/:commentId", approveComment);
// replies
app.post("/comments/reply", addReply);
app.get("/comments/:commentId/replies", getRepliesByComment);
app.delete("/comments/reply/:replyId", deleteReply);



// payment
app.use("/cart", cartRoutes);
app.use("/checkout", checkoutRoutes);
// booking
app.get("/branches", getAllBranches);
app.get("/courts", getCourtsByBranch);
app.get("/timeslots", getAllTimeSlots);
app.get("/booked-slots", getBookedSlots);
app.get("/booking-history", getBookingHistory);
app.put("/booking/cancel-many", cancelManyBookings);

// booking
app.post("/booking", authenticateJWT, authorize(["Người dùng"]), createBooking);
// order
app.get("/order", authenticateJWT, authorize(["Người dùng"]), getOrderUser);
app.put("/order/cancel/:id", authenticateJWT, authorize(["Người dùng"]), cancelOrderByUser);
app.get(
  "/order/:orderId",
  authenticateJWT,
  authorize(["Người dùng"]),
 getOrderDetails
);

// posts
app.post("/post/create",createPost);
app.get("/post/feed", getFeed);
app.delete("/post/:postId", deletePost);
app.post('/like', toggleLikePost)
app.get("/like/:PostId", getLikeStatus);
app.put("/post/:postId", updatePost);
app.delete("/image/:imageId", deleteImage);


//Post Comments
app.get("/post-comments/:postId", postCommentController.getCommentsByPost);
app.post("/post-comments", postCommentController.addComment);
app.delete("/post-comments/:commentId", postCommentController.deleteComment);

app.get("/post-comments/:commentId/replies", postCommentController.getRepliesByComment);
app.post("/post-comments/reply", postCommentController.addReply);
app.delete("/post-comments/reply/:replyId", postCommentController.deleteReply);
//Chat
app.get("/chat/users", chatController.getAllUsersForChat);
app.post("/chat/send", chatController.sendMessage); // Route mới cho StaffChat
app.post("/chat/message", chatController.sendMessage); // Route cũ cho Community
app.get("/chat/messages", chatController.getMessages);


// Khởi chạy server
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
