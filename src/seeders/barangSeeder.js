const Barang = require("../models/barangModels");

async function barangSeeder() {
    const count = await Barang.count();
    if (count === 0) {
        await Barang.bulkCreate([
            {
                name_barang: "Laptop Dell XPS 13",
                kode_barang: "BRG001",
                ruangan_id: 1,
                kategori_id: 1,
                supplier_id: 1,
                cabang_id: 1,
                image: "https://example.com/images/laptop-dell-xps-13.jpg",
                satuan: "unit",
                jumlah: 10,
                harga: 15000000,
                keterangan: "Laptop untuk keperluan administrasi",
                status: "tersedia",
                tahun_pengadaan: 2022
            },
            {
                name_barang: "Meja Kantor",
                kode_barang: "BRG002",
                ruangan_id: 2,
                kategori_id: 2,
                supplier_id: 2,
                cabang_id: 2,
                image: "https://example.com/images/meja-kantor.jpg",
                satuan: "unit",
                jumlah: 5,
                harga: 2000000,
                keterangan: "Meja untuk keperluan kantor",
                status: "dipinjam",
                tahun_pengadaan: 2022
            },
            {
                name_barang: "Pulpen Pilot",
                kode_barang: "BRG003",
                ruangan_id: 3,
                kategori_id: 3,
                supplier_id: 3,
                cabang_id: 3,
                image: "https://example.com/images/pulpen-pilot.jpg",
                satuan: "unit",
                jumlah: 100,
                harga: 5000,
                keterangan: "Pulpen untuk keperluan kantor",
                status: "maintenance",
                tahun_pengadaan: 2022
            }
        ]);
    }
}

module.exports = barangSeeder;