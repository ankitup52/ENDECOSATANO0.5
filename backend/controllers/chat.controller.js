const User = require('../models/User.model');
const Message = require('../models/Message.model');
const Voice = require('../models/Voice.model');
const Group = require('../models/Group.model');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      blockedUsers: { $ne: req.user._id }
    }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const message = await Message.create({
      senderId: req.user._id,
      receiverId: req.body.receiverId,
      message: req.body.message,
      type: req.body.type || 'text',
      fileUrl: req.body.fileUrl || '',
      replyTo: req.body.replyTo || null
    });
    
    await message.populate('senderId', 'username profilePicture');
    await message.populate('replyTo');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user._id }
      ],
      isDeleted: false
    })
    .sort({ createdAt: 1 })
    .populate('senderId', 'username profilePicture')
    .populate('replyTo')
    .populate('reactions.userId', 'username');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    await Message.updateMany(
      { senderId: senderId, receiverId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, fileUrl, fileName: req.file.originalname });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProfile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: `/uploads/${req.file.filename}` },
      { new: true }
    );
    res.json({ success: true, profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    message.isDeleted = true;
    await message.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const msg = await Message.findById(req.params.messageId);
    if (msg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    msg.message = message;
    msg.isEdited = true;
    msg.editedAt = new Date();
    await msg.save();
    res.json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add reaction
const addReaction = async (req, res) => {
  try {
    const { reaction } = req.body;
    const message = await Message.findById(req.params.messageId);
    
    const existingReaction = message.reactions.find(r => r.userId.toString() === req.user._id.toString());
    if (existingReaction) {
      existingReaction.reaction = reaction;
    } else {
      message.reactions.push({ userId: req.user._id, reaction });
    }
    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pin message
const pinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (message.pinnedBy.includes(req.user._id)) {
      message.pinnedBy = message.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      message.pinnedBy.push(req.user._id);
    }
    await message.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: req.params.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: req.params.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add favorite contact
const addFavorite = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favoriteContacts: req.params.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Share location
const shareLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const message = await Message.create({
      senderId: req.user._id,
      receiverId: req.body.receiverId,
      message: `📍 ${address || `${lat}, ${lng}`}`,
      type: 'location',
      location: { lat, lng, address }
    });
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search messages
const searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, message: { $regex: query, $options: 'i' } },
        { receiverId: req.user._id, message: { $regex: query, $options: 'i' } }
      ]
    }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update last seen
const updateLastSeen = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getUsers, sendMessage, getMessages, markAsRead, uploadFile, uploadProfile,
  deleteMessage, editMessage, addReaction, pinMessage, blockUser, unblockUser,
  addFavorite, shareLocation, searchMessages, updateLastSeen
};