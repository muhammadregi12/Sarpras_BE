const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const Barang = sequelize.define("Barang", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    kode_barang: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    ruangan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'ruangan',
            key: 'id',
        },
    },
    cabang_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'cabang',
            key: 'id',
        }
    },
    kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kategori',
            key: 'id',
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    satuan: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    jumlah: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tahun_pengadaan: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'barang',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
});

module.exports = Barang;