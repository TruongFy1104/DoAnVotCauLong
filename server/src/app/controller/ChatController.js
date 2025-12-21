const ChatRoom = require('../models/ChatRoom');
const ChatMember = require('../models/ChatMember');
const ChatMessage = require('../models/ChatMessage');
const Account = require('../models/Account');
const sequelize = require('../../config/db');
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "saddasdasadsasdadsas";

// Tạo thư mục lưu hình ảnh nếu chưa tồn tại
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để lưu hình ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Tạo phòng chat
exports.createRoom = async (req, res) => {
  try {
    const { RoomName, Members } = req.body;

    const room = await ChatRoom.create({ RoomName });
      
    // Thêm thành viên vào phòng
    const members = Members.map((memberId) => ({
      RoomId: room.RoomId,
      AccountId: memberId,
    }));
    await ChatMember.bulkCreate(members);

    res.json({ message: 'Phòng chat đã được tạo', room });
  } catch (error) {
    console.error('Lỗi tạo phòng chat:', error);
    res.status(500).json({ message: 'Lỗi tạo phòng chat', error: error.message });
  }
};

// Gửi tin nhắn (API gửi text hoặc ảnh, realtime sau khi lưu)
exports.sendMessage = async (req, res) => {
  upload.single("Image")(req, res, async (err) => {
    if (err) {
      console.error("Lỗi upload hình ảnh:", err);
      return res.status(500).json({ message: "Lỗi khi upload hình ảnh" });
    }

    try { 
      const SenderId = req.body.SenderId || req.body.senderId;
      const ReceiverId = req.body.ReceiverId || req.body.receiverId;
      const Content = req.body.Content || req.body.content;
      const ImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      // Chỉ cần Content hoặc ImageUrl, không bắt buộc cả hai
      if (!SenderId || !ReceiverId || (!Content && !ImageUrl)) {
        return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc." });
      }

      // Lưu tin nhắn vào DB
      const message = await ChatMessage.create({
        SenderId,
        ReceiverId,
        Content,
        ImageUrl,
        SentAt: new Date()
      });

      // Lấy lại tin nhắn kèm thông tin người gửi/nhận (cho realtime)
      const fullMessage = await ChatMessage.findOne({
        where: { MessageId: message.MessageId },
        include: [
          { model: Account, as: 'Sender', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname', 'Avatar'] },
          { model: Account, as: 'Receiver', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname', 'Avatar'] }
        ]
      });


      // Emit socket realtime (nếu dùng socket.io) - trả về plain object để client nhận đúng dữ liệu
      if (req.app && req.app.get('io')) {
        const plainMessage = fullMessage ? fullMessage.get({ plain: true }) : message.get({ plain: true });
        req.app.get('io').emit("receiveMessage", plainMessage);
      }

      res.json({ message: "Tin nhắn đã được gửi", data: fullMessage });
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      res.status(500).json({ message: "Lỗi gửi tin nhắn", error: error.message });
    }
  });
};

// Lấy tin nhắn giữa hai người dùng
exports.getMessages = async (req, res) => {
  try {
    const { SenderId, ReceiverId } = req.query;

    if (!SenderId || !ReceiverId) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc." });
    }

    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { SenderId, ReceiverId },
          { SenderId: ReceiverId, ReceiverId: SenderId },
        ],
      },
      order: [["SentAt", "ASC"]],
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tải tin nhắn", error: error.message });
  }
};

// Lấy danh sách user đã chat
exports.getChatUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { SenderId: userId },
          { ReceiverId: userId }
        ]
      },
      raw: true
    });

    const userIds = [
      ...new Set(
        messages
          .flatMap(msg => [msg.SenderId, msg.ReceiverId])
          .filter(id => id !== userId)
      )
    ];

    const users = await Account.findAll({
      where: { AccountId: userIds },
      attributes: ['AccountId', 'Username', 'Email', 'Firstname', 'Lastname', 'Avatar'],
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách user chat", error: error.message });
  }
};

// Lấy lịch sử chat giữa 2 user
exports.getChatHistory = async (req, res) => {
  try {
    const { userId, otherId } = req.params;

    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { SenderId: userId, ReceiverId: otherId },
          { SenderId: otherId, ReceiverId: userId }
        ]
      },
      include: [
        { model: Account, as: 'Sender', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'], foreignKey: 'SenderId' },
        { model: Account, as: 'Receiver', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'], foreignKey: 'ReceiverId' }
      ],
      order: [['SentAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy lịch sử chat", error: error.message });
  }
};

// Lấy danh sách người dùng để chat
exports.getAllUsersForChat = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    let currentUserId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        currentUserId = decoded.userId;
      } catch (err) {
        console.error("Token verification failed:", err);
      }
    }

    const where = {
      IdGroup: { [Op.in]: [2, 3] }, // Lấy cả người dùng (2) và nhân viên (3)
      ...(currentUserId && { AccountId: { [Op.ne]: currentUserId } }),
    };

    const accounts = await Account.findAll({
      where,
      attributes: [
        "AccountId",
        "Username",
        "Email",
        "Firstname",
        "Lastname",
        "Gender",
        "Mobile",
        "Avatar",
        "IdGroup",
      ],
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách user",
      error: error.message,
    });
  }
};


//privetesite tin nhắn

// Xóa tin nhắn theo MessageId
exports.deleteAllMessages = async (req, res) => {
  try {
    await ChatMessage.destroy({ where: {} });
    res.json({ success: true, message: 'Đã xóa tất cả tin nhắn.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tất cả tin nhắn.', error: error.message });
  }
};
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.findAll({
      include: [
        { model: Account, as: 'Sender', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'] },
        { model: Account, as: 'Receiver', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'] }
      ],
      order: [["SentAt", "DESC"]],
    });
    res.json(messages);
  } catch (error) {
        console.error("getAllMessages error:", error); // Thêm dòng này để log lỗi ra console
    res.status(500).json({ message: "Lỗi khi tải tất cả tin nhắn", error: error.message });
  }
};
exports.deleteMessagesBySender = async (req, res) => {
  try {
    const { senderId } = req.params;
    await ChatMessage.destroy({ where: { SenderId: senderId } });
    res.json({ success: true, message: 'Đã xóa tất cả tin nhắn của người gửi này.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tin nhắn.', error: error.message });
  }
};