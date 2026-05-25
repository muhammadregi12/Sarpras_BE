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
    // ruangan_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: 'ruangan',
    //         key: 'id',
    //     }
    // },
    // cabang_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: 'cabang',
    //         key: 'id',
    //     }
    // },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
        type: DataTypes.ENUM('maintenance', 'selesai'),
        allowNull: false,
        defaultValue: 'maintenance',
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    biaya: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    jumlah_rusak_hasil: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    jumlah_selesai: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    tingkat_kerusakan: {
        type: DataTypes.ENUM('ringan', 'sedang', 'berat'),
        allowNull: true,
    },
}, {
    tableName: "barang_maintenance",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
})

module.exports = BarangMaintenance;