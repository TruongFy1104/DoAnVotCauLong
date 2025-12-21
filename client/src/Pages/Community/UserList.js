import React from "react";
import { FaSearch } from "react-icons/fa";
import "../../Css/Community.css";

const UserList = ({ users, onUserClick, searchQuery, setSearchQuery }) => {
  console.log("UserList nhận được users:", users);
  
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("Filtered users:", filteredUsers);
  console.log("Số lượng nhân viên:", filteredUsers.filter(u => u.isStaff).length);

  // Format thời gian
  const formatTime = (date) => {
    if (!date) return "";
    
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);
    
    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    
    return date.toLocaleDateString("vi-VN");
  };

  // Format tin nhắn preview
  const getMessagePreview = (user) => {
    if (!user.lastMessage) return "Chưa có tin nhắn";
    
    const msg = user.lastMessage;
    const isSentByCurrentUser = user.lastMessageIsSentByMe;
    const prefix = isSentByCurrentUser ? "Bạn: " : "";
    
    if (msg.ImageUrl && !msg.Content) {
      return `${prefix}📷 Đã gửi hình ảnh`;
    }
    
    const content = msg.Content || "";
    return `${prefix}${content.length > 30 ? content.substring(0, 30) + "..." : content}`;
  };

  return (
    <div className="community-sidebar">
      <div className="sidebar-header">
        <h2>Đoạn chat</h2>
      </div>

      <div className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="user-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserClick(user)}
              className={`user-item ${user.isStaff ? 'staff-user' : ''}`}
            >
              <div className="user-avatar-wrapper">
                <img
                  src={
                    user.avatar && user.avatar !== "/default-avatar.png"
                      ? user.avatar
                      : "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(user.name)
                  }
                  alt={user.name}
                  className="user-avatar"
                />
                {user.isStaff && <span className="staff-badge">✓</span>}
              </div>
              <div className="user-info">
                <div className="user-name-row">
                  <p className="user-name">
                    {user.name}
                    {user.isStaff && <span className="staff-label-inline">Nhân viên</span>}
                  </p>
                  {user.lastMessageTime && (
                    <small className="message-time-small">
                      {formatTime(user.lastMessageTime)}
                    </small>
                  )}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <p className="last-message-preview">
                    {getMessagePreview(user)}
                  </p>
                  {user.unreadCount > 0 && (
                    <span className="unread-badge">{user.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">Không tìm thấy người dùng</p>
        )}
      </div>
    </div>
  );
};

export default UserList;