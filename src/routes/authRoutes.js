const express = require('express');
const router = express.Router();
const authContoller = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload  = require('../middleware/uploadMiddleware');


router.post('/login', authContoller.login);
router.post('/logout', authMiddleware, authContoller.logout);
router.get('/profile', authMiddleware, authContoller.getProfile);
router.put('/profile', authMiddleware, upload('profil').single('image'), authContoller.updateProfile);
router.put('/change-password', authMiddleware, authContoller.updatePassword);

module.exports = router;