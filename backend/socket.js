const jwt = require('jsonwebtoken');
const User = require('./models/User');
const ChatRoom = require('./models/ChatRoom');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Setup user
    socket.on('setup', async (userData) => {
      try {
        socket.userId = userData.userId;
        socket.join(userData.userId);
        
        // Update user online status
        await User.findByIdAndUpdate(userData.userId, { 
          isOnline: true 
        });
        
        socket.emit('connected');
        console.log(`User ${userData.userId} connected`);
      } catch (error) {
        console.error('Setup error:', error);
      }
    });

    // Join chat room
    socket.on('join room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    // Leave chat room
    socket.on('leave room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });

    // Send message
    socket.on('new message', async (data) => {
      try {
        const { chatRoomId, message } = data;
        
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (!chatRoom) return;

        // Save message to database
        chatRoom.messages.push({
          sender: socket.userId,
          text: message.text,
          fileURL: message.fileURL,
          fileName: message.fileName,
          fileType: message.fileType,
          messageType: message.messageType || 'text'
        });
        
        chatRoom.lastMessage = message.text || `📎 ${message.fileName}`;
        chatRoom.lastMessageTime = new Date();
        await chatRoom.save();

        // Populate sender info
        await chatRoom.populate('messages.sender', 'name email');
        const newMessage = chatRoom.messages[chatRoom.messages.length - 1];

        // Emit to all users in the room
        io.to(chatRoomId).emit('message received', newMessage);
        
        // Send notification to offline users
        const otherUsers = chatRoom.users.filter(userId => 
          userId.toString() !== socket.userId
        );
        
        otherUsers.forEach(userId => {
          socket.to(userId.toString()).emit('new message notification', {
            chatRoomId,
            message: newMessage,
            sender: newMessage.sender
          });
        });

      } catch (error) {
        console.error('New message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', (roomId) => {
      socket.to(roomId).emit('typing', {
        userId: socket.userId,
        roomId
      });
    });

    socket.on('stop typing', (roomId) => {
      socket.to(roomId).emit('stop typing', {
        userId: socket.userId,
        roomId
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date()
          });
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }
    });
  });
};

module.exports = { initializeSocket };