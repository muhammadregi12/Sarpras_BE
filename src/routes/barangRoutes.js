const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barangController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware)

router.get('/', barangController.getAllBarang);
router.get('/:id', barangController.getBarangById);
router.post('/', upload('barang').single('image'), barangController.createBarang);
router.put('/:id', upload('barang').single('image'), barangController.updateBarang);
router.delete('/:id', upload('barang').single('image'), barangController.deleteBarang);

module.exports = router;