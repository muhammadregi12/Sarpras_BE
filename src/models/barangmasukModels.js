const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BarangMasuk = sequelize.define("BarangMasuk", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    barang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'barang',
            key: 'id',
        }
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'supplier',
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
    no_dokumen: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    harga_satuan: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tanggal_masuk: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        }
    },

}, {
    tableName: "barang_masuk",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
});

module.exports = BarangMasuk;