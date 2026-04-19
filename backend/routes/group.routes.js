const express = require('express');
const { 
  createGroup, getMyGroups, getGroupMessages, addMember, removeMember, makeAdmin, exitGroup
} = require('../controllers/group.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(protect);
router.post('/create', createGroup);
router.get('/my-groups', getMyGroups);
router.get('/:groupId/messages', getGroupMessages);
router.post('/:groupId/add-member', addMember);
router.delete('/:groupId/remove-member/:userId', removeMember);
router.post('/:groupId/make-admin/:userId', makeAdmin);
router.post('/:groupId/exit', exitGroup);

module.exports = router;