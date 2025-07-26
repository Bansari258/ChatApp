import React, { useState } from 'react';
import { userAPI } from '../utils/api';
import { toast } from 'react-toastify';

const UserSearch = ({ onStartChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await userAPI.searchUsers(searchQuery.trim());
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (user) => {
    onStartChat(user.email);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <div className="input-group">
          <input
            type="email"
            className="form-control"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="mt-3">
          <small className="text-muted">Search Results:</small>
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="d-flex justify-content-between align-items-center p-2 border rounded mt-1"
            >
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                  style={{ width: '30px', height: '30px' }}
                >
                  <span className="text-white small">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="fw-bold small">{user.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleStartChat(user)}
              >
                Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;