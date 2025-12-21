const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); 
const Account = require('./Account');
// Nếu bạn muốn liên kết ngược lại với PostComment, hãy import nó ở đây
// const PostComment = require('./PostComment'); 

const PostCommentReply = sequelize.define('PostCommentReply', {
  ReplyId: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  CommentId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  AccountId: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  Content: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  CreatedAt: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW, 
    field: 'CreatedAt' 
  }
}, {
  tableName: 'post_comment_reply', // Tên bảng trong MySQL
  timestamps: false
});

// Thiết lập mối quan hệ
PostCommentReply.belongsTo(Account, { foreignKey: 'AccountId' });

// Gợi ý: Bạn nên thêm dòng dưới nếu muốn join bảng để lấy thông tin bình luận gốc
// PostCommentReply.belongsTo(PostComment, { foreignKey: 'CommentId' });

module.exports = PostCommentReply;