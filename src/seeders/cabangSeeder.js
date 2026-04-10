const Cabang = require("../models/cabangModels");

async function cabangSeeder() {
    const count = await Cabang.count();
    if (count === 0) {
        await Cabang.bulkCreate([
            {
                name_cabang: "Cabang A",
                daerah_cabang: "Daerah A"
            },
            {
                name_cabang: "Cabang B",
                daerah_cabang: "Daerah B"
            },
            {
                name_cabang: "Cabang C",
                daerah_cabang: "Daerah C"
            }
        ]);
    }
}

module.exports = cabangSeeder;