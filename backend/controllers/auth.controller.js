const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);
    
    res.status(201).json({ success: true, token, user: { _id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    user.status = 'online';
    user.lastActive = new Date();
    await user.save();
    
    const token = generateToken(user._id);
    res.json({ success: true, token, user: { _id: user._id, username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { currentLocation: { lat, lng, address, updatedAt: Date.now() } },
      { new: true }
    );
    res.json({ success: true, location: user.currentLocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, updateLocation };