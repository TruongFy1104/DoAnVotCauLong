const Comment = require('../models/Comment');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'saddasdasadsasdadsas'; // Replace with your actual secret key

// Lấy các bình luận theo ProductId và bao gồm thông tin của tài khoản (Account)
exports.getCommentsByProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const comments = await Comment.findAll({
      where: { ProductId: productId },
      include: {
        model: Account,
        as: 'Account',
        attributes: ['Firstname', 'Lastname', 'Email', 'Username']
      },
    });
    // Luôn trả về mảng (có thể rỗng)
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments.' });
  }
};

exports.addComment = async (req, res) => {
  const { ProductId, Content } = req.body;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc không có quyền truy cập.' });
    }
    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Token không hợp lệ.' });
    }
    const userId = decoded.userId;
    const newComment = await Comment.create({
      ProductId,
      AccountId: userId,
      Content,
    });
    const account = await Account.findByPk(userId, {
      attributes: ['Username', 'Firstname', 'Lastname', 'Email']
    });
    res.status(201).json({
      ...newComment.toJSON(),
      Account: account
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm bình luận.' });
  }
};

