const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const CommentReply = sequelize.define('CommentReply', {
  ReplyId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  CommentId: { type: DataTypes.INTEGER, allowNull: false },
  AccountId: { type: DataTypes.STRING(20), allowNull: false },
  Content: { type: DataTypes.TEXT },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'comment_reply',
  timestamps: false,
});

// Quan hệ

module.exports = CommentReply;