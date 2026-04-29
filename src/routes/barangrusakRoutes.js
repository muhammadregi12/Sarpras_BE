const express = require('express');
const router = express.Router();
const barangRusakController = require('../controllers/barangrusakController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware)

router.get('/export/pdf', authMiddleware, barangRusakController.exportPDFBarangRusak);
router.get('/export/excel', authMiddleware, barangRusakController.exportExcelBarangRusak);
router.post('/', authMiddleware, barangRusakController.createBarangRusak);
router.get('/', authMiddleware, barangRusakController.getAllBarangRusak);
router.get('/:id', authMiddleware, barangRusakController.getBarangRusakById);
router.put('/:id', authMiddleware, barangRusakController.updateBarangRusak);
router.delete('/:id', authMiddleware, barangRusakController.deleteBarangRusak);

module.exports = router;