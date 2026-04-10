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
    },
    ruangan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },    
    cabang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    },
    harga: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // kondisi: {
    //     type: DataTypes.ENUM('baik', 'rusak_ringan', 'rusak_berat'),
    //     allowNull: false,
    // },
    status: {
        type: DataTypes.ENUM('tersedia', 'dipinjam', 'maintenance'),
        allowNull: false,
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