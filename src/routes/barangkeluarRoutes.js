const express = require('express');
const router = express.Router();
const barangKeluarController = require('../controllers/barangkeluarController');

const {authMiddleware} = require('../middleware/authMiddleware');

// middleware auth
router.use(authMiddleware);

router.get('/export/pdf', barangKeluarController.exportPDFBarangKeluar);
router.get('/export/excel', barangKeluarController.exportExcelBarangKeluar);
router.get('/', barangKeluarController.getAllBarangKeluar);
router.get('/:id', barangKeluarController.getBarangKeluarById);
router.post('/', barangKeluarController.createBarangKeluar);
router.put('/:id', barangKeluarController.updateBarangKeluar);
router.delete('/:id', barangKeluarController.deleteBarangKeluar);

module.exports = router;