const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Account = require('./Account');

const UserProfile = sequelize.define('UserProfile', {
  ProfileId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  AccountId: { type: DataTypes.STRING(20), allowNull: false },
  Avatar: { type: DataTypes.STRING(1000) },
  CoverImage: { type: DataTypes.STRING(1000) },
  Bio: { type: DataTypes.TEXT },
  Location: { type: DataTypes.STRING(255) },
  DateOfBirth: { type: DataTypes.DATEONLY },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'user_profile',
  timestamps: false,
});

// Quan hệ
Account.hasOne(UserProfile, { foreignKey: 'AccountId', onDelete: 'CASCADE' });
UserProfile.belongsTo(Account, { foreignKey: 'AccountId' });

module.exports = UserProfile;
