import React, { useState } from 'react';
import UserSearch from './UserSearch';

const Sidebar = ({ 
  user, 
  chatRooms, 
  selectedRoom, 
  notifications,
  onSelectRoom, 
  onStartNewChat, 
  onLogout,
  onCloseSidebar 
}) => {
  const [showSearch, setShowSearch] = useState(false);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherUser = (room) => {
    return room.users.find(u => u._id !== user.id);
  };

  return (
    <div className="h-100 d-flex flex-column">
      {/* Header */}
      <div className="p-3 border-bottom bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="me-3">
              <div 
                className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                style={{ width: '40px', height: '40px' }}
              >
                <span className="text-primary fw-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h6 className="mb-0">{user?.name}</h6>
              <small className="opacity-75">{user?.email}</small>
            </div>
          </div>
          
          <div className="dropdown">
            <button
              className="btn btn-link text-white p-0"
              data-bs-toggle="dropdown"
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>
            <ul className="dropdown-menu">
              <li>
                <button className="dropdown-item" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-bottom">
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary flex-fill"
            onClick={() => setShowSearch(!showSearch)}
          >
            <i className="fas fa-search me-2"></i>
            Search Users
          </button>
          <button
            className="btn btn-outline-secondary d-md-none"
            onClick={onCloseSidebar}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {showSearch && (
          <div className="mt-3">
            <UserSearch onStartChat={onStartNewChat} />
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-fill overflow-auto">
        {chatRooms.length === 0 ? (
          <div className="p-3 text-center text-muted">
            <i className="fas fa-comments fa-2x mb-2"></i>
            <p>No conversations yet</p>
            <small>Search for users to start chatting</small>
          </div>
        ) : (
          chatRooms.map((room) => {
            const otherUser = getOtherUser(room);
            const isSelected = selectedRoom?._id === room._id;
            const notificationCount = notifications[room._id] || 0;
            
            return (
              <div
                key={room._id}
                className={`contact-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectRoom(room)}
              >
                <div className="d-flex align-items-center">
                  <div className="me-3 position-relative">
                    <div 
                      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                      style={{ width: '50px', height: '50px' }}
                    >
                      <span className="text-white fw-bold">
                        {otherUser?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {otherUser?.isOnline && (
                      <span className="online-indicator position-absolute bottom-0 end-0"></span>
                    )}
                    {notificationCount > 0 && (
                      <span className="notification-badge position-absolute top-0 end-0">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-fill">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-1">{otherUser?.name}</h6>
                      <small className={isSelected ? 'text-white-50' : 'text-muted'}>
                        {formatTime(room.lastMessageTime)}
                      </small>
                    </div>
                    <p className={`mb-0 ${isSelected ? 'text-white-50' : 'text-muted'}`}>
                      <small>{room.lastMessage || 'No messages yet'}</small>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;