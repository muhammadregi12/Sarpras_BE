const Supplier = require("../models/supplierModels");

async function supplierSeeder() {
    const count = await Supplier.count();
    if (count === 0) {
        await Supplier.bulkCreate([
            {
                name_supplier: "Supplier A",
                perusahaan: "Perusahaan A",
                no_telp: "081234567890",
                alamat_perusahaan: "Jl. Contoh Alamat No. 1"
            },
            {
                name_supplier: "Supplier B",
                perusahaan: "Perusahaan B",
                no_telp: "081234567891",
                alamat_perusahaan: "Jl. Contoh Alamat No. 2"
            },
            {
                name_supplier: "Supplier C",
                perusahaan: "Perusahaan C",
                no_telp: "081234567892",
                alamat_perusahaan: "Jl. Contoh Alamat No. 3"
            }
        ]);
    }
}

module.exports = supplierSeeder;