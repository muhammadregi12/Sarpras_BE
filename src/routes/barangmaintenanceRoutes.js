const express = require('express');
const router = express.Router();
const barangMaintenanceController = require('../controllers/barangmaintenanceController');
const {authMiddleware} = require('../middleware/authMiddleware');

router.use(authMiddleware)

router.get('/export/pdf', authMiddleware, barangMaintenanceController.exportPDFBarangMaintenance);
router.get('/export/excel', authMiddleware, barangMaintenanceController.exportExcelBarangMaintenance);
router.post('/', authMiddleware, barangMaintenanceController.createBarangMaintenance);
router.get('/', authMiddleware, barangMaintenanceController.getAllBarangMaintenance);
router.get('/:id', authMiddleware, barangMaintenanceController.getBarangMaintenanceById);
router.put('/:id', authMiddleware, barangMaintenanceController.updateBarangMaintenance);
router.put('/selesai/:id', authMiddleware, barangMaintenanceController.updateStatusBarangMaintenance);
router.delete('/:id', authMiddleware, barangMaintenanceController.deleteBarangMaintenance);

module.exports = router;