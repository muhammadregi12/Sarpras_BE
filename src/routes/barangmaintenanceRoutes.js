const express = require('express');
const router = express.Router();
const barangMaintenanceController = require('../controllers/barangmaintenanceController');
const {authMiddleware} = require('../middleware/authMiddleware');

router.use(authMiddleware)

router.get('/export/pdf', barangMaintenanceController.exportPDFBarangMaintenance);
router.get('/export/excel', barangMaintenanceController.exportExcelBarangMaintenance);
router.post('/', barangMaintenanceController.createBarangMaintenance);
router.get('/', barangMaintenanceController.getAllBarangMaintenance);
router.get('/:id', barangMaintenanceController.getBarangMaintenanceById);
router.put('/:id', barangMaintenanceController.updateBarangMaintenance);
router.put('/selesai/:id', barangMaintenanceController.updateStatusBarangMaintenance);
router.delete('/:id', barangMaintenanceController.deleteBarangMaintenance);

module.exports = router;