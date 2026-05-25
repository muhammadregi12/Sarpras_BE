const BarangMasuk = require("./barangmasukModels");
const Barang = require("./barangModels");
const Cabang = require("./cabangModels");
const Kategori = require("./kategoriModels");
const Ruangan = require("./ruanganModels");
const Supplier = require("./supplierModels");
const User = require("./userModels");
const BarangRusak = require("./barangrusakModels");
const BarangMaintenance = require("./barangmaintenanceModels");
const BarangKeluar = require("./barangkeluarModels");

// kategori - barang
Kategori.hasMany(Barang, { 
    foreignKey: "kategori_id",
    as: "barang"
});
Barang.belongsTo(Kategori, { 
    foreignKey: "kategori_id",
    as: "kategori"
});

// ruangan - barang
Ruangan.hasMany(Barang, { 
    foreignKey: "ruangan_id",
    as: "barang"
});
Barang.belongsTo(Ruangan, { 
    foreignKey: "ruangan_id",
    as: "ruangan"
});

// supplier - barang
Supplier.hasMany(Barang, {
    foreignKey: "supplier_id",
    as: "barang"
});
Barang.belongsTo(Supplier, {
    foreignKey: "supplier_id",
    as: "supplier"
});
Cabang.hasMany(Barang, {
    foreignKey: "cabang_id",
    as: "barang"
});
Barang.belongsTo(Cabang, {
    foreignKey: "cabang_id",
    as: "cabang"
});


// relasi barang masuk
Barang.hasMany(BarangMasuk, {
    foreignKey: "barang_id",
    as: "barang_masuk"
});
BarangMasuk.belongsTo(Barang, {
    foreignKey: "barang_id",
    as: "barang"
});
Cabang.hasMany(BarangMasuk, {
    foreignKey: "cabang_id",
    as: "barang_masuk"
})
Ruangan.hasMany(BarangMasuk, {
    foreignKey: "ruangan_id",
    as: "barang_masuk"
})
BarangMasuk.belongsTo(Ruangan, {
    foreignKey: "ruangan_id",
    as: "ruangan"
})
BarangMasuk.belongsTo(Cabang, {
    foreignKey: "cabang_id",
    as: "cabang"
});
Supplier.hasMany(BarangMasuk, {
    foreignKey: "supplier_id",
    as: "barang_masuk"
});
BarangMasuk.belongsTo(Supplier, {
    foreignKey: "supplier_id",
    as: "supplier"
});

User.hasMany(BarangMasuk, {
    foreignKey: "user_id",
    as: "barang_masuk"
});
BarangMasuk.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});

// barang rusak
Barang.hasMany(BarangRusak, {
    foreignKey: "barang_id",
    as: "barang_rusak"
});
BarangRusak.belongsTo(Barang, {
    foreignKey: "barang_id",
    as: "barang"
});
User.hasMany(BarangRusak, {
    foreignKey: "user_id",
    as: "barang_rusak"
});
BarangRusak.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});
Cabang.hasMany(BarangRusak, {
    foreignKey: "cabang_id",
    as: "barang_rusak"
})
BarangRusak.belongsTo(Cabang, {
    foreignKey: "cabang_id",
    as: "cabang"
});
Ruangan.hasMany(BarangRusak, {
    foreignKey: "ruangan_id",
    as: "barang_rusak"
})
BarangRusak.belongsTo(Ruangan, {
    foreignKey: "ruangan_id",
    as: "ruangan"
});

// barang maintenance
Barang.hasMany(BarangMaintenance, {
    foreignKey: "barang_id",
    as: "barang_maintenance"
});
BarangMaintenance.belongsTo(Barang, {
    foreignKey: "barang_id",
    as: "barang"
});
User.hasMany(BarangMaintenance, {
    foreignKey: "user_id",
    as: "barang_maintenance"
});
BarangMaintenance.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});
BarangMaintenance.hasMany(BarangRusak, {
    foreignKey: "barangrusak_id",
    as: "barang_rusak"
});
BarangRusak.belongsTo(BarangMaintenance, {
    foreignKey: "barangrusak_id",
    as: "barang_maintenance"
});


// barang keluar
Barang.hasMany(BarangKeluar, {
    foreignKey: "barang_id",
    as: "barang_keluar"
});
BarangKeluar.belongsTo(Barang, {
    foreignKey: "barang_id",
    as: "barang"
});
User.hasMany(BarangKeluar, {
    foreignKey: "user_id",
    as: "barang_keluar"
});
BarangKeluar.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});
BarangKeluar.belongsTo(Ruangan, {
    foreignKey: "ruangan_id",
    as: "ruangan"
})
Ruangan.hasMany(BarangKeluar, {
    foreignKey: "ruangan_id",
    as: "barang_keluar"
});
Cabang.hasMany(BarangKeluar, {
    foreignKey: "cabang_id",
    as: "barang_keluar"
})
BarangKeluar.belongsTo(Cabang, {
    foreignKey: "cabang_id",
    as: "cabang"
});


module.exports = {
    Barang,
    Cabang,
    Kategori,
    Ruangan,
    Supplier,
    BarangMasuk,
    User,
    BarangRusak,
    BarangMaintenance,
    BarangKeluar
};

