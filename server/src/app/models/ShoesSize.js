const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Product = require('./Product');

const ShoeSize = sequelize.define('ShoeSize', {
    ShoeSizeId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ProductId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Size: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    Quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'shoesize',
    timestamps: false,
});

ShoeSize.belongsTo(Product, { foreignKey: 'ProductId' });
Product.hasMany(ShoeSize, { foreignKey: 'ProductId' });

module.exports = ShoeSize;