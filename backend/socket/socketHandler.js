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
    socket.on('check-user-status', (data) => {
      const rooms = io.sockets.adapter.rooms;
      const isOnline = rooms.has(data.userId);
      socket.emit('user-status-response', {
          userId: data.userId,
          isOnline: isOnline
      });
  });
    socket.on('private-message', async (data) => {
      try {
        let messageType = data.type || 'text';
        const allowedTypes = ['text', 'image', 'stego', 'file', 'voice', 'location', 'encrypted'];
        if (!allowedTypes.includes(messageType)) messageType = 'text';
        
        const message = await Message.create({
          senderId: data.senderId, receiverId: data.receiverId,
          message: data.message, type: messageType, fileUrl: data.fileUrl || '',
          replyTo: data.replyTo || null
        });
        
        const sender = await User.findById(data.senderId).select('username profilePicture');
        
        const messageData = {
          _id: message._id, senderId: data.senderId, senderName: sender?.username || 'Unknown',
          senderPicture: sender?.profilePicture || '', receiverId: data.receiverId,
          message: data.message, type: messageType, fileUrl: data.fileUrl || '',
          createdAt: message.createdAt, isRead: false, replyTo: message.replyTo
        };
        
        io.to(data.receiverId).emit('new-message', messageData);
        socket.emit('message-sent', messageData);
      } catch(err) {
        console.error('Error:', err.message);
      }
    });
    
    socket.on('group-message', async (data) => {
      const message = await Message.create({
        senderId: data.senderId, groupId: data.groupId,
        message: data.message, type: data.type || 'text'
      });
      await message.populate('senderId', 'username');
      io.to(`group-${data.groupId}`).emit('new-group-message', message);
    });
    
    socket.on('join-group', (groupId) => {
      socket.join(`group-${groupId}`);
    });
    
    socket.on('typing-start', (data) => {
      socket.to(data.receiverId).emit('user-typing', { userId: data.senderId, username: data.username, isTyping: true });
    });
    
    socket.on('typing-stop', (data) => {
      socket.to(data.receiverId).emit('user-typing', { userId: data.senderId, username: data.username, isTyping: false });
    });
    
    socket.on('mark-read', async (data) => {
      await Message.updateMany(
        { senderId: data.senderId, receiverId: data.receiverId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      socket.to(data.senderId).emit('message-read', { receiverId: data.receiverId, readAt: new Date() });
    });
    
    // WebRTC Call Handlers
    socket.on('check-user-status', (data) => {
      const rooms = io.sockets.adapter.rooms;
      socket.emit('user-status-response', { userId: data.userId, isOnline: rooms.has(data.userId) });
    });
    
    socket.on('initiate-call', (data) => {
      io.to(data.to).emit('incoming-call', { from: socket.userId, fromName: data.fromName, callType: data.callType, callerId: socket.id });
      socket.emit('call-ringing', { to: data.to });
    });
    
    socket.on('accept-call', (data) => {
      io.to(data.callerId).emit('call-accepted', { from: socket.userId, answer: data.answer });
    });
    
    socket.on('reject-call', (data) => {
      io.to(data.callerId).emit('call-rejected', { from: socket.userId, fromName: data.fromName });
    });
    
    socket.on('call-offer', (data) => {
      socket.to(data.to).emit('call-offer', { from: socket.id, fromName: data.fromName, offer: data.offer, callType: data.callType });
    });
    
    socket.on('call-answer', (data) => {
      socket.to(data.to).emit('call-answer', { from: socket.id, answer: data.answer });
    });
    
    socket.on('call-ice-candidate', (data) => {
      socket.to(data.to).emit('call-ice-candidate', { from: socket.id, candidate: data.candidate });
    });
    
    socket.on('call-end', (data) => {
      if (data.to) socket.to(data.to).emit('call-end');
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
};
