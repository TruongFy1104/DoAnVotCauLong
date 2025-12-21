const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Account = require('./Account');
const Post = require('./Post');

const PostComment = sequelize.define('PostComment', {
  CommentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  PostId: { type: DataTypes.INTEGER, allowNull: false },
  AccountId: { type: DataTypes.STRING(20), allowNull: false },
  Content: { type: DataTypes.TEXT },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'post_comment',
  timestamps: false,
});

// Quan hệ
Post.hasMany(PostComment, { foreignKey: 'PostId', as: 'PostComments', onDelete: 'CASCADE' });
PostComment.belongsTo(Post, { foreignKey: 'PostId' });
PostComment.belongsTo(Account, { foreignKey: "AccountId", as: "Account" });

// Định nghĩa quan hệ với CommentReply ở cuối file
const CommentReply = require('./CommentReply');
PostComment.hasMany(CommentReply, { foreignKey: 'CommentId', as: 'PostCommentReplies', onDelete: 'CASCADE' });

module.exports = PostComment;
