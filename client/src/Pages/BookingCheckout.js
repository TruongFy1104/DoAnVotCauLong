import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../Css/Style.css";

export default function BookingCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingSlots = location.state?.bookingSlots;
  const [userInfo, setUserInfo] = useState({
    Firstname: "",
    Lastname: "",
    Mobile: "",
    Email: "",
  });
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Bạn cần đăng nhập để tiếp tục.');
      navigate('/login');
      return;
    }
    fetch('http://localhost:3000/checkout/getcustomer', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
      .then((response) => response.json())
      .then((data) => setUserInfo(data))
      .catch(() => Swal.fire('Không thể lấy thông tin khách hàng. Vui lòng thử lại.'));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem("token");
    // Kiểm tra bắt buộc
    if (!userInfo.Firstname || !userInfo.Lastname || !userInfo.Mobile || !userInfo.Email) {
      Swal.fire('Vui lòng nhập đầy đủ họ tên, số điện thoại và email!', '', 'warning');
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookings: bookingSlots.map(slot => ({
            courtId: slot.courtId,
            timeSlotId: slot.timeSlotId,
            bookingDate: slot.bookingDate
          })),
          firstname: userInfo.Firstname,
          lastname: userInfo.Lastname,
          mobile: userInfo.Mobile,
          email: userInfo.Email
        })
      });
      // Này dùng Swal để tạo animation thông báo á fen
      const data = await res.json();
      if (res.ok) {
        setBookingResult(data);
        Swal.fire(
          'Thành công!',
          data.message || 'Đặt sân thành công!',
          'success'
        );
      } else {
        Swal.fire(
          'Thất bại!',
          data.message || 'Đặt sân thất bại!',
          'error'
        );
      }
    } catch (err) {
      Swal.fire(
        'Lỗi',
        'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.',
        'error'
      );
    }
  };

  // Gom nhóm các slot cùng ngày, cùng sân
  const groupedSlots = [];
  bookingSlots.forEach(slot => {
    const key = `${slot.courtId}-${slot.bookingDate}`;
    let group = groupedSlots.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        courtId: slot.courtId,
        courtName: slot.courtName,
        bookingDate: slot.bookingDate,
        timeSlots: []
      };
      groupedSlots.push(group);
    }
    group.timeSlots.push(slot);
  });

  // Sắp xếp các timeSlots trong mỗi group theo timeSlotId tăng dần (nếu cần)
  groupedSlots.forEach(group => {
    group.timeSlots.sort((a, b) => a.timeSlotId - b.timeSlotId);
  });

  // Hàm nhóm các khung giờ liên tiếp
  function groupConsecutiveSlots(slots) {
    if (slots.length === 0) return [];
    const groups = [];
    let currentGroup = [slots[0]];
    
    for (let i = 1; i < slots.length; i++) {
      const prevSlot = slots[i - 1];
      const currSlot = slots[i];
      
      // Kiểm tra nếu slot hiện tại liên tiếp với slot trước (timeSlotId tăng 1)
      if (currSlot.timeSlotId === prevSlot.timeSlotId + 1) {
        currentGroup.push(currSlot);
      } else {
        groups.push(currentGroup);
        currentGroup = [currSlot];
      }
    }
    groups.push(currentGroup);
    return groups;
  }

  // Gom các booking thành nhóm theo sân và ngày
  function groupBookings(bookings) {
    const groups = [];
    bookings.forEach(b => {
      const key = `${b.CourtId}-${b.BookingDate}`;
      let group = groups.find(g => g.key === key);
      if (!group) {
        group = {
          key,
          CourtId: b.CourtId,
          BookingDate: b.BookingDate,
          TimeSlotIds: []
        };
        groups.push(group);
      }
      group.TimeSlotIds.push(b.TimeSlotId);
    });
    // Sắp xếp khung giờ trong mỗi nhóm
    groups.forEach(g => g.TimeSlotIds.sort((a, b) => a - b));
    return groups;
  }

  if (!bookingSlots || bookingSlots.length === 0) {
    return <div>Không có thông tin đặt sân!</div>;
  }

  return (
    <div className="checkout-wrapper">
      <div className="checkout-grid">
        {/* Thông tin khách hàng */}
        <div className="checkout-info">
          <div className="pd-breadcrumb">
            <Link to="/home" className="pd-breadcrumb-link">Đặt sân</Link>
            <span className="pd-breadcrumb-sep">-</span>
            <Link to="/bookingcheckout" className="pd-breadcrumb-link">Xác nhận</Link>
          </div>
          <div className="checkout-section-title">THÔNG TIN KHÁCH HÀNG</div>
          <div className="checkout-row">
            <div className="checkout-field">
              <label>First Name *</label>
              <input
                name="Firstname"
                value={userInfo.Firstname}
                onChange={handleInputChange}
                placeholder="Nhập tên"
              />
            </div>
            <div className="checkout-field">
              <label>Last Name *</label>
              <input
                name="Lastname"
                value={userInfo.Lastname}
                onChange={handleInputChange}
                placeholder="Nhập họ"
              />
            </div>
          </div>
          <div className="checkout-row">
            <div className="checkout-field">
              <label>Phone*</label>
              <input
                name="Mobile"
                value={userInfo.Mobile || ""}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="checkout-field">
              <label>Email Address *</label>
              <input
                name="Email"
                value={userInfo.Email}
                onChange={handleInputChange}
                placeholder="Nhập email"
              />
            </div>
          </div>
        </div>
        {/* Đơn đặt sân */}
        <div className="checkout-order">
          <div className="checkout-section-title">THÔNG TIN ĐẶT SÂN</div>
          <table className="booking-table">
            <thead>
              <tr>
                <th>Đơn</th>
                <th>Sân</th>
                <th>Ngày</th>
                <th>Khung giờ</th>
                <th>Giá</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let orderNumber = 0;
                return groupedSlots.map((group, groupIdx) => {
                  // Nhóm các slot liên tiếp
                  const consecutiveGroups = groupConsecutiveSlots(group.timeSlots);
                  
                  return consecutiveGroups.map((slotGroup, idx) => {
                    orderNumber++;
                    const firstSlot = slotGroup[0];
                    const lastSlot = slotGroup[slotGroup.length - 1];
                    
                    // Tạo label khung giờ
                    const timeLabel = (firstSlot.startTime && lastSlot.endTime)
                      ? `${firstSlot.startTime.slice(0,5)} - ${lastSlot.endTime.slice(0,5)}`
                      : (
                        firstSlot.timeSlotLabel && lastSlot.timeSlotLabel
                          ? `${firstSlot.timeSlotLabel.split('-')[0]} - ${lastSlot.timeSlotLabel.split('-')[1]}`
                          : slotGroup.map(s => s.timeSlotLabel || s.timeSlotId).join(', ')
                        );
                    
                    const slotCount = slotGroup.length;
                    const price = slotCount * 70000;
                    
                    return (
                      <tr key={`${groupIdx}-${idx}`}>
                        <td><b>#{orderNumber}</b></td>
                        <td>{group.courtName || group.courtId}</td>
                        <td className="booking-date">{group.bookingDate}</td>
                        <td>{timeLabel} <span style={{color: '#666'}}>({slotCount} giờ)</span></td>
                        <td><b>{price.toLocaleString()} đ</b></td>
                      </tr>
                    );
                  });
                });
              })()}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}><b>Tổng tiền</b></td>
                <td><b>{(bookingSlots.length * 70000).toLocaleString()} đ</b></td>
              </tr>
              <tr style={{backgroundColor: '#fff3cd'}}>
                <td colSpan={5} style={{textAlign: 'center', padding: '12px', color: '#856404'}}>
                  <i className="fa fa-info-circle" style={{marginRight: 8}}></i>
                  <b>Lưu ý:</b> Các khung giờ liên tiếp sẽ được gộp thành 1 đơn. 
                  Nếu có khoảng trống giữa các giờ đặt, hệ thống sẽ tự động tách thành nhiều đơn riêng biệt.
                </td>
              </tr>
            </tfoot>
          </table>
          {bookingResult && bookingResult.createdBookings && (
            <div style={{ marginTop: 16 }}>
              <b>Đặt thành công các khung giờ:</b>
              <ul>
                {groupBookings(bookingResult.createdBookings).map((g, idx) => {
                  // Lấy các slot thuộc group này
                  const slots = bookingResult.createdBookings.filter(
                    b => b.CourtId === g.CourtId && b.BookingDate === g.BookingDate
                  );
                
                  // Tổng số tiếng
                  const totalHours = slots.length;
                  return (
                    <li key={idx}>
                      Sân: {g.CourtId}, Ngày: {g.BookingDate}, Tổng giờ: ({totalHours} tiếng)
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {!bookingResult && (
            <button className="checkout-btn" onClick={handleCheckout}>HOÀN TẤT ĐẶT SÂN</button>
          )}
        </div>
      </div>
    </div>
  );
}