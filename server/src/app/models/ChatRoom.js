const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChatRoom = sequelize.define('ChatRoom', {
  RoomId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  RoomName: { type: DataTypes.STRING(100), allowNull: false },
}, {
  tableName: 'chat_room',
  timestamps: false,
});

module.exports = ChatRoom;
