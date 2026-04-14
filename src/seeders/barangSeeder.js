const Barang = require("../models/barangModels");

async function barangSeeder() {
    const count = await Barang.count();
    if (count === 0) {
        await Barang.bulkCreate([
            {
                name: "Laptop Dell XPS 13",
                kode_barang: "BRG001",
                ruangan_id: 1,
                kategori_id: 1,
                image: "https://example.com/images/laptop-dell-xps-13.jpg",
                satuan: "unit",
                jumlah: 0,
                keterangan: "Laptop untuk keperluan administrasi",
                tahun_pengadaan: 2022
            },
            {
                name: "Meja Kantor",
                kode_barang: "BRG002",
                ruangan_id: 2,
                kategori_id: 2,
                image: "https://example.com/images/meja-kantor.jpg",
                satuan: "unit",
                jumlah: 0,
                keterangan: "Meja untuk keperluan kantor",
                tahun_pengadaan: 2022
            },
            {
                name: "Pulpen Pilot",
                kode_barang: "BRG003",
                ruangan_id: 3,
                kategori_id: 3,
                image: "https://example.com/images/pulpen-pilot.jpg",
                satuan: "pcs",
                jumlah: 0,
                keterangan: "Pulpen untuk keperluan kantor",
                tahun_pengadaan: 2022
            }
        ]);
    }
}

module.exports = barangSeeder;