import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const Message = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/login';
    throw new Error("Token không tồn tại. Hãy đăng nhập lại.");
  }
  const [senders, setSenders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [token]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/privatesite/messages", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      // Gom nhóm theo SenderId
      const grouped = {};
      (Array.isArray(data) ? data : data.messages || []).forEach(msg => {
        const id = msg.SenderId;
        if (!grouped[id]) {
          grouped[id] = { sender: msg.Sender, SenderId: id, count: 0 };
        }
        grouped[id].count += 1;
      });
      setSenders(Object.values(grouped));
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể tải danh sách tin nhắn.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBySender = async (senderId) => {
    const confirmDelete = await Swal.fire({
      title: 'Xác nhận xóa',
      text: "Bạn có chắc chắn muốn xóa tất cả tin nhắn của người này không?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/privatesite/messages/sender/${senderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSenders(senders.filter(s => s.SenderId !== senderId));
        Swal.fire('Thành công!', data.message || 'Đã xóa tất cả tin nhắn của người này!', 'success');
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi xóa.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  const getUserName = (account) => {
    if (!account) return 'Không xác định';
    if (account.Firstname || account.Lastname) {
      const firstname = account.Firstname || '';
      const lastname = account.Lastname || '';
      return `${firstname} ${lastname}`.trim();
    }
    if (account.Username) {
      return account.Username;
    }
    return account.AccountId;
  };

  return (
    <div className='container-fluid'>
      <div className="row">
        <div className="col-12">
          <div className="card w-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title fw-600 mb-0">Quản lý tin nhắn</h5>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    const confirmDelete = await Swal.fire({
                      title: 'Xác nhận xóa',
                      text: "Bạn có chắc chắn muốn xóa TẤT CẢ tin nhắn không?",
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#3085d6',
                      confirmButtonText: 'Xóa tất cả',
                      cancelButtonText: 'Hủy'
                    });
                    if (!confirmDelete.isConfirmed) return;
                    try {
                      const response = await fetch("http://localhost:3000/privatesite/messages", {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setSenders([]);
                        Swal.fire('Thành công!', data.message || 'Đã xóa tất cả tin nhắn!', 'success');
                      } else {
                        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi xóa.', 'error');
                      }
                    } catch (error) {
                      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
                    }
                  }}
                >
                  Xóa tất cả
                </button>
              </div>
              {loading ? (
                <p className="text-center">Đang tải...</p>
              ) : senders.length === 0 ? (
                <p className="text-center text-muted">Không có tin nhắn nào.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table text-nowrap mb-0 align-middle">
                    <thead className="text-dark fs-4">
                      <tr>
                        <th><h6 className="fw-600 mb-0">Người gửi</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Số lượng tin nhắn</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Lệnh</h6></th>
                      </tr>
                    </thead>
                    <tbody>
                      {senders.map((s) => (
                        <tr key={s.SenderId}>
                          <td>
                            <h6 className="fw-600 mb-1">{getUserName(s.sender)}</h6>
                            <small className="text-muted">{s.SenderId}</small>
                          </td>
                          <td className="text-center">
                            <h6 className="fw-600 mb-1">{s.count}</h6>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteBySender(s.SenderId)}
                            >
                              Xóa 
                            </button>
                          </td>
                        </tr>
                      ))}
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
};

export default Message;