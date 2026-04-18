const StegoImage = require('../models/StegoImage.model');
const Message = require('../models/Message.model');
const Steganography = require('../utils/steganography.util');
const axios = require('axios');

// Encode with fake message and location lock
const encodeStego = async (req, res) => {
  try {
    const { 
      receiverId, secretMessage, fakeMessage, password, 
      allowedLocations, expiresIn, maxViews, useAI 
    } = req.body;
    
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    
    let imagePath = req.file.path;
    let aiPrompt = null;
    
    // AI Image Generation
    if (useAI === 'true' || useAI === true) {
      const aiPromptText = req.body.aiPrompt || secretMessage.substring(0, 50);
      aiPrompt = aiPromptText;
      
      // Generate AI image (using Pollinations.ai - free)
      const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPromptText)}?width=512&height=512`;
      
      // Download AI image
      const response = await axios({
        method: 'get',
        url: aiImageUrl,
        responseType: 'stream'
      });
      
      const aiImagePath = `uploads/ai_${Date.now()}.png`;
      const writer = require('fs').createWriteStream(aiImagePath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      imagePath = aiImagePath;
    }
    
    // Encode with fake message
    const encodedPath = await Steganography.encodeImage(
      imagePath, 
      secretMessage, 
      fakeMessage || 'No secret message found. Access denied.',
      password
    );
    
    // Parse allowed locations
    let parsedLocations = [];
    if (allowedLocations) {
      parsedLocations = JSON.parse(allowedLocations);
    }
    
    // Calculate expiry date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
    }
    
    const stego = await StegoImage.create({
      senderId: req.user._id,
      receiverId,
      originalImage: imagePath,
      encodedImage: encodedPath,
      secretData: secretMessage,
      fakeData: fakeMessage || 'No secret message found. Access denied.',
      password,
      allowedLocations: parsedLocations,
      expiresAt,
      maxViews: maxViews ? parseInt(maxViews) : 0,
      isAIGenerated: useAI === 'true' || useAI === true,
      aiPrompt: aiPrompt,
      fileType: 'text'
    });
    
    // Create message notification
    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      message: useAI ? '🤖 AI Generated Secret Image sent!' : '📸 Secret image sent!',
      type: 'stego',
      stegoId: stego._id
    });
    
    res.json({ success: true, stego, message });
  } catch (error) {
    console.error('Encode error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Decode with GPS and fake message
const decodeStego = async (req, res) => {
  try {
    const { password, userLocation } = req.body;
    const stego = await StegoImage.findById(req.params.id);
    
    if (!stego) return res.status(404).json({ message: 'Not found' });
    
    // Check expiry
    if (stego.expiresAt && new Date() > stego.expiresAt) {
      return res.status(403).json({ message: 'Message has expired', expired: true });
    }
    
    // Check max views
    if (stego.maxViews > 0 && stego.viewCount >= stego.maxViews) {
      return res.status(403).json({ message: 'Max views reached', expired: true });
    }
    
    let decodedData;
    let isRealMessage = true;
    
    try {
      // Try to decode with real password
      decodedData = await Steganography.decodeImage(
        stego.encodedImage, 
        password,
        userLocation ? JSON.parse(userLocation) : null,
        stego.allowedLocations
      );
    } catch (error) {
      // Wrong password or location - return fake message
      isRealMessage = false;
      decodedData = { real: stego.fakeData, fake: stego.fakeData };
    }
    
    // Update view count
    stego.viewCount++;
    stego.isDecoded = true;
    if (userLocation) {
      stego.receiverLocation = JSON.parse(userLocation);
    }
    await stego.save();
    
    res.json({ 
      success: true, 
      decodedMessage: isRealMessage ? decodedData.real : decodedData.fake,
      isReal: isRealMessage,
      remainingViews: stego.maxViews > 0 ? stego.maxViews - stego.viewCount : null,
      isAIGenerated: stego.isAIGenerated,
      aiPrompt: stego.aiPrompt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my stegos
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

// Generate AI Image only (without encoding)
const generateAIImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512`;
    
    const response = await axios({
      method: 'get',
      url: aiImageUrl,
      responseType: 'stream'
    });
    
    const imagePath = `uploads/ai_${Date.now()}.png`;
    const writer = require('fs').createWriteStream(imagePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    res.json({ success: true, imageUrl: `/${imagePath}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { encodeStego, decodeStego, getMyStegos, generateAIImage };