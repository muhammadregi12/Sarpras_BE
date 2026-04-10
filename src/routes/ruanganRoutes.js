const express = require('express');
const router = express.Router();
const ruanganController = require('../controllers/ruanganController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware)

router.get('/', ruanganController.getAllRuangan);
router.get('/:id', ruanganController.getRuanganById);
router.post('/', ruanganController.createRuangan);
router.put('/:id', ruanganController.updateRuangan);
router.delete('/:id', ruanganController.deleteRuangan);

module.exports = router;