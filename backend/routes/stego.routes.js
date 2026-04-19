const express = require('express');
const { encodeStego, decodeStego, getMyStegos } = require('../controllers/stego.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const router = express.Router();

router.use(protect);
router.post('/encode', upload.single('image'), encodeStego);
router.post('/decode/:id', decodeStego);
router.get('/my-stegos', getMyStegos);

module.exports = router;