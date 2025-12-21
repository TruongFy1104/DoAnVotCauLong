import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
const { checkAccount } = require('../Pages/Common');

const UserProfile = ({ onPasswordChange }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/login'
    throw new Error("Token không tồn tại. Hãy đăng nhập lại.");
  }
  const [accountInformation, setAccountInformation] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tab, setTab] = useState("info");
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn chưa đăng nhập!');
      window.location.href = '/login';
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('http://localhost:3000/profileUser', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401 || response.status === 403) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      const data = await response.json();
      const user = data.user || data;
      setAccountInformation({
        username: user.username || user.Username || "",
        email: user.email || user.Email || "",
        mobile: user.mobile || user.Mobile || "",
        lastname: user.lastname || user.Lastname || "",
        firstname: user.firstname || user.Firstname || "",
        address: user.address || user.Address || "",
        gender: user.gender || user.Gender || "",
        userId: user.userId || user.UserId || "",
      });
      if (!response.ok) {
        checkAccount(response)
        throw new Error('Không thể lấy thông tin người dùng');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout - Server không phản hồi');
        Swal.fire('Lỗi', 'Không thể kết nối đến server. Vui lòng thử lại sau.', 'error');
      } else {
        console.error('Error fetching user data:', error);
      }
    }
  };

  const handleProfileUpdate = async () => {
    const updatedData = {
      userId: accountInformation?.userId,
      lastname: accountInformation?.lastname,
      firstname: accountInformation?.firstname,
      gender: accountInformation?.gender,
      address: accountInformation?.address,
      mobile: accountInformation?.mobile,
    };
    try {
      const response = await fetch('http://localhost:3000/updateprofileUser', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.token && typeof data.token === "string" && data.token.trim() !== "") {
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          setAccountInformation(prev => ({
            ...prev,
            ...data.user
          }));
        } else {
          setAccountInformation(prev => ({
            ...prev,
            ...data
          }));
        }
        Swal.fire('Thành công!', 'Cập nhật thông tin thành công.', 'success');
      } else {
        Swal.fire('Thất bại!', 'Có lỗi xảy ra khi cập nhật thông tin.', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire('Lỗi', 'Có lỗi xảy ra', 'error');
    }
  };

  const handlePasswordChange = async () => {
     if (newPassword !== confirmNewPassword) {
    Swal.fire('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp.', 'error');
    return;
  }
    const data = {
      oldPassword: currentPassword,
      newPassword: newPassword,
    };
    try {
      const response = await fetch('http://localhost:3000/profile/changepasswordUser', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await response.json();
        Swal.fire('Thành công!', 'Mật khẩu đã được thay đổi thành công.', 'success');
      } else {
        const error = await response.json();
        Swal.fire('Thất bại!', error.error || 'Có lỗi xảy ra khi thay đổi mật khẩu.', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Swal.fire('Lỗi', 'Có lỗi xảy ra khi thay đổi mật khẩu', 'error');
    }
  };

  const fetchOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn chưa đăng nhập! Vui lòng đăng nhập để xem thông tin đơn hàng.');
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('http://localhost:3000/order', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 403) {
          alert('Bạn không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (response.status === 404) {
          setOrders([]); // Không có đơn hàng
        } else {
          alert('Đã xảy ra lỗi khi lấy thông tin đơn hàng.');
        }
        return;
      }
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout - Server không phản hồi');
        Swal.fire('Lỗi', 'Không thể kết nối đến server. Vui lòng thử lại sau.', 'error');
      } else {
        console.error('Error fetching order data:', error);
        setOrders([]); // Set empty để tránh lỗi render
      }
    }
  };

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('http://localhost:3000/booking-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout - Server không phản hồi');
        Swal.fire('Lỗi', 'Không thể kết nối đến server. Vui lòng thử lại sau.', 'error');
      } else {
        console.error('Error fetching booking history:', error);
        setBookings([]);
      }
    }
  };

  const handleCancelBooking = async (bookingIds) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const result = await Swal.fire({
        title: 'Bạn có chắc muốn hủy đặt sân này?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xác nhận hủy',
        cancelButtonText: 'Quay lại'
      });
      
      if (!result.isConfirmed) return;
      
      const response = await fetch('http://localhost:3000/booking/cancel-many',  {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingIds })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Swal.fire('Thành công!', 'Đã hủy đặt sân.', 'success');
        fetchBookings(); // Refresh lại danh sách
      } else if (response.status === 400 && data.message) {
        Swal.fire('Không thể hủy!', data.message, 'warning');
      } else {
        Swal.fire('Thất bại!', 'Không thể hủy đặt sân.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Có lỗi xảy ra khi hủy đặt sân.', 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const result = await Swal.fire({
      title: 'Xác nhận hủy đơn hàng',
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <label for="cancelReason" style="font-weight: 600; display: block; margin-bottom: 8px;">Lý do hủy:</label>
          <select id="cancelReason" class="swal2-input" style="width: 100%; padding: 10px; margin: 0; box-sizing: border-box;">
            <option value="Đặt nhầm sản phẩm">Đặt nhầm sản phẩm</option>
            <option value="Tìm được giá rẻ hơn">Tìm được giá rẻ hơn</option>
            <option value="Đổi ý không muốn mua">Đổi ý không muốn mua</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>
          <label for="cancelNote" style="font-weight: 600; display: block; margin-top: 15px; margin-bottom: 8px;">Ghi chú thêm:</label>
          <textarea 
            id="cancelNote" 
            placeholder="Nhập ghi chú thêm (nếu có)..." 
            style="width: 100%; min-height: 80px; padding: 10px; margin: 0; box-sizing: border-box; border: 1px solid #d9d9d9; border-radius: 4px; font-family: inherit; font-size: 14px; resize: vertical;"
          ></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xác nhận hủy',
      cancelButtonText: 'Quay lại',
      width: '500px',
      preConfirm: () => {
        const reason = document.getElementById('cancelReason').value;
        const note = document.getElementById('cancelNote') ? document.getElementById('cancelNote').value : '';
        return { reason, note };
      }
    });

    if (!result.isConfirmed) return;

    const { reason, note } = result.value;

    try {
      const response = await fetch(`http://localhost:3000/order/cancel/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          cancelReason: reason,
          cancelNote: note
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        await Swal.fire({
          title: "Đã hủy đơn hàng!",
          html: `
            <div style="text-align: left;">
              <p>${data.message || "Hủy đơn hàng thành công!"}</p>
              <p><strong>Lý do:</strong> ${reason}</p>
              ${note ? `<p><strong>Ghi chú:</strong> ${note}</p>` : ''}
            </div>
          `,
          icon: "success"
        });
        fetchOrder(); // Refresh lại danh sách đơn hàng
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi hủy đơn hàng.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  useEffect(() => {
    if (tab === "info") fetchUserData();
    if (tab === "orders") fetchOrder();
    if (tab === "bookings") fetchBookings();
  }, [tab]);

  // Hàm gom các booking cùng ngày, cùng sân, cùng trạng thái, cùng chi nhánh
  function groupBookings(bookings) {
    const groups = [];
    bookings.forEach(b => {
      const key = `${b.BookingDate}-${b.CourtId}-${b.BranchId}-${b.Status}`;
      let group = groups.find(g => g.key === key);
      if (!group) {
        group = {
          key,
          BookingDate: b.BookingDate,
          CourtId: b.CourtId,
          CourtName: b.CourtName,
          BranchId: b.BranchId,
          BranchName: b.BranchName,
          Status: b.Status,
          BookingIds: [],
          TimeSlotIds: [],
          fullBookings: [] // Lưu toàn bộ booking để có thể truy cập thêm thông tin
        };
        groups.push(group);
      }
      group.BookingIds.push(b.BookingId);
      group.TimeSlotIds.push(b.TimeSlotId);
      group.fullBookings.push(b);
    });
    groups.forEach(g => {
      g.TimeSlotIds.sort((a, b) => a - b);
      g.fullBookings.sort((a, b) => a.TimeSlotId - b.TimeSlotId);
    });
    return groups;
  }

  // Hàm nhóm các khung giờ liên tiếp
  function groupConsecutiveTimeSlots(timeSlotIds) {
    if (timeSlotIds.length === 0) return [];
    const groups = [];
    let currentGroup = [timeSlotIds[0]];
    
    for (let i = 1; i < timeSlotIds.length; i++) {
      if (timeSlotIds[i] === timeSlotIds[i - 1] + 1) {
        currentGroup.push(timeSlotIds[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [timeSlotIds[i]];
      }
    }
    groups.push(currentGroup);
    return groups;
  }

  // Nếu bạn có danh sách timeSlotList để map id sang giờ, ví dụ:
  const timeSlotList = [
    { id: 1, label: "7-8", start: "7:00", end: "8:00" },
    { id: 2, label: "8-9", start: "8:00", end: "9:00" },
    { id: 3, label: "9-10", start: "9:00", end: "10:00" },
    { id: 4, label: "10-11", start: "10:00", end: "11:00" },
    { id: 5, label: "11-12", start: "11:00", end: "12:00" },
    { id: 6, label: "12-13", start: "12:00", end: "13:00" },
    { id: 7, label: "13-14", start: "13:00", end: "14:00" },
    { id: 8, label: "14-15", start: "14:00", end: "15:00" },
    { id: 9, label: "15-16", start: "15:00", end: "16:00" },
    { id: 10, label: "16-17", start: "16:00", end: "17:00" },
    { id: 11, label: "17-18", start: "17:00", end: "18:00" },
    { id: 12, label: "18-19", start: "18:00", end: "19:00" },
    { id: 13, label: "19-20", start: "19:00", end: "20:00" },
    { id: 14, label: "20-21", start: "20:00", end: "21:00" },
    { id: 15, label: "21-22", start: "21:00", end: "22:00" },
    { id: 16, label: "22-23", start: "22:00", end: "23:00" },
  ];
  
  function getTimeLabel(minId, maxId) {
    const start = timeSlotList.find(t => t.id === minId)?.start || `${minId}:00`;
    const end = timeSlotList.find(t => t.id === maxId)?.end || `${maxId}:00`;
    return `${start} - ${end}`;
  }

  function formatConsecutiveSlots(groups) {
    return groups.map(group => {
      const minId = Math.min(...group);
      const maxId = Math.max(...group);
      return getTimeLabel(minId, maxId);
    }).join(' | ');
  }

  return (
    <div className="user-profile-container">
      <h1 className="user-profile-title">Thông tin tài khoản cá nhân</h1>
      <div className="user-profile-flex">
        {/* Sidebar */}
        <div className="user-profile-sidebar">
          <div className="user-profile-avatar-card">
            <img src="/Images/user2.png" alt="avatar" className="user-profile-avatar" />
            <div className="user-profile-group"><b>Nhóm tài khoản:</b> Người dùng</div>
          </div>
        </div>
        {/* Main content */}
        <div className="user-profile-main">
          <div className="user-profile-card">
            {/* Tabs */}
            <div className="user-profile-tabs">
              <button className={tab === "info" ? "profile-tab active" : "profile-tab"} onClick={() => setTab("info")}>Thông tin</button>
              <button className={tab === "password" ? "profile-tab active" : "profile-tab"} onClick={() => setTab("password")}>Đổi mật khẩu</button>
              <button className={tab === "orders" ? "profile-tab active" : "profile-tab"} onClick={() => setTab("orders")}>Lịch sử đơn hàng</button>
              <button className={tab === "bookings" ? "profile-tab active" : "profile-tab"} onClick={() => setTab("bookings")}>Lịch sử đặt sân</button>
            </div>
            {/* Tab content */}
            <div className="user-profile-tab-content">
              {tab === "info" && !accountInformation && (
                <div className="user-profile-container">Đang tải thông tin...</div>
              )}
              {tab === "info" && accountInformation && (
                <form className="user-profile-form">
                  {/* các input chỉnh sửa */}
                  <div className="profile-field">
                    <label>Tên đăng nhập</label>
                    <input value={accountInformation?.username} disabled className="profile-input disabled" />
                  </div>
                  <div className="profile-field">
                    <label>Email</label>
                    <input value={accountInformation?.email} disabled className="profile-input disabled" />
                  </div>
                  <div className="profile-field">
                    <label>Số điện thoại</label>
                    <input value={accountInformation?.mobile} onChange={(e) => setAccountInformation({ ...accountInformation, mobile: e.target.value })} className="profile-input" />
                  </div>
                  <div className="profile-field">
                    <label>Họ</label>
                    <input value={accountInformation?.lastname} onChange={(e) => setAccountInformation({ ...accountInformation, lastname: e.target.value })} className="profile-input" />
                  </div>
                  <div className="profile-field">
                    <label>Tên</label>
                    <input value={accountInformation?.firstname} onChange={(e) => setAccountInformation({ ...accountInformation, firstname: e.target.value })} className="profile-input" />
                  </div>
                  <div className="profile-field">
                    <label>Địa chỉ</label>
                    <input value={accountInformation?.address} onChange={(e) => setAccountInformation({ ...accountInformation, address: e.target.value })} className="profile-input" />
                  </div>
                  <div className="profile-field">
                    <label>Giới tính</label>
                    <select value={accountInformation?.gender || ''} onChange={(e) => setAccountInformation({ ...accountInformation, gender: e.target.value })} className="profile-input">
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <button type="button" className="profile-save-btn" onClick={handleProfileUpdate}>LƯU</button>
                </form>
              )}
              {tab === "password" && (
                <form className="user-profile-form password-form">
                  <div className="profile-field">
                    <label>Mật khẩu cũ</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="profile-input" />
                  </div>
                  <div className="profile-field">
                    <label>Mật khẩu mới</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="profile-input" />
                  </div>
                  <div className="profile-field">
                    <label>Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="profile-input"
                    />
                  </div>
                  <button type="button" className="profile-save-btn" onClick={handlePasswordChange}>LƯU</button>
                </form>
              )}
             {tab === "orders" && (
                <div>
                  <table className="profile-orders-table">
                    <thead>
                      <tr>
                        <th>Mã đơn hàng</th>
                        <th>Ngày đặt</th>
                        <th>Giá tiền</th>
                        <th>Tiến độ giao hàng</th>
                        <th>Chi tiết</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center" }}>Không có đơn hàng nào.</td>
                        </tr>
                      ) : (
                        orders.map(order => {
                          // Xác định tiến độ giao hàng dựa trên OrderStatusId
                          let deliveryStatus = "Chờ xác nhận";
                          let statusColor = "#6c757d"; // Màu xám cho chờ xác nhận
                          
                          if (order.OrderStatusId === 1) {
                            deliveryStatus = "Giao hàng thành công";
                            statusColor = "#28a745"; // Màu xanh lá
                          } else if (order.OrderStatusId === 2) {
                            deliveryStatus = "Chờ xác nhận";
                            statusColor = "#6c757d"; // Màu xám
                          } else if (order.OrderStatusId === 3) {
                            deliveryStatus = "Đang xử lý";
                            statusColor = "#ffc107"; // Màu vàng
                          } else if (order.OrderStatusId === 4) {
                            deliveryStatus = "Đã hủy";
                            statusColor = "#dc3545"; // Màu đỏ
                          } else if (order.OrderStatusId === 5) {
                            deliveryStatus = "Đang vận chuyển";
                            statusColor = "#007bff"; // Màu xanh dương
                          } else if (order.OrderStatusId === 6) {
                            deliveryStatus = "User hủy đơn";
                            statusColor = "#fd7e14"; // Màu cam
                          }
                          
                          // Chỉ cho phép hủy nếu đơn đang xử lý
                          const canCancel = order.OrderStatusId === 3;
                          
                          return (
                            <tr key={order.OrderId}>
                              <td>{order.OrderId}</td>
                              <td>{order.CreateAt ? new Date(order.CreateAt).toLocaleDateString() : ""}</td>
                              <td>{order.TotalPrice?.toLocaleString()} đ</td>
                              <td>
                                <span style={{ 
                                  color: statusColor, 
                                  fontWeight: "bold",
                                  padding: "5px 12px",
                                  borderRadius: "4px",
                                  backgroundColor: `${statusColor}20`,
                                  display: "inline-block",
                                  fontSize: "13px"
                                }}>
                                  {deliveryStatus}
                                </span>
                              </td>
                              <td>
                                <Link to={`/order/${order.OrderId}`} >
                                  <button className="profile-detail-btn">Chi tiết</button>
                                </Link>
                              </td>
                              <td>
                                {canCancel && (
                                  <button 
                                    className="profile-detail-btn" 
                                    style={{ backgroundColor: "#dc3545", color: "white" }}
                                    onClick={() => handleCancelOrder(order.OrderId)}
                                  >
                                    Hủy đơn
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "bookings" && (
                <div>
                  <table className="profile-orders-table">
                    <thead>
                      <tr>
                        <th>Đơn</th>
                        <th>Ngày</th>
                        <th>Chi nhánh</th>
                        <th>Sân</th>
                        <th>Khung giờ</th>
                        <th>Giá tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: "center" }}>Không có lịch sử đặt sân.</td>
                        </tr>
                      ) : (() => {
                        let orderNumber = 0;
                        return groupBookings(bookings).flatMap((g) => {
                          // Nhóm các khung giờ liên tiếp
                          const consecutiveGroups = groupConsecutiveTimeSlots(g.TimeSlotIds);
                          
                          // Kiểm tra ngày đặt sân đã qua chưa
                          const bookingDate = new Date(g.BookingDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0); // Reset giờ để so sánh chỉ ngày
                          bookingDate.setHours(0, 0, 0, 0);
                          
                          const isPastDate = bookingDate < today; // Đã qua ngày đặt
                          
                          // Chỉ cho hủy nếu trạng thái chưa hủy VÀ chưa qua ngày đặt
                          const canCancel = !["Đã hủy", "User hủy sân", "Thành công"].includes(g.Status) && !isPastDate;
                          
                          // Tạo một dòng cho mỗi nhóm khung giờ liên tiếp
                          return consecutiveGroups.map((slotGroup, groupIdx) => {
                            orderNumber++;
                            const minId = Math.min(...slotGroup);
                            const maxId = Math.max(...slotGroup);
                            const timeDisplay = getTimeLabel(minId, maxId);
                            const totalHours = slotGroup.length;
                            const totalPrice = totalHours * 70000;
                            
                            // Lấy BookingIds tương ứng với các slot này
                            const relevantBookingIds = g.fullBookings
                              .filter(b => slotGroup.includes(b.TimeSlotId))
                              .map(b => b.BookingId);
                            
                            return (
                              <tr key={`${g.key}-${groupIdx}`}>
                                <td><b>#{orderNumber}</b></td>
                                <td>{g.BookingDate}</td>
                                <td>{g.BranchName || `Chi nhánh ${g.BranchId}`}</td>
                                <td>{g.CourtName || `Sân ${g.CourtId}`}</td>
                                <td>
                                  <div style={{ fontWeight: 600, color: '#1d4ed8' }}>
                                    {timeDisplay}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                                    ({totalHours} giờ)
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600, color: '#059669' }}>
                                  {totalPrice.toLocaleString()} đ
                                </td>
                                <td>
                                  <span style={{ 
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    backgroundColor: g.Status === 'Đã đặt thành công' ? '#dcfce7' : 
                                                     g.Status === 'Đã hủy' || g.Status === 'User hủy sân' ? '#fee2e2' : 
                                                     '#fef3c7',
                                    color: g.Status === 'Đã đặt thành công' ? '#16a34a' : 
                                           g.Status === 'Đã hủy' || g.Status === 'User hủy sân' ? '#dc2626' : 
                                           '#d97706'
                                  }}>
                                    {g.Status}
                                  </span>
                                </td>
                                <td>
                                  {canCancel && (
                                    <button
                                      className="profile-detail-btn"
                                      style={{ 
                                        backgroundColor: "#dc3545", 
                                        color: "white",
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '13px'
                                      }}
                                      onClick={() => handleCancelBooking(relevantBookingIds)}
                                    >
                                      Hủy
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default UserProfile;
