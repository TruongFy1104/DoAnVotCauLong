const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const ChatRoom = require('./ChatRoom');
const Account = require('./Account');

const ChatMember = sequelize.define('ChatMember', {
  RoomId: { type: DataTypes.INTEGER, primaryKey: true },
  AccountId: { type: DataTypes.STRING(20), primaryKey: true },
}, {
  tableName: 'chat_member',
  timestamps: false,
});

// Quan hệ
ChatRoom.hasMany(ChatMember, { foreignKey: 'RoomId', onDelete: 'CASCADE' });
ChatMember.belongsTo(ChatRoom, { foreignKey: 'RoomId' });

Account.hasMany(ChatMember, { foreignKey: 'AccountId', onDelete: 'CASCADE' });
ChatMember.belongsTo(Account, { foreignKey: 'AccountId' });

module.exports = ChatMember;
