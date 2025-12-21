// ChatBox.js
import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane, FaImage, FaTrash } from "react-icons/fa";
import "../../Css/Community.css";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const ChatBox = ({ user, messages, setMessages, onClose, currentUser }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [viewImageIndex, setViewImageIndex] = useState(null);
  const [isViewingImage, setIsViewingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Auto scroll xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  // Scroll khi messages thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll khi mới mở chat box
  useEffect(() => {
    // Delay nhỏ để đảm bảo DOM đã render
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [user]);

  const handleSend = async () => {
    if (!inputMessage.trim() && !imageFile) return;
 
    if (imageFile) {
      const formData = new FormData();
      formData.append("SenderId", currentUser.id);
      formData.append("ReceiverId", user.id);
      formData.append("Content", inputMessage);
      formData.append("Image", imageFile);

      try {
        await axios.post("http://localhost:3000/chat/message", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        alert("Gửi ảnh thất bại!");
      }
    } else {
      socket.emit("sendMessage", {
        senderId: currentUser.id,
        receiverId: user.id,
        content: inputMessage,
      });
    }
    setInputMessage("");
    setImageFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setImageFile(file);
  };

  const handleRemoveImage = () => setImageFile(null);

  const handleViewImage = (index) => {
    setViewImageIndex(index);
    setIsViewingImage(true);
  };

  const handleCloseImage = () => {
    setIsViewingImage(false);
  };

  const handlePreviousImage = () => {
    if (viewImageIndex > 0) {
      setViewImageIndex(viewImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (viewImageIndex < messages.length - 1) {
      setViewImageIndex(viewImageIndex + 1);
    }
  };

  return (
    <div className="chat-box-modern">
      {/* Header */}
      <div className="chat-header-modern">
        <div className="d-flex align-items-center">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="chat-avatar-modern" 
          />
          <div className="ms-3">
            <h6 className="mb-0 fw-semibold">{user.name}</h6>
            {user.isStaff && (
              <small className="text-success">
                <span className="badge bg-success-subtle text-success">Nhân viên</span>
              </small>
            )}
          </div>
        </div>
        <button className="close-btn-modern" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-modern">
        {messages.map((msg, index) => {
          const isSentByMe = msg.SenderId === currentUser.id;
          const senderName = isSentByMe ? "Bạn" : user.name;
          
          return (
            <div
              key={index}
              className={`message-wrapper ${isSentByMe ? "message-sent" : "message-received"}`}
            >
              {!isSentByMe && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="message-avatar"
                />
              )}
              
              <div className="message-content-wrapper">
                <div className={`sender-name ${isSentByMe ? "text-end" : "text-start"}`}>
                  <small className="fw-semibold text-muted">{senderName}</small>
                </div>
                
                <div className={`message-bubble-modern ${isSentByMe ? "sent" : "received"}`}>
                  {msg.Content && <div className="bubble-text">{msg.Content}</div>}
                  {msg.ImageUrl && (
                    <img
                      src={`http://localhost:3000${msg.ImageUrl}`}
                      alt="Hình ảnh"
                      className="message-image-modern"
                      onClick={() => handleViewImage(index)}
                    />
                  )}
                  <div className="message-time-modern">
                    {msg.SentAt ? new Date(msg.SentAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : ""}
                  </div>
                </div>
              </div>

              {isSentByMe && (
                <img
                  src={currentUser.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.username || "User")}
                  alt="You"
                  className="message-avatar"
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imageFile && (
        <div className="image-preview-container">
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Preview"
            className="image-preview"
          />
          <button className="remove-preview-btn" onClick={handleRemoveImage}>
            <FaTrash />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-modern">
        <input
          type="text"
          placeholder="Nhập tin nhắn của bạn..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className="message-input-modern"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-input-modern"
        />
        <label htmlFor="file-input-modern" className="file-btn-modern">
          <FaImage />
        </label>
        <button 
          className="send-btn-modern" 
          onClick={handleSend}
          disabled={!inputMessage.trim() && !imageFile}
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* Image Modal */}
      {isViewingImage && (
        <div className="image-modal-modern">
          <button className="close-modal-btn-modern" onClick={handleCloseImage}>
            <FaTimes />
          </button>
          <button
            className="prev-image-btn-modern"
            onClick={handlePreviousImage}
            disabled={viewImageIndex === 0}
          >
            {"<"}
          </button>
          <img
            src={`http://localhost:3000${messages[viewImageIndex].ImageUrl}`}
            alt="Full size"
            className="modal-image-modern"
          />
          <button
            className="next-image-btn-modern"
            onClick={handleNextImage}
            disabled={viewImageIndex === messages.length - 1}
          >
            {">"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
