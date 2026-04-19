# 🔐 EndcoSteNo - Secure Chat Application

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-brightgreen)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-lightgrey)
![License](https://img.shields.io/badge/license-MIT-orange)

**EndcoSteNo** (End-to-End Encrypted Steganography Chat) is a feature-rich, real-time secure chat application that combines **advanced steganography**, **end-to-end encryption**, **video/audio calling**, and **modern chat features** inspired by WhatsApp.

---

## 🚀 Live Demo

[Deploy your own instance on Railway](https://railway.app/)

---

## ✨ Key Features

### 💬 Chat Features
| Feature | Description |
|---------|-------------|
| **Real-time Messaging** | Instant message delivery with Socket.io |
| **End-to-End Encryption** | AES-256 encryption for all messages (🔒 icon) |
| **Typing Indicator** | See when someone is typing |
| **Read Receipts** | Single tick (✓ Sent) and double tick (✓✓ Read) |
| **Online/Offline Status** | Real-time user presence |
| **Last Seen** | Track user's last activity |

### 📎 Media & File Sharing
| Feature | Description |
|---------|-------------|
| **File Sharing** | Send images, PDFs, documents, and more |
| **Voice Messages** | Record and send voice notes |
| **Location Sharing** | Share live location with Google Maps |

### 🔐 Steganography (Advanced)
| Feature | Description |
|---------|-------------|
| **Image Steganography** | Hide secret messages inside images using LSB technique |
| **Fake Message** | Wrong password reveals fake message (plausible deniability) |
| **AI Image Generation** | Generate AI images and hide secrets simultaneously |
| **GPS Location Lock** | Decode only from authorized locations |
| **Self-Destruct** | Messages expire after set time or number of views |

### 📞 Audio/Video Calling
| Feature | Description |
|---------|-------------|
| **Video Calling** | Face-to-face video calls with WebRTC |
| **Audio Calling** | Voice-only calls |
| **Call Controls** | Mute/Unmute, Stop/Start Video |
| **Call Status** | Ringing, Accepted, Rejected, Missed Call |
| **Offline Detection** | Cannot call offline users |

### 👥 Group Chat
| Feature | Description |
|---------|-------------|
| **Create Groups** | Form groups with multiple members |
| **Admin Controls** | Add/remove members, make admins |
| **Group Messages** | Real-time group conversations |

### ✏️ Message Management
| Feature | Description |
|---------|-------------|
| **Reply to Messages** | Threaded conversations |
| **Edit Messages** | Fix typos after sending |
| **Delete Messages** | Remove sent messages |
| **Pin Messages** | Save important messages |
| **Message Reactions** | React with emojis (❤️👍😂😮😢😡) |

### 🔍 Search & Navigation
| Feature | Description |
|---------|-------------|
| **Search Messages** | Find messages by text |
| **Dark/Light Mode** | Toggle between themes |
| **Profile Pictures** | Upload custom avatars |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (MongoDB Atlas) |
| **Real-time** | Socket.io |
| **Encryption** | CryptoJS (AES-256) |
| **WebRTC** | Peer-to-peer video/audio calling |
| **Steganography** | Jimp, LSB technique |
| **AI Image** | Pollinations.ai API |
| **Deployment** | Railway / Render / Ngrok |

---
