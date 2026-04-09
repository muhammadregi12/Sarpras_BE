const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Ruangan = sequelize.define("Ruangan", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    kode_ruangan: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name_ruangan: {
        type: DataTypes.STRING,
        allowNull: false,
    },

}, {
    tableName: "ruangan",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})

module.exports = Ruangan;