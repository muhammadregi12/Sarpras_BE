const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Kategori = sequelize.define("Kategori", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name_kategori: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: "kategori",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
});

module.exports = Kategori;