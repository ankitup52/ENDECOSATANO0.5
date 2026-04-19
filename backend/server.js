const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// मिडलवेयर
app.use(cors());
app.use(express.json());

// डेटाबेस कनेक्शन
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// ✅ टेस्ट रूट (सबसे ज़रूरी)
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from backend!' });
});

// ✅ रजिस्टर रूट (टेस्ट के लिए)
app.post('/api/auth/register', (req, res) => {
    res.json({ message: 'Register endpoint working!' });
});

// ✅ लॉगिन रूट (टेस्ट के लिए)
app.post('/api/auth/login', (req, res) => {
    res.json({ message: 'Login endpoint working!' });
});

// सर्वर स्टार्ट करें
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
