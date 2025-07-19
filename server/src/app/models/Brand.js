const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Brand = sequelize.define('Brand', {
    BrandId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    BrandName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'Brand',
    timestamps: false,
});

module.exports = Brand;
