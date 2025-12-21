module.exports = (io, models) => {
  const { ChatMessage, Account } = models;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Nhận tin nhắn mới (text hoặc ảnh)
    socket.on("sendMessage", async (data) => {
      // data: { senderId, receiverId, content, imageUrl }
      const senderId = data.senderId || data.SenderId;
      const receiverId = data.receiverId || data.ReceiverId;
      const content = data.content || data.Content || "";
      const imageUrl = data.imageUrl || data.ImageUrl || null;

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
          SentAt: new Date(),
        });

        const plainMessage = message.get({ plain: true });

        // Emit cho tất cả client (không dùng room)
        io.emit("receiveMessage", plainMessage);
        console.log("SOCKET EMIT receiveMessage:", plainMessage);
      } catch (err) {
        console.error("Lỗi khi lưu tin nhắn:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};