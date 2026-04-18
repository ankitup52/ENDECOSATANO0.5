const mongoose = require('mongoose');

const VoiceSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  voiceUrl: { type: String, required: true },
  duration: { type: Number, default: 0 },
  isPlayed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Voice', VoiceSchema);