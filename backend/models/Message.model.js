const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  message: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'stego', 'file', 'voice', 'location'], default: 'text' },
  fileUrl: { type: String, default: '' },
  stegoId: { type: mongoose.Schema.Types.ObjectId, ref: 'StegoImage' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reaction: { type: String, enum: ['❤️', '👍', '😂', '😮', '😢', '😡'] },
    createdAt: { type: Date, default: Date.now }
  }],
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  readAt: { type: Date },
  deliveredAt: { type: Date },
  pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: { lat: Number, lng: Number, address: String }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);