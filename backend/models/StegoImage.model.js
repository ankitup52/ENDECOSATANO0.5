const mongoose = require('mongoose');

const StegoImageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  originalImage: String,
  encodedImage: String,
  secretData: String,
  fakeData: { type: String, default: '' },
  password: String,
  fileType: { type: String, enum: ['text', 'pdf', 'image', 'file'], default: 'text' },
  isDecoded: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  allowedLocations: [{
    lat: Number, lng: Number, radius: Number, name: String
  }],
  isAIGenerated: { type: Boolean, default: false },
  aiPrompt: { type: String, default: '' },
  expiresAt: { type: Date, default: null },
  maxViews: { type: Number, default: 0 },
  senderLocation: { lat: Number, lng: Number },
  receiverLocation: { lat: Number, lng: Number }
}, { timestamps: true });

module.exports = mongoose.model('StegoImage', StegoImageSchema);