const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const  PostImage = require("./PostImage");
const Post = sequelize.define(
  "Post",
  {
    PostId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    AccountId: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    Content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    IsApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    IsHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
  },
  {
    tableName: "Post",
    timestamps: false,
  }
);
Post.hasMany(PostImage, { foreignKey: "PostId", as: "PostImages" });
PostImage.belongsTo(Post, { foreignKey: "PostId", as: "Post" });
module.exports = Post;