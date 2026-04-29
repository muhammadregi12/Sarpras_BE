const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BarangKeluar = sequelize.define("BarangKeluar", {
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
    ruangan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'ruangan',
            key: 'id',
        }
    },
    jumlah_keluar: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tanggal_keluar: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    }

},{
    tableName: "barang_keluar",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})

module.exports = BarangKeluar;