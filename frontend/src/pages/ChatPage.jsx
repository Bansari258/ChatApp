import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import { authAPI, chatAPI } from '../utils/api';
import { removeToken, getUserFromToken } from '../utils/auth';

const SOCKET_URL = 'http://localhost:5000';

const ChatPage = () => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({});
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initializeUser();
    initializeSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      loadChatRooms();
    } catch (error) {
      console.error('Failed to get user:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      const userData = getUserFromToken();
      if (userData) {
        newSocket.emit('setup', { userId: userData.userId });
      }
    });

    newSocket.on('connected', () => {
      console.log('Socket setup complete');
    });

    newSocket.on('message received', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('new message notification', (data) => {
      if (data.chatRoomId !== selectedRoom?._id) {
        setNotifications(prev => ({
          ...prev,
          [data.chatRoomId]: (prev[data.chatRoomId] || 0) + 1
        }));
        
        toast.info(`New message from ${data.sender.name}`);
      }
    });

    newSocket.on('typing', (data) => {
      // Handle typing indicator
    });

    newSocket.on('stop typing', (data) => {
      // Handle stop typing
    });

    return newSocket;
  };

  const loadChatRooms = async () => {
    try {
      const response = await chatAPI.getChatRooms();
      setChatRooms(response.data);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      toast.error('Failed to load chats');
    }
  };

  const selectRoom = async (room) => {
    setSelectedRoom(room);
    setSidebarVisible(false);
    
    // Clear notifications for this room
    setNotifications(prev => ({
      ...prev,
      [room._id]: 0
    }));

    // Join socket room
    if (socket) {
      socket.emit('join room', room._id);
    }

    try {
      const response = await chatAPI.getChatRoom(room._id);
      setMessages(response.data.messages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (messageText, file = null) => {
    if (!selectedRoom || (!messageText.trim() && !file)) return;

    try {
      let response;
      
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await chatAPI.uploadFile(selectedRoom._id, formData);
      } else {
        response = await chatAPI.sendMessage(selectedRoom._id, messageText);
      }

      // Emit to socket for real-time update
      if (socket) {
        socket.emit('new message', {
          chatRoomId: selectedRoom._id,
          message: response.data
        });
      }

      // Refresh chat rooms to update last message
      loadChatRooms();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const startNewChat = async (userEmail) => {
    try {
      const response = await chatAPI.startChat(userEmail);
      await loadChatRooms();
      selectRoom(response.data);
      toast.success('Chat started!');
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    removeToken();
    navigate('/login');
  };

  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="row g-0 h-100">
        {/* Mobile Menu Button */}
        <div className="d-md-none position-fixed top-0 start-0 p-3" style={{ zIndex: 1001 }}>
          <button
            className="btn btn-primary"
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>

        {/* Sidebar */}
        <div className={`col-md-4 col-lg-3 sidebar ${sidebarVisible ? 'show' : ''}`}>
          <Sidebar
            user={user}
            chatRooms={chatRooms}
            selectedRoom={selectedRoom}
            notifications={notifications}
            onSelectRoom={selectRoom}
            onStartNewChat={startNewChat}
            onLogout={handleLogout}
            onCloseSidebar={() => setSidebarVisible(false)}
          />
        </div>

        {/* Chat Area */}
        <div className="col-md-8 col-lg-9 chat-area">
          {selectedRoom ? (
            <ChatBox
              room={selectedRoom}
              messages={messages}
              currentUser={user}
              onSendMessage={sendMessage}
            />
          ) : (
            <div className="welcome-text">
              <i className="fas fa-comments fa-3x text-muted mb-3"></i>
              <h4>Welcome to Chat App</h4>
              <p>Select a conversation or start a new chat to begin messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;