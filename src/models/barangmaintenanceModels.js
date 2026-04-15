const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BarangMaintenance = sequelize.define("BarangMaintenance", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    barang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'barang',
            key: 'id',
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        }
    },
    jumlah_maintenance: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tanggal_maintenance: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    tanggal_selesai: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('proses', 'selesai'),
        allowNull: false,
        defaultValue: 'proses',
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    biaya: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: "barang_maintenance",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})

module.exports = BarangMaintenance;