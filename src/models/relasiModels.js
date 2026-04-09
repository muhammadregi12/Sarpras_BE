const Barang = require("./barangModels");
const Cabang = require("./cabangModels");
const Kategori = require("./kategoriModels");
const Ruangan = require("./ruanganModels");
const Supplier = require("./supplierModels");

Barang.hasMany(Kategori, { 
    foreignKey: "kategori_id",
    as: "kategori"
});
Kategori.belongsTo(Barang, { 
    foreignKey: "kategori_id",
    as: "barang"
});

Barang.hasMany(Ruangan, { 
    foreignKey: "ruangan_id",
    as: "ruangan"
});
Ruangan.belongsTo(Barang, { 
    foreignKey: "ruangan_id",
    as: "barang"
});

Barang.hasMany(Supplier, { 
    foreignKey: "supplier_id",
    as: "supplier"
});
Supplier.belongsTo(Barang, {
    foreignKey: "supplier_id",
    as: "barang"
});

Barang.belongsToMany(Cabang, {
    through: "barang_cabang",
    foreignKey: "barang_id",
    otherKey: "cabang_id",
    as: "cabang"
});
Cabang.belongsToMany(Barang, {
    through: "barang_cabang",
    foreignKey: "cabang_id",
    otherKey: "barang_id",
    as: "barang"
});

module.exports = {
    Barang,
    Cabang,
    Kategori,
    Ruangan,
    Supplier
};

