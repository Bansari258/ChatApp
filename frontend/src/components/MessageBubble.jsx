import React from 'react';

const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div>
            {message.text && <p className="mb-2">{message.text}</p>}
            <div className="file-message">
              <img
                src={`http://localhost:5000${message.fileURL}`}
                alt={message.fileName}
                className="img-fluid"
                style={{ maxWidth: '300px', maxHeight: '300px' }}
              />
            </div>
          </div>
        );
      
      case 'file':
        return (
          <div>
            {message.text && <p className="mb-2">{message.text}</p>}
            <div className="file-message">
              <div className="d-flex align-items-center">
                <i className="fas fa-file me-2"></i>
                <div>
                  <div className="fw-bold">{message.fileName}</div>
                  <a
                    href={`http://localhost:5000${message.fileURL}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small text-primary"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <p className="mb-0">{message.text}</p>;
    }
  };

  return (
    <div className={`d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      <div className={`message-bubble ${isOwn ? 'sent' : 'received'}`}>
        {!isOwn && (
          <div className="small fw-bold mb-1 opacity-75">
            {message.sender.name}
          </div>
        )}
        
        {renderMessageContent()}
        
        <div className={`message-time ${isOwn ? 'text-end' : 'text-start'}`}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;