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

// cors
app.use(cors({
    origin: "http://localhost:1076",
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

app.get('/', (req, res) => {
    res.send('Hallo Developer')
})

module.exports = app