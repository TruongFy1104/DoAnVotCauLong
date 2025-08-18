const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Branch = sequelize.define('Branch', {
    BranchId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    BranchName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'Branch',
    timestamps: false,
});

module.exports = Branch;
