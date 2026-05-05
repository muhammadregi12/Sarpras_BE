require('dotenv').config()

const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

// routes
const authRoutes = require('./routes/authRoutes');
const cabangRoutes = require('./routes/cabangRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const ruanganRoutes = require('./routes/ruanganRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const barangRoutes = require('./routes/barangRoutes');
const barangMasukRoutes = require('./routes/barangmasukRoutes');
const barangKeluarRoutes = require('./routes/barangkeluarRoutes');
const barangMaintenanceRoutes = require('./routes/barangmaintenanceRoutes');
const barangrusakRoutes = require('./routes/barangrusakRoutes');
const importRoutes = require('./routes/importRoutes')
const laporanbarangRoutes = require('./routes/laporanRoutes')
const scanRoutes = require('./routes/scanRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')

// cors
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// src/upload
app.use("/public", express.static(path.join(__dirname, "..", "public")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/cabangs", cabangRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/ruangans", ruanganRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/barangs", barangRoutes);
app.use("/api/barangmasuk", barangMasukRoutes);
app.use("/api/barangkeluar", barangKeluarRoutes);
app.use("/api/barangrusak", barangrusakRoutes);
app.use("/api/barangmaintenance", barangMaintenanceRoutes);
app.use("/api/import", importRoutes);
app.use("/api/laporan", laporanbarangRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.get('/', (req, res) => {
    res.send('Hallo Developer')
})

module.exports = app