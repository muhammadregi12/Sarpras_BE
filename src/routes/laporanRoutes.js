const express = require('express');
const router = express.Router();
const laporanbarangController = require('../controllers/laporan/laporanbarangController');
const laporanBarangMasukController = require('../controllers/laporan/laporanbarangmasukController');
const laporanBarangKeluarController = require('../controllers/laporan/laporanbarangkeluarController');
const laporanBarangRusakController = require('../controllers/laporan/laporanbarangrusakController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware)

// laporan barang
router.get('/barang', laporanbarangController.getLaporanBarang);
router.get('/barang/export-pdf', laporanbarangController.exportPDFLaporanBarang);
router.get('/barang/export-excel', laporanbarangController.exportExcelLaporanBarang);

// laporan barang masuk
router.get('/barangmasuk', laporanBarangMasukController.getLaporanBarangMasuk);
router.get('/barangmasuk/export-pdf', laporanBarangMasukController.exportPDFLaporanBarangMasuk);
router.get('/barangmasuk/export-excel', laporanBarangMasukController.exportExcelLaporanBarangMasuk);

// laporan barang keluar
router.get('/barangkeluar', laporanBarangKeluarController.getLaporanBarangKeluar);
router.get('/barangkeluar/export-pdf', laporanBarangKeluarController.exportPDFLaporanBarangKeluar);
router.get('/barangkeluar/export-excel', laporanBarangKeluarController.exportExcelLaporanBarangKeluar);

// laporan barang rusak
router.get('/barangrusak', laporanBarangRusakController.getLaporanBarangRusak);
router.get('/barangrusak/export-pdf', laporanBarangRusakController.exportPDFLaporanBarangRusak);
router.get('/barangrusak/export-excel', laporanBarangRusakController.exportExcelLaporanBarangRusak);

module.exports = router;