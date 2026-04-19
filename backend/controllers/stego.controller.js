const StegoImage = require('../models/StegoImage.model');
const Message = require('../models/Message.model');
const Steganography = require('../utils/steganography.util');
const axios = require('axios');

const encodeStego = async (req, res) => {
  try {
    const { receiverId, secretMessage, fakeMessage, password, allowedLocations, expiresIn, maxViews, useAI, aiPrompt } = req.body;
    
    let imagePath = req.file?.path;
    
    if (useAI === 'true' || useAI === true) {
      const prompt = aiPrompt || secretMessage.substring(0, 50);
      const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512`;
      const response = await axios({ method: 'get', url: aiImageUrl, responseType: 'stream' });
      imagePath = `uploads/ai_${Date.now()}.png`;
      const writer = require('fs').createWriteStream(imagePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
    }
    
    if (!imagePath) return res.status(400).json({ message: 'No image provided' });
    
    const encodedPath = await Steganography.encodeImage(imagePath, secretMessage, fakeMessage || 'Access denied', password);
    
    let expiresAt = null;
    if (expiresIn) { expiresAt = new Date(); expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn)); }
    
    const stego = await StegoImage.create({
      senderId: req.user._id, receiverId, originalImage: imagePath, encodedImage: encodedPath,
      secretData: secretMessage, fakeData: fakeMessage || 'Access denied', password,
      allowedLocations: allowedLocations ? JSON.parse(allowedLocations) : [],
      expiresAt, maxViews: maxViews ? parseInt(maxViews) : 0,
      isAIGenerated: useAI === 'true' || useAI === true, aiPrompt: aiPrompt || ''
    });
    
    const message = await Message.create({
      senderId: req.user._id, receiverId,
      message: useAI ? '🤖 AI Generated Secret Image sent!' : '📸 Secret image sent!',
      type: 'stego', stegoId: stego._id
    });
    
    res.json({ success: true, stego, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const decodeStego = async (req, res) => {
  try {
    const { password, userLocation } = req.body;
    const stego = await StegoImage.findById(req.params.id);
    if (!stego) return res.status(404).json({ message: 'Not found' });
    
    if (stego.expiresAt && new Date() > stego.expiresAt) {
      return res.status(403).json({ message: 'Message expired', expired: true });
    }
    if (stego.maxViews > 0 && stego.viewCount >= stego.maxViews) {
      return res.status(403).json({ message: 'Max views reached', expired: true });
    }
    
    let decodedData, isRealMessage = true;
    try {
      decodedData = await Steganography.decodeImage(
        stego.encodedImage, password,
        userLocation ? JSON.parse(userLocation) : null, stego.allowedLocations
      );
    } catch (error) {
      isRealMessage = false;
      decodedData = { real: stego.fakeData, fake: stego.fakeData };
    }
    
    stego.viewCount++; stego.isDecoded = true;
    if (userLocation) stego.receiverLocation = JSON.parse(userLocation);
    await stego.save();
    
    res.json({
      success: true, decodedMessage: isRealMessage ? decodedData.real : decodedData.fake,
      isReal: isRealMessage, remainingViews: stego.maxViews > 0 ? stego.maxViews - stego.viewCount : null,
      isAIGenerated: stego.isAIGenerated, aiPrompt: stego.aiPrompt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyStegos = async (req, res) => {
  try {
    const stegos = await StegoImage.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
    }).populate('senderId receiverId', 'username');
    res.json(stegos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { encodeStego, decodeStego, getMyStegos };