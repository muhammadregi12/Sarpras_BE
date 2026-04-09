const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Supplier = sequelize.define("Supplier", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name_supplier: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    perusahaan: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: "supplier",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})

module.exports = Supplier;