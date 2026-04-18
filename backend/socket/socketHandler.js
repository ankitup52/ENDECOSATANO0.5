const Message = require('../models/Message.model');
const User = require('../models/User.model');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('user-join', (userId) => {
      socket.join(userId);
      socket.userId = userId;
      console.log(`✅ User ${userId} joined`);
    });
    
    // Private message
    socket.on('private-message', async (data) => {
      try {
        const message = await Message.create({
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          type: data.type || 'text',
          fileUrl: data.fileUrl || ''
        });
        
        const sender = await User.findById(data.senderId).select('username profilePicture');
        
        const messageData = {
          _id: message._id,
          senderId: data.senderId,
          senderName: sender.username,
          senderPicture: sender.profilePicture,
          receiverId: data.receiverId,
          message: data.message,
          type: data.type || 'text',
          fileUrl: data.fileUrl || '',
          createdAt: message.createdAt
        };
        
        io.to(data.receiverId).emit('new-message', messageData);
        socket.emit('message-sent', messageData);
      } catch(err) {
        console.error('Error:', err);
      }
    });
    
    // Group message
    socket.on('group-message', async (data) => {
      const message = await Message.create({
        senderId: data.senderId,
        groupId: data.groupId,
        message: data.message,
        type: data.type || 'text'
      });
      await message.populate('senderId', 'username');
      io.to(`group-${data.groupId}`).emit('new-group-message', message);
    });
    
    // Join group
    socket.on('join-group', (groupId) => {
      socket.join(`group-${groupId}`);
    });
    
    // Typing indicator
    socket.on('typing-start', (data) => {
      socket.to(data.receiverId).emit('user-typing', {
        userId: data.senderId,
        username: data.username,
        isTyping: true
      });
    });
    
    socket.on('typing-stop', (data) => {
      socket.to(data.receiverId).emit('user-typing', {
        userId: data.senderId,
        username: data.username,
        isTyping: false
      });
    });
    
    // Read receipt
    socket.on('mark-read', async (data) => {
      await Message.updateMany(
        { senderId: data.senderId, receiverId: data.receiverId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      socket.to(data.senderId).emit('message-read', {
        receiverId: data.receiverId,
        readAt: new Date()
      });
    });
    
    // ============ WEBRTC CALL HANDLERS ============
    // Check if user is online
    socket.on('check-user-status', async (data) => {
      const targetSocket = await getSocketIdByUserId(data.userId);
      socket.emit('user-status-response', {
        userId: data.userId,
        isOnline: !!targetSocket
      });
    });
    
    // Start call (with ringing)
    socket.on('initiate-call', (data) => {
      console.log(`📞 Initiate call from ${socket.userId} to ${data.to}`);
      // Send ringing event to receiver
      io.to(data.to).emit('incoming-call', {
        from: socket.userId,
        fromName: data.fromName,
        callType: data.callType, // 'video' or 'audio'
        callerId: socket.id
      });
      // Send ringing status to caller
      socket.emit('call-ringing', { to: data.to });
    });
    
    // Accept call
    socket.on('accept-call', (data) => {
      console.log(`📞 Call accepted from ${socket.userId}`);
      io.to(data.callerId).emit('call-accepted', {
        from: socket.userId,
        answer: data.answer
      });
    });
    
    // Reject call (missed call)
    socket.on('reject-call', (data) => {
      console.log(`📞 Call rejected from ${socket.userId}`);
      io.to(data.callerId).emit('call-rejected', {
        from: socket.userId,
        fromName: data.fromName
      });
    });
    
    // Call offer (WebRTC)
    socket.on('call-offer', (data) => {
      console.log(`📞 Call offer from ${socket.id} to ${data.to}`);
      socket.to(data.to).emit('call-offer', {
        from: socket.id,
        fromName: data.fromName,
        offer: data.offer,
        callType: data.callType
      });
    });
    
    socket.on('call-answer', (data) => {
      console.log(`📞 Call answer from ${socket.id} to ${data.to}`);
      socket.to(data.to).emit('call-answer', {
        from: socket.id,
        answer: data.answer
      });
    });
    
    socket.on('call-ice-candidate', (data) => {
      console.log(`📞 ICE candidate from ${socket.id} to ${data.to}`);
      socket.to(data.to).emit('call-ice-candidate', {
        from: socket.id,
        candidate: data.candidate
      });
    });
    
    socket.on('call-end', (data) => {
      console.log(`📞 Call ended from ${socket.id}`);
      if (data.to) {
        socket.to(data.to).emit('call-end');
      }
    });
    
    // User offline response
    socket.on('user-offline', (data) => {
      socket.emit('user-offline-response', {
        userId: data.userId
      });
    });
    
    socket.on('disconnect', async () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
};

// Helper to get socket id by user id (simplified)
async function getSocketIdByUserId(userId) {
  // In production, maintain a map of userId -> socketId
  // For now, return true if user exists in any room
  return true;
}