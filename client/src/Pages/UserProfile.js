import React, { useEffect, useState } from 'react';
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
  const [tab, setTab] = useState("info"); // Thêm state tab
  // Nếu muốn có lịch sử đơn hàng thật, hãy fetch và lưu vào state orders
  // const [orders, setOrders] = useState([]);
  // const [selectedOrder, setSelectedOrder] = useState(null);

  // Nếu chỉ muốn demo, có thể để ordersSample là mảng rỗng
  const ordersSample = [];

  useEffect(() => {
    fetchUserData();
    // fetchOrder();
  }, []);
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn chưa đăng nhập!');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/profileUser', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAccountInformation(data);
      if (!response.ok) {
        checkAccount(response)
        throw new Error('Không thể lấy thông tin người dùng');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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
        setAccountInformation(data);
        alert('Cập nhật thông tin thành công');
        // Không cập nhật lại token nếu backend không trả về token mới
        // Nếu backend có trả về token mới, chỉ cập nhật khi data.token là string hợp lệ
        if (data.token && typeof data.token === "string" && data.token.trim() !== "") {
          localStorage.setItem('token', data.token);
        }
      } else {
        alert('Có lỗi xảy ra khi cập nhật thông tin');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Có lỗi xảy ra');
    }
  };
  const handlePasswordChange = async () => {
    const data = {
      oldPassword: currentPassword, // Mật khẩu cũ
      newPassword: newPassword,
    };

    try {
      const response = await fetch('http://localhost:3000/profile/changepasswordUser', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Token từ localStorage hoặc session
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Mật khẩu đã được thay đổi thành công');
      } else {
        const error = await response.json();
        alert(error.error); // Hiển thị lỗi nếu có
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Có lỗi xảy ra khi thay đổi mật khẩu');
    }
  };

  return (
    <div className="user-profile-container">
      <h1 className="user-profile-title">
        Thông tin tài khoản cá nhân
      </h1>
      <div className="user-profile-flex">
        {/* Sidebar */}
        <div className="user-profile-sidebar">
          <div className="user-profile-avatar-card">
            <img
              src="/Images/user2.png"
              alt="avatar"
              className="user-profile-avatar"
            />
            <div className="user-profile-group">
              <b>Nhóm tài khoản:</b> Người dùng
            </div>
          </div>
        </div>
        {/* Main content */}
        <div className="user-profile-main">
          <div className="user-profile-card">
            {/* Tabs */}
            <div className="user-profile-tabs">
              <button
                className={tab === "info" ? "profile-tab active" : "profile-tab"}
                onClick={() => setTab("info")}
              >
                Thông tin
              </button>
              <button
                className={tab === "password" ? "profile-tab active" : "profile-tab"}
                onClick={() => setTab("password")}
              >
                Đổi mật khẩu
              </button>
              <button
                className={tab === "orders" ? "profile-tab active" : "profile-tab"}
                onClick={() => setTab("orders")}
              >
                Lịch sử đơn hàng
              </button>
            </div>
            {/* Tab content */}
            <div className="user-profile-tab-content">
              {tab === "info" && (
                <form className="user-profile-form">
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
                    <input
                      value={accountInformation?.mobile}
                      onChange={(e) => setAccountInformation({ ...accountInformation, mobile: e.target.value })}
                      className="profile-input"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Họ</label>
                    <input
                      value={accountInformation?.lastname}
                      onChange={(e) => setAccountInformation({ ...accountInformation, lastname: e.target.value })}
                      className="profile-input"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Tên</label>
                    <input
                      value={accountInformation?.firstname}
                      onChange={(e) => setAccountInformation({ ...accountInformation, firstname: e.target.value })}
                      className="profile-input"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Địa chỉ</label>
                    <input
                      value={accountInformation?.address}
                      onChange={(e) => setAccountInformation({ ...accountInformation, address: e.target.value })}
                      className="profile-input"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Giới tính</label>
                    <select
                      value={accountInformation?.gender || ''}
                      onChange={(e) => setAccountInformation({ ...accountInformation, gender: e.target.value })}
                      className="profile-input"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <button type="button" className="profile-save-btn" onClick={handleProfileUpdate}>
                    LƯU
                  </button>
                </form>
              )}
              {tab === "password" && (
                <form className="user-profile-form password-form">
                  <div className="profile-field">
                    <label>Mật khẩu cũ</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="profile-input"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="profile-input"
                    />
                  </div>
                  <button type="button" className="profile-save-btn" onClick={handlePasswordChange}>
                    LƯU
                  </button>
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
                        <th>Chi tiết </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersSample.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center" }}>Không có đơn hàng nào.</td>
                        </tr>
                      ) : (
                        ordersSample.map(order => (
                          <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.date}</td>
                            <td>{order.total}</td>
                            <td>
                              <button className="profile-detail-btn">Chi tiết</button>
                            </td>
                          </tr>
                        ))
                      )}
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