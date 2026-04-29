const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BarangRusak = sequelize.define("BarangRusak", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
    cabang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cabang',
            key: 'id',
        }
    },
    ruang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ruangan',
            key: 'id'
        }
    },
    jumlah_rusak: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tingkat_kerusakan: {
        type: DataTypes.ENUM('ringan', 'sedang', 'berat'),
        allowNull: true,
    },
    tanggal_rusak: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    }

},{
    tableName: "barang_rusak",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})

module.exports = BarangRusak;