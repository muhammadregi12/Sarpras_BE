const BarangMasuk = require("./barangmasukModels");
const Barang = require("./barangModels");
const Cabang = require("./cabangModels");
const Kategori = require("./kategoriModels");
const Ruangan = require("./ruanganModels");
const Supplier = require("./supplierModels");
const User = require("./userModels");

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


// relasi barang masuk
Barang.hasMany(BarangMasuk, {
    foreignKey: "barang_id",
    as: "barang_masuk"
});
BarangMasuk.belongsTo(Barang, {
    foreignKey: "barang_id",
    as: "barang"
});

// relasi supplier dan barang masuk
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


module.exports = {
    Barang,
    Cabang,
    Kategori,
    Ruangan,
    Supplier,
    BarangMasuk
};

