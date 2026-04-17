const express = require('express');
const router = express.Router();
const barangMasukController = require('../controllers/barangmasukController');

const { authMiddleware } = require('../middleware/authMiddleware');

// middleware auth
router.use(authMiddleware);

// routes
router.get('/', barangMasukController.getAllBarangMasuk);
router.get('/:id', barangMasukController.getBarangMasukById);
router.post('/', barangMasukController.createBarangMasuk);
router.put('/:id', barangMasukController.updateBarangMasuk);
router.delete('/:id', barangMasukController.deleteBarangMasuk);

module.exports = router;