const Group = require('../models/Group.model');
const Message = require('../models/Message.model');

const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const group = await Group.create({
      name, description,
      admin: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }, ...members.map(m => ({ user: m }))]
    });
    await group.populate('members.user', 'username profilePicture');
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'username profilePicture')
      .populate('admin', 'username');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username profilePicture')
      .populate('replyTo')
      .populate('reactions.userId', 'username');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }
    if (!group.members.some(m => m.user.toString() === req.body.userId)) {
      group.members.push({ user: req.body.userId });
      await group.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }
    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    await group.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const makeAdmin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can make other admins' });
    }
    const member = group.members.find(m => m.user.toString() === req.params.userId);
    if (member) member.role = 'admin';
    await group.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exitGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    group.members = group.members.filter(m => m.user.toString() !== req.user._id.toString());
    await group.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getMyGroups, getGroupMessages, addMember, removeMember, makeAdmin, exitGroup };