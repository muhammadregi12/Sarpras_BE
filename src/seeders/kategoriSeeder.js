const Kategori = require("../models/kategoriModels");

async function kategoriSeeder() {
    const count = await Kategori.count();
    if (count === 0) {
        await Kategori.bulkCreate([
            { name_kategori: "Elektronik" },
            { name_kategori: "Furniture" },
            { name_kategori: "Alat Tulis" }
        ]);
    }
}

module.exports = kategoriSeeder;