const express = require('express');
const { 
  getUsers, sendMessage, getMessages, markAsRead, uploadFile, uploadProfile,
  deleteMessage, editMessage, addReaction, pinMessage, shareLocation, searchMessages
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const router = express.Router();

router.use(protect);
router.get('/users', getUsers);
router.post('/send', sendMessage);
router.get('/messages/:userId', getMessages);
router.put('/mark-read', markAsRead);
router.post('/upload-file', upload.single('file'), uploadFile);
router.post('/upload-profile', upload.single('profilePicture'), uploadProfile);
router.delete('/message/:messageId', deleteMessage);
router.put('/message/:messageId', editMessage);
router.post('/message/:messageId/reaction', addReaction);
router.post('/message/:messageId/pin', pinMessage);
router.post('/share-location', shareLocation);
router.get('/search', searchMessages);

module.exports = router;