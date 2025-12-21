const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const PostImage = sequelize.define(
  "PostImage",
  {
    ImageId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    PostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ImageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "PostImage",
    timestamps: false,
  }
);

// Associations
PostImage.associate = (models) => {
  PostImage.belongsTo(models.Post, { foreignKey: "PostId", as: "Post" });
};

module.exports = PostImage;