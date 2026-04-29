const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { uploadExcel } = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware)

// Route to handle file upload and import
router.post('/barang/excel', uploadExcel.single('file'), importController.importBarang);
router.post('/supplier/excel', uploadExcel.single('file'), importController.importSupplier);
router.post('/cabang/excel', uploadExcel.single('file'), importController.importCabang);

module.exports = router;