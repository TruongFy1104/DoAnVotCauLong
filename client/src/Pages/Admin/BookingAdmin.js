import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const statusBadge = (status) => {
  if (status === "Thành công" || status === "Đã đặt thành công") return "bg-success";
  if (status === "Đang chờ duyệt" || status === "Chờ duyệt") return "bg-warning";
  if (status === "Đã hủy") return "bg-danger";
  return "bg-secondary";
};

const BookingAdmin = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredBookings, setFilteredBookings] = useState([]);
  const token = localStorage.getItem("token");

  // Lấy danh sách booking
  useEffect(() => {
    fetch("http://localhost:3000/privatesite/all-bookings", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        let arr = Array.isArray(data) ? data : (Array.isArray(data.bookings) ? data.bookings : []);
        setBookings(arr);
        setFilteredBookings(arr);
      })
      .catch(() => {
        setBookings([]);
        setFilteredBookings([]);
      });
  }, [token]);

  // Tìm kiếm theo BookingId
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const filtered = bookings.filter(b =>
      b.BookingId.toString().includes(search)
    );
    setFilteredBookings(filtered);
  };

  // Duyệt sân
  const handleApprove = async (bookingId) => {
    const res = await fetch(`http://localhost:3000/privatesite/approve-booking/${bookingId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      setBookings(bookings =>
        bookings.map(b =>
          b.BookingId === bookingId ? { ...b, Status: "Thành công" } : b
        )
      );
      setFilteredBookings(filteredBookings =>
        filteredBookings.map(b =>
          b.BookingId === bookingId ? { ...b, Status: "Thành công" } : b
        )
      );
      Swal.fire("Thành công!", data.message || "Đã duyệt sân!", "success");
    } else {
      Swal.fire("Lỗi", data.message || "Không thể duyệt sân!", "error");
    }
  };

  // Hủy sân với lý do
  const handleCancelWithReason = async (bookingId, defaultReason = '') => {
    const result = await Swal.fire({
      title: 'Xác nhận hủy sân',
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <label for="cancelReason" style="font-weight: 600; display: block; margin-bottom: 8px;">Lý do hủy:</label>
          <select id="cancelReason" class="swal2-input" style="width: 100%; padding: 10px; margin: 0; box-sizing: border-box;">
            <option value="Khách không đến">Khách không đến</option>
            <option value="Sân bảo trì">Sân bảo trì</option>
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
    console.log("Gửi dữ liệu hủy:", { bookingId, reason, note }); // Debug
    
    const res = await fetch(`http://localhost:3000/privatesite/cancel-booking/${bookingId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason, note })
    });
    const data = await res.json();
    console.log("Response từ server:", data); // Debug
    
    if (res.ok) {
      // Cập nhật state ngay lập tức
      const updateBooking = (b) => 
        b.BookingId === bookingId 
          ? { ...b, Status: "Đã hủy", CancelReason: reason, CancelNote: note || '' } 
          : b;
      
      setBookings(bookings => bookings.map(updateBooking));
      setFilteredBookings(filteredBookings => filteredBookings.map(updateBooking));
      
      // Hiển thị thông báo thành công
      await Swal.fire({
        title: "Đã hủy sân!",
        html: `
          <div style="text-align: left;">
            <p>${data.message || "Hủy sân thành công!"}</p>
            <p><strong>Lý do:</strong> ${reason}</p>
            ${note ? `<p><strong>Ghi chú:</strong> ${note}</p>` : ''}
          </div>
        `,
        icon: "success"
      });
      
      // Reload lại danh sách từ server để đảm bảo dữ liệu đồng bộ
      const refreshRes = await fetch("http://localhost:3000/privatesite/all-bookings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const refreshData = await refreshRes.json();
      const arr = Array.isArray(refreshData) ? refreshData : (Array.isArray(refreshData.bookings) ? refreshData.bookings : []);
      setBookings(arr);
      setFilteredBookings(arr.filter(b => b.BookingId.toString().includes(search)));
    } else {
      Swal.fire("Lỗi", data.message || "Không thể hủy sân!", "error");
    }
  };



  // Sắp xếp theo ngày mới nhất và BookingId giảm dần
  const sortedBookings = Array.isArray(filteredBookings) ? filteredBookings.slice().sort((a, b) => {
    if (a.BookingDate !== b.BookingDate) {
      return b.BookingDate.localeCompare(a.BookingDate);
    }
    return b.BookingId - a.BookingId;
  }) : [];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-lg-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <div className="row">
                <div className="col-lg-6 col-md-6">
                  <h5 className="card-title fw-600 mb-4">Danh sách đặt sân</h5>
                </div>
                <div className="col-lg-6 col-md-6">
                  <form id="findBookingForm" onSubmit={handleSearchSubmit}>
                    <div className="searchForm">
                      <input
                        className="form-control"
                        placeholder="Nhập mã đặt sân để tìm kiếm ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <button type="submit" className="btn btn-default">
                        <i className="ti ti-search"></i>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-post text-nowrap mb-0 align-middle">
                  <thead className="text-dark fs-4">
                    <tr>
                      <th className='text-center'><h6 className="fw-600 mb-0">Mã đặt sân</h6></th>
                      <th className='text-center'><h6 className="fw-600 mb-0">Khách hàng</h6></th>
                      <th className='text-center'><h6 className="fw-600 mb-0">Số điện thoại</h6></th>
                      <th className='text-center'><h6 className="fw-600 mb-0">Sân</h6></th>
                      <th className='text-center'><h6 className="fw-600 mb-0">Khung giờ</h6></th>
                      <th className='text-center'><h6 className="fw-600 mb-0">Ngày</h6></th>
                      <th className='text-center'><h6 className="fw-600 mb-0">Trạng thái</h6></th>
                      <th className='text-center'><h6 className="fw-600 mb-0">Lệnh</h6></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBookings.map((b) => (
                      <tr key={b.BookingId}>
                        <td className="border-bottom-0 text-center">
                          <h6 className="fw-600 mb-0">{b.BookingId}</h6>
                        </td>
                        <td className="border-bottom-0 text-center">
                          <h6 className="fw-600 mb-1">{b.CustomerName || b.CustomerId}</h6>
                        </td>
                        <td className="border-bottom-0 text-center">
                          <h6 className="fw-600 mb-1">{b.Mobile}</h6>
                        </td>
                        <td className="border-bottom-0 text-center">
                          <h6 className="fw-600 mb-1">{b.CourtName || b.CourtId}</h6>
                          <div className="text-muted" style={{ fontSize: 13 }}>
                            {b.BranchName && <span>({b.BranchName})</span>}
                          </div>
                        </td>
                        <td className="border-bottom-0 text-center">
                          <h6 className="fw-600 mb-1">
                            {b.StartTime && b.EndTime
                              ? `${b.StartTime.slice(0,5)} - ${b.EndTime.slice(0,5)}`
                              : b.TimeSlotId}
                          </h6>
                        </td>
                        <td className="border-bottom-0 text-center">
                          <h6 className="fw-600 mb-1">{b.BookingDate}</h6>
                        </td>
                        <td className="border-bottom-0 text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <span className={`badge rounded-3 fw-600 ${statusBadge(b.Status)}`}>
                              {b.Status}
                            </span>
                          </div>
                        </td>
                        <td className="border-bottom-0 text-center">
                          <div className="d-flex gap-2 justify-content-center flex-wrap">
                            {(b.Status === "Đang chờ duyệt" || b.Status === "Chờ duyệt") && (
                              <>
                                <button
                                  className="btn btn-success btn-sm rounded-pill px-3"
                                  onClick={() => handleApprove(b.BookingId)}
                                >
                                  ✓ Duyệt
                                </button>
                                <button
                                  className="btn btn-danger btn-sm rounded-pill px-3"
                                  onClick={() => handleCancelWithReason(b.BookingId, 'Từ chối duyệt')}
                                >
                                  ✗ Từ chối
                                </button>
                              </>
                            )}
                            {(b.Status === "Thành công" || b.Status === "Đã đặt thành công") && (
                              <button
                                className="btn btn-warning btn-sm rounded-pill px-3"
                                onClick={() => handleCancelWithReason(b.BookingId, 'Khách không đến')}
                                title="Hủy sân vì khách không đến"
                              >
                                🚫 Hủy sân
                              </button>
                            )}
                            {b.Status === "Đã hủy" && (
                              <button
                                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Thông tin hủy sân',
                                    html: `
                                      <div style="text-align: left;">
                                        <p><strong>Mã đặt sân:</strong> ${b.BookingId}</p>
                                        <p><strong>Lý do hủy:</strong> ${b.CancelReason || 'Chưa ghi nhận'}</p>
                                        ${b.CancelNote ? `<p><strong>Ghi chú:</strong> ${b.CancelNote}</p>` : ''}
                                        <p><strong>Ngày đặt:</strong> ${b.BookingDate}</p>
                                      </div>
                                    `,
                                    icon: 'info',
                                    confirmButtonText: 'Đóng'
                                  });
                                }}
                                title="Xem lý do hủy"
                              >
                                ℹ️ Chi tiết
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-tools p-5 pt-0 pb-0 m-auto">
              <ul className="pagination pagination-sm" id="pagination"></ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAdmin;