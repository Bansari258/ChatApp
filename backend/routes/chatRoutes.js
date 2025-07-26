const express = require('express');
const multer = require('multer');
const path = require('path');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Start or get existing chat
router.post('/start', auth, async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    // Find the other user
    const otherUser = await User.findOne({ email: userEmail });
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({
      users: { $all: [req.user._id, otherUser._id] }
    }).populate('users', '-password').populate('messages.sender', 'name email');

    if (!chatRoom) {
      // Create new chat room
      chatRoom = new ChatRoom({
        users: [req.user._id, otherUser._id],
        messages: []
      });
      await chatRoom.save();
      await chatRoom.populate('users', '-password');
    }

    // Add to contacts if not already there
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { contacts: otherUser.email }
    });
    await User.findByIdAndUpdate(otherUser._id, {
      $addToSet: { contacts: req.user.email }
    });

    res.json(chatRoom);
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all chat rooms for user
router.get('/rooms', auth, async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({
      users: req.user._id
    })
    .populate('users', '-password')
    .sort({ lastMessageTime: -1 });

    res.json(chatRooms);
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific chat room
router.get('/:roomId', auth, async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.roomId)
      .populate('users', '-password')
      .populate('messages.sender', 'name email');

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is part of this chat
    const isUserInChat = chatRoom.users.some(user => 
      user._id.toString() === req.user._id.toString()
    );

    if (!isUserInChat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chatRoom);
  } catch (error) {
    console.error('Get chat room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:roomId/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const chatRoom = await ChatRoom.findById(req.params.roomId);

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const message = {
      sender: req.user._id,
      text,
      messageType: 'text'
    };

    chatRoom.messages.push(message);
    chatRoom.lastMessage = text;
    chatRoom.lastMessageTime = new Date();
    await chatRoom.save();

    await chatRoom.populate('messages.sender', 'name email');
    const newMessage = chatRoom.messages[chatRoom.messages.length - 1];

    res.json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file
router.post('/:roomId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const chatRoom = await ChatRoom.findById(req.params.roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const message = {
      sender: req.user._id,
      text: `Shared a file: ${req.file.originalname}`,
      fileURL: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      messageType: req.file.mimetype.startsWith('image/') ? 'image' : 'file'
    };

    chatRoom.messages.push(message);
    chatRoom.lastMessage = `📎 ${req.file.originalname}`;
    chatRoom.lastMessageTime = new Date();
    await chatRoom.save();

    await chatRoom.populate('messages.sender', 'name email');
    const newMessage = chatRoom.messages[chatRoom.messages.length - 1];

    res.json(newMessage);
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;