const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ मिडलवेयर (सबसे ज़रूरी)
app.use(cors());
app.use(express.json());

// ✅ डेटाबेस कनेक्शन
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// ✅ टेस्ट रूट (बस यही एक रूट काफी है)
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from backend! API is working.' });
});

// ✅ रजिस्टर रूट (सिर्फ टेस्ट के लिए)
app.post('/api/auth/register', (req, res) => {
    res.json({ message: 'Register endpoint working! You can now register.' });
});

// ✅ सर्वर स्टार्ट करें
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
