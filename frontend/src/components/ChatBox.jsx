import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

const ChatBox = ({ room, messages, currentUser, onSendMessage }) => {
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const otherUser = room.users.find(user => user._id !== currentUser.id);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    try {
      await onSendMessage(messageText, selectedFile);
      setMessageText('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-100 d-flex flex-column">
      {/* Chat Header */}
      <div className="p-3 border-bottom bg-light">
        <div className="d-flex align-items-center">
          <div 
            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3"
            style={{ width: '40px', height: '40px' }}
          >
            <span className="text-white fw-bold">
              {otherUser?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h6 className="mb-0">{otherUser?.name}</h6>
            <small className="text-muted">
              {otherUser?.isOnline ? (
                <>
                  <span className="online-indicator me-1"></span>
                  Online
                </>
              ) : (
                <>
                  <span className="offline-indicator me-1"></span>
                  Last seen {new Date(otherUser?.lastSeen).toLocaleDateString()}
                </>
              )}
            </small>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container flex-fill">
        {messages.length === 0 ? (
          <div className="text-center text-muted mt-5">
            <i className="fas fa-comments fa-3x mb-3"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-2 p-2 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i className="fas fa-paperclip me-2 text-muted"></i>
                <span className="small">{selectedFile.name}</span>
                <span className="small text-muted ms-2">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={removeSelectedFile}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="d-none"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <i className="fas fa-paperclip"></i>
            </button>
            
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={sending}
            />
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || (!messageText.trim() && !selectedFile)}
            >
              {sending ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;