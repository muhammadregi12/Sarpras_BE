require('dotenv').config()
const express = require('express');
const app = require('./src/app');

const sequelize = require('./src/config/database');
const PORT = process.env.PORT || 3000

// models
const user = require('./src/models/userModels')
const kategori = require('./src/models/kategoriModels')
const supplier = require('./src/models/supplierModels')
const cabang = require('./src/models/cabangModels')
const ruangan = require('./src/models/ruanganModels')
const barang = require('./src/models/barangModels');
const barangMasuk = require('./src/models/barangmasukModels');
const barangRusak = require('./src/models/barangrusakModels');
const barangMaintenance = require('./src/models/barangmaintenanceModels');
const barangKeluar = require('./src/models/barangkeluarModels');
const relasi = require('./src/models/relasiModels');


// seeder
const userSeeder = require('./src/seeders/userSeeder');
const barangSeeder = require('./src/seeders/barangSeeder');
const cabangSeeder = require('./src/seeders/cabangSeeder');
const ruanganSeeder = require('./src/seeders/ruanganSeeder');
const supplierSeeder = require('./src/seeders/supplierSeeder');
const kategoriSeeder = require('./src/seeders/kategoriSeeder');

const startServer = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        console.log("mysql connected");

        // seeder database
        await userSeeder();
        await cabangSeeder();
        await supplierSeeder();
        await ruanganSeeder();
        await kategoriSeeder();
        await barangSeeder();

        app.listen(PORT, () => {
            console.log(`app running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("unable to connect database", error);
        process.exit(1);
    }
};

startServer();

