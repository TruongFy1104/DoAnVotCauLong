const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Post = require('./Post');
const Account = require('./Account');

const PostLike = sequelize.define('PostLike', {
  LikeId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  PostId: { type: DataTypes.INTEGER, allowNull: false },
  AccountId: { type: DataTypes.STRING(20), allowNull: false },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'post_like',
  timestamps: false,
});

// Quan hệ
Post.hasMany(PostLike, { foreignKey: 'PostId', as: 'PostLikes', onDelete: 'CASCADE' });
PostLike.belongsTo(Post, { foreignKey: 'PostId', as: 'Post' });
PostLike.belongsTo(Account, { foreignKey: 'AccountId', as: 'Account' });

module.exports = PostLike;
