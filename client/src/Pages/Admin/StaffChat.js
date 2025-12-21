import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import Swal from "sweetalert2";
import "../../Css/Community.css";

const socket = io("http://localhost:3000");

const StaffChat = () => {
  const [customers, setCustomers] = useState([]);
  const [customersWithLastMessage, setCustomersWithLastMessage] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [isViewingImage, setIsViewingImage] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentStaffRef = useRef(null);
  const selectedCustomerRef = useRef(null);

  useEffect(() => {
    currentStaffRef.current = currentStaff;
  }, [currentStaff]);

  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  // Lấy thông tin nhân viên hiện tại
  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setCurrentStaff({
          id: user.id,
          username: user.username,
          name: user.firstname && user.lastname 
            ? `${user.firstname} ${user.lastname}` 
            : user.username
        });
      } catch (e) {
        console.error("Không parse được user:", e);
      }
    }
  }, []);

  // Lấy danh sách khách hàng (IdGroup = 2)
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/chat/users", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Chỉ lấy người dùng (IdGroup = 2), không lấy admin và nhân viên khác
        const filteredCustomers = response.data.filter((user) => user.IdGroup === 2);

        const mappedCustomers = filteredCustomers.map((user) => ({
          ...user,
          id: user.AccountId,
          name:
            user.Firstname && user.Lastname
              ? `${user.Firstname} ${user.Lastname}`
              : user.Username,
          avatar:
            user.Avatar ||
            "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(user.Username),
        }));

        setCustomers(mappedCustomers);
        
        // Lấy tin nhắn cuối cùng cho mỗi khách hàng
        if (currentStaff?.id) {
          fetchLastMessages(mappedCustomers);
        }
      } catch (err) {
        console.error("Lỗi khi fetch khách hàng:", err);
      }
    };

    if (currentStaff) {
      fetchCustomers();
    }
  }, [currentStaff]);

  // Lấy tin nhắn cuối cùng cho mỗi khách hàng
  const fetchLastMessages = async (customersList) => {
    try {
      const customersWithMessages = await Promise.all(
        customersList.map(async (customer) => {
          try {
            const response = await axios.get("http://localhost:3000/chat/messages", {
              params: { SenderId: currentStaff.id, ReceiverId: customer.id },
            });
            const messages = response.data;
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
            // Tìm tin nhắn cuối cùng từ staff gửi cho khách hàng này
            const lastStaffMessage = messages
              .filter(msg => msg.SenderId === currentStaff.id && msg.ReceiverId === customer.id)
              .pop();
            
            // Chỉ đếm tin nhắn từ khách hàng GỬI ĐẾN sau tin nhắn cuối staff đã gửi
            let unreadCount = 0;
            if (lastStaffMessage) {
              const lastStaffTime = new Date(lastStaffMessage.SentAt);
              unreadCount = messages.filter(
                msg => msg.SenderId === customer.id && 
                       msg.ReceiverId === currentStaff.id &&
                       new Date(msg.SentAt) > lastStaffTime
              ).length;
            } else {
              // Nếu chưa có tin nhắn nào từ staff, đếm tất cả tin từ khách
              unreadCount = messages.filter(
                msg => msg.SenderId === customer.id && msg.ReceiverId === currentStaff.id
              ).length;
            }
            
            return {
              ...customer,
              lastMessage: lastMessage,
              lastMessageTime: lastMessage ? new Date(lastMessage.SentAt) : null,
              unreadCount: unreadCount
            };
          } catch (err) {
            return { ...customer, lastMessage: null, lastMessageTime: null, unreadCount: 0 };
          }
        })
      );

      // Sắp xếp theo tin nhắn mới nhất
      const sorted = customersWithMessages.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime - a.lastMessageTime;
      });

      setCustomersWithLastMessage(sorted);
    } catch (err) {
      console.error("Lỗi khi fetch tin nhắn cuối:", err);
    }
  };

  // Refresh danh sách khi có tin nhắn mới
  useEffect(() => {
    if (currentStaff && customers.length > 0) {
      fetchLastMessages(customers);
    }
  }, [chatMessages]);

  // Socket listener
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      console.log("SOCKET RECEIVE:", message);
      const currentStaffId = currentStaffRef.current?.id;
      const customerId = selectedCustomerRef.current?.id;

      if (
        (message.SenderId === currentStaffId && message.ReceiverId === customerId) ||
        (message.SenderId === customerId && message.ReceiverId === currentStaffId)
      ) {
        setChatMessages((prev) => [...prev, message]);
      }
    };

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("disconnect", () => console.log("Socket disconnected"));

    return () => {
      socket.off("connect");
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("disconnect");
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const filteredCustomers = customersWithLastMessage.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format tin nhắn preview
  const getMessagePreview = (lastMessage, customerId) => {
    if (!lastMessage) return "Chưa có tin nhắn";
    
    const isSentByStaff = lastMessage.SenderId === currentStaff?.id;
    const prefix = isSentByStaff ? "Bạn: " : "";
    
    if (lastMessage.ImageUrl && !lastMessage.Content) {
      return `${prefix}📷 Đã gửi hình ảnh`;
    }
    
    const content = lastMessage.Content || "";
    return `${prefix}${content.length > 30 ? content.substring(0, 30) + "..." : content}`;
  };

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

  // Chọn khách hàng để chat
  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const response = await axios.get("http://localhost:3000/chat/messages", {
        params: { SenderId: currentStaff.id, ReceiverId: customer.id },
      });
      setChatMessages(response.data);
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn:", error);
    }
  };

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire("Lỗi", "Vui lòng chọn file ảnh", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        Swal.fire("Lỗi", "Kích thước ảnh không được vượt quá 5MB", "error");
        return;
      }
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Mở modal xem ảnh full size
  const handleViewImage = (imageUrl) => {
    setViewImageUrl(imageUrl);
    setIsViewingImage(true);
  };

  // Đóng modal xem ảnh
  const handleCloseImage = () => {
    setIsViewingImage(false);
    setViewImageUrl(null);
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !imageFile) return;
    if (!selectedCustomer) return;

    try {
      if (imageFile) {
        // Gửi tin nhắn có ảnh
        const formData = new FormData();
        formData.append("SenderId", currentStaff.id);
        formData.append("ReceiverId", selectedCustomer.id);
        formData.append("Content", messageInput);
        formData.append("Image", imageFile);

        await axios.post("http://localhost:3000/chat/message", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Gửi tin nhắn text thông thường
        socket.emit("sendMessage", {
          senderId: currentStaff.id,
          receiverId: selectedCustomer.id,
          content: messageInput,
        });
      }
      setMessageInput("");
      handleRemoveImage();
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      Swal.fire("Lỗi", "Không thể gửi tin nhắn", "error");
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title fw-semibold mb-0">💬 Chat với Khách hàng</h5>
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary-subtle text-primary">
                    {filteredCustomers.length} khách hàng
                  </span>
                </div>
              </div>

              <div className="row" style={{ height: "calc(100vh - 250px)" }}>
                {/* Danh sách khách hàng - Sidebar */}
                <div className="col-md-4 pe-0">
                  <div className="border rounded h-100 d-flex flex-column" style={{ backgroundColor: "#fff" }}>
                    {/* Search Box */}
                    <div className="p-3 border-bottom">
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control ps-5"
                          placeholder="Tìm kiếm khách hàng..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <i 
                          className="ti ti-search position-absolute text-muted" 
                          style={{ left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}
                        ></i>
                      </div>
                    </div>

                    {/* Customer List */}
                    <div className="flex-grow-1" style={{ overflowY: "auto" }}>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className={`p-3 border-bottom cursor-pointer position-relative ${
                              selectedCustomer?.id === customer.id 
                                ? "bg-primary-subtle" 
                                : "hover-bg-light"
                            }`}
                            style={{ 
                              cursor: "pointer",
                              transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              if (selectedCustomer?.id !== customer.id) {
                                e.currentTarget.style.backgroundColor = "#f8f9fa";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedCustomer?.id !== customer.id) {
                                e.currentTarget.style.backgroundColor = "#fff";
                              }
                            }}
                          >
                            <div className="d-flex align-items-start">
                              <div className="position-relative flex-shrink-0">
                                <img
                                  src={customer.avatar}
                                  alt={customer.name}
                                  className="rounded-circle"
                                  style={{ 
                                    width: "48px", 
                                    height: "48px", 
                                    objectFit: "cover",
                                    border: "2px solid #e9ecef"
                                  }}
                                />
                              </div>
                              
                              <div className="flex-grow-1 ms-3 overflow-hidden">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6 className="mb-0 fw-semibold" style={{ fontSize: "14px" }}>
                                    {customer.name}
                                  </h6>
                                  {customer.lastMessageTime && (
                                    <small className="text-muted" style={{ fontSize: "11px" }}>
                                      {formatTime(customer.lastMessageTime)}
                                    </small>
                                  )}
                                </div>
                                
                                <p 
                                  className="mb-0 text-muted text-truncate" 
                                  style={{ fontSize: "13px", maxWidth: "180px" }}
                                >
                                  {getMessagePreview(customer.lastMessage)}
                                </p>
                              </div>

                              {customer.unreadCount > 0 && selectedCustomer?.id !== customer.id && (
                                <span 
                                  className="badge bg-danger rounded-pill ms-2"
                                  style={{ fontSize: "10px", minWidth: "20px" }}
                                >
                                  {customer.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5">
                          <i className="ti ti-users-off text-muted mb-2" style={{ fontSize: "48px" }}></i>
                          <p className="text-muted mb-0">Không tìm thấy khách hàng</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Khung Chat - Main Content */}
                <div className="col-md-8 ps-2">
                  <div className="border rounded h-100 d-flex flex-column" style={{ backgroundColor: "#fff" }}>
                    {selectedCustomer ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-3 border-bottom bg-light">
                          <div className="d-flex align-items-center">
                            <img
                              src={selectedCustomer.avatar}
                              alt={selectedCustomer.name}
                              className="rounded-circle"
                              style={{ 
                                width: "45px", 
                                height: "45px", 
                                objectFit: "cover",
                                border: "2px solid #e9ecef"
                              }}
                            />
                          </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                          className="flex-grow-1 p-4" 
                          style={{ 
                            overflowY: "auto",
                            maxHeight: "calc(100vh - 400px)",
                            minHeight: "400px",
                            backgroundColor: "#f8f9fa",
                            backgroundImage: "linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)"
                          }}
                        >
                          {chatMessages.length > 0 ? (
                            chatMessages.map((msg, index) => {
                              const isStaffMessage = msg.SenderId === currentStaff?.id;
                              const senderName = isStaffMessage ? "Bạn" : selectedCustomer.name;
                              
                              return (
                                <div
                                  key={index}
                                  className={`d-flex mb-3 ${
                                    isStaffMessage ? "justify-content-end" : "justify-content-start"
                                  }`}
                                >
                                  {!isStaffMessage && (
                                    <img
                                      src={selectedCustomer.avatar}
                                      alt={senderName}
                                      className="rounded-circle me-2 flex-shrink-0"
                                      style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                    />
                                  )}
                                  
                                  <div style={{ maxWidth: "65%" }}>
                                    <div className={`mb-1 ${isStaffMessage ? "text-end" : "text-start"}`}>
                                      <small className="fw-semibold text-muted" style={{ fontSize: "11px" }}>
                                        {senderName}
                                      </small>
                                    </div>
                                    
                                    {/* Hiển thị ảnh riêng biệt, không bọc trong bubble */}
                                    {msg.ImageUrl && (
                                      <div className="mb-2">
                                        <img
                                          src={`http://localhost:3000${msg.ImageUrl}`}
                                          alt="attachment"
                                          className="img-fluid rounded shadow-sm"
                                          style={{ 
                                            maxWidth: "250px", 
                                            cursor: "pointer",
                                            display: "block"
                                          }}
                                          onClick={() => handleViewImage(`http://localhost:3000${msg.ImageUrl}`)}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Chỉ hiển thị bubble khi có text */}
                                    {msg.Content && (
                                      <div
                                        className={`p-3 rounded-3 shadow-sm ${
                                          isStaffMessage
                                            ? "bg-primary text-white"
                                            : "bg-white border"
                                        }`}
                                        style={{
                                          wordWrap: "break-word",
                                          borderRadius: isStaffMessage 
                                            ? "18px 18px 4px 18px" 
                                            : "18px 18px 18px 4px"
                                        }}
                                      >
                                        <p className="mb-1" style={{ fontSize: "14px", lineHeight: "1.5" }}>
                                          {msg.Content}
                                        </p>
                                        <small 
                                          className={isStaffMessage ? "opacity-75" : "text-muted"} 
                                          style={{ fontSize: "10px" }}
                                        >
                                          {new Date(msg.SentAt).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </small>
                                      </div>
                                    )}
                                    
                                    {/* Nếu chỉ có ảnh không có text, hiển thị thời gian bên dưới */}
                                    {msg.ImageUrl && !msg.Content && (
                                      <small 
                                        className="text-muted d-block" 
                                        style={{ fontSize: "10px", marginTop: "4px" }}
                                      >
                                        {new Date(msg.SentAt).toLocaleTimeString("vi-VN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </small>
                                    )}
                                  </div>

                                  {isStaffMessage && (
                                    <img
                                      src={currentStaff?.avatar || "https://ui-avatars.com/api/?name=Staff"}
                                      alt="You"
                                      className="rounded-circle ms-2 flex-shrink-0"
                                      style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                    />
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-5">
                              <i className="ti ti-message-2-off text-muted mb-2" style={{ fontSize: "48px" }}></i>
                              <p className="text-muted mb-0">Chưa có tin nhắn</p>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-3 border-top bg-white">
                          {/* Image Preview */}
                          {imagePreviewUrl && (
                            <div className="mb-2 position-relative d-inline-block">
                              <img
                                src={imagePreviewUrl}
                                alt="Preview"
                                style={{
                                  maxWidth: "150px",
                                  maxHeight: "150px",
                                  borderRadius: "8px",
                                  border: "2px solid #e9ecef"
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="btn btn-danger btn-sm position-absolute"
                                style={{
                                  top: "-8px",
                                  right: "-8px",
                                  borderRadius: "50%",
                                  width: "28px",
                                  height: "28px",
                                  padding: "0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                ×
                              </button>
                            </div>
                          )}
                          
                          <form onSubmit={handleSendMessage}>
                            <div className="input-group">
                              <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                id="staff-file-input"
                              />
                              <label
                                htmlFor="staff-file-input"
                                className="btn btn-light border-0"
                                style={{
                                  backgroundColor: "#f8f9fa",
                                  borderRadius: "25px 0 0 25px",
                                  cursor: "pointer"
                                }}
                                title="Gửi ảnh"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              </label>
                              <input
                                type="text"
                                className="form-control border-0 ps-3"
                                placeholder="Nhập tin nhắn của bạn..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                style={{ 
                                  backgroundColor: "#f8f9fa"
                                }}
                              />
                              <button 
                                type="submit" 
                                className="btn btn-primary px-4"
                                disabled={!messageInput.trim() && !imageFile}
                                style={{ borderRadius: "0 25px 25px 0" }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="22" y1="2" x2="11" y2="13"></line>
                                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                              </button>
                            </div>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 flex-column">
                        <div className="text-center">
                          <div 
                            className="rounded-circle bg-primary-subtle d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: "100px", height: "100px" }}
                          >
                            <i className="ti ti-message-circle text-primary" style={{ fontSize: "48px" }}></i>
                          </div>
                          <h6 className="fw-semibold mb-2">Chào mừng đến với Chat hỗ trợ</h6>
                          <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                            Chọn một khách hàng bên trái để bắt đầu trò chuyện
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xem ảnh full size */}
      {isViewingImage && viewImageUrl && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={handleCloseImage}
        >
          <button
            onClick={handleCloseImage}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "white",
              fontSize: "32px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.3s",
              zIndex: 10000
            }}
            onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
            onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
          >
            ×
          </button>
          <img
            src={viewImageUrl}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StaffChat;
