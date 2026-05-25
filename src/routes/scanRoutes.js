const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware)

router.get('/ruangan/qrcode/:id', scanController.getQRCodeRuangan);
router.get('/ruangan/qrcode/download/:id', scanController.downloadQRCodeRuangan);
router.get('/ruangan/detail/:id', scanController.getDetailRuangan);
router.get('/ruangan/export-pdf/:id', scanController.exportPDFDetailRuangan);
router.get('/ruangan/qrcode', scanController.getAllQRCodes);

// Barang QR Code Routes
router.get('/barang/qrcode/:id', scanController.getQRCodeBarang);
router.get('/barang/qrcode/download/:id', scanController.downloadQRCodeBarang);
router.get('/barang/detail/:id', scanController.getDetailBarang);
router.get('/barang/qrcode', scanController.getAllQRCodesBarang);

module.exports = router;