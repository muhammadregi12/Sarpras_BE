const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cabang = sequelize.define("Cabang", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name_cabang: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    daerah_cabang: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: "cabang",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
});

module.exports = Cabang;