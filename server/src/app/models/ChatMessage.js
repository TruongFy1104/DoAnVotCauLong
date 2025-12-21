const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Account = require("./Account");

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    MessageId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    SenderId: { type: DataTypes.STRING(20), allowNull: false },
    ReceiverId: { type: DataTypes.STRING(20), allowNull: false },
    Content: { type: DataTypes.TEXT, allowNull: true },
    ImageUrl: { type: DataTypes.STRING(1000), allowNull: true },
    SentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "chat_message",
    timestamps: false,
  }
);

// Quan hệ
ChatMessage.belongsTo(Account, { as: "Sender", foreignKey: "SenderId" });
ChatMessage.belongsTo(Account, { as: "Receiver", foreignKey: "ReceiverId" });

module.exports = ChatMessage;
