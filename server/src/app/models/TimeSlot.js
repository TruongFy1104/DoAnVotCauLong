const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const TimeSlot = sequelize.define('TimeSlot', {
  TimeSlotId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  StartTime: { type: DataTypes.TIME, allowNull: false },
  EndTime: { type: DataTypes.TIME, allowNull: false }
}, {
  tableName: 'timeslot',
  timestamps: false
});

module.exports = TimeSlot;