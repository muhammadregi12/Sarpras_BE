const Ruangan = require("../models/ruanganModels");

async function ruanganSeeder() {
    const count = await Ruangan.count();
    if (count === 0) {
        await Ruangan.bulkCreate([
            {
                kode_ruangan: "R001",
                name_ruangan: "Ruangan Administrasi",
            },
            {
                kode_ruangan: "R002",
                name_ruangan: "Ruangan Looker",
            },
            {
                kode_ruangan: "R003",
                name_ruangan: "Ruangan Aula",
            }
        ]);
    }
}

module.exports = ruanganSeeder;