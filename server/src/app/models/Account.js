const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const GroupAccount = require('./GroupAccount');
const Customer = require('./Customer');
const Post = require("./Post"); 
const CommentReply = require("./CommentReply"); // Thêm dòng này

const Account = sequelize.define('Account', {
    AccountId: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
    },
    Username: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    Password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    Firstname: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    Lastname: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    Address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    IdGroup: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Gender: {
        type: DataTypes.ENUM('Nam', 'Nữ'),
        allowNull: true,
    },
    CustomerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Mobile: {
        type: DataTypes.STRING(15),
        allowNull: true,
    },
    Email: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    IsBanned: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Không bị khóa, 1: Bị khóa'
    },
}, {
    tableName: 'account',
    timestamps: false,
});

// Associations
Account.belongsTo(GroupAccount, { foreignKey: 'IdGroup' });
GroupAccount.hasMany(Account, { foreignKey: 'IdGroup' });

Account.belongsTo(Customer, { foreignKey: 'CustomerId' });
Customer.hasMany(Account, { foreignKey: 'CustomerId' });

Account.hasMany(Post, { foreignKey: "AccountId", as: "Posts" });
Post.belongsTo(Account, { foreignKey: "AccountId", as: "Account" });

Account.hasMany(CommentReply, { foreignKey: "AccountId" });
CommentReply.belongsTo(Account, { foreignKey: "AccountId" });

module.exports = Account;
