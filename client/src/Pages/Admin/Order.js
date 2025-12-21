import  { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Swal from 'sweetalert2';
const { formatDate } = require('../Common');


const Orders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/auth/login';
    throw new Error("Token không tồn tại. Hãy đăng nhập lại.");
  }
  const [status, setStatus] = useState('0');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);  // State để lưu kết quả tìm kiếm

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:3000/privatesite/orders", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Lỗi: ${response.statusText}`);
        }
        const data = await response.json();
        // Sắp xếp đơn hàng mới nhất lên đầu
        const sortedData = data.sort((a, b) => new Date(b.CreateAt) - new Date(a.CreateAt));
        setOrders(sortedData);
        setFilteredOrders(sortedData);  // Cập nhật filteredOrders khi nhận được dữ liệu
      } catch (error) {
        console.error("Error", error);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const filtered = orders.filter(order => 
      order.OrderId.toString().includes(search)  // Tìm kiếm theo ID đơn hàng
    );
    // Sắp xếp kết quả tìm kiếm theo mới nhất
    const sortedFiltered = filtered.sort((a, b) => new Date(b.CreateAt) - new Date(a.CreateAt));
    setFilteredOrders(sortedFiltered);  // Cập nhật kết quả tìm kiếm
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (orderId, statusId, statusName) => {
    try {
      const response = await fetch(`http://localhost:3000/privatesite/orders/changestatus/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status: statusId })
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(orders.map(order => 
          order.OrderId === orderId ? { ...order, OrderStatusId: statusId } : order
        ));
        setFilteredOrders(filteredOrders.map(order => 
          order.OrderId === orderId ? { ...order, OrderStatusId: statusId } : order
        ));
        Swal.fire('Thành công!', `Cập nhật trạng thái ${statusName} thành công!`, 'success');
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi cập nhật trạng thái.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  // Hủy đơn hàng với lý do
  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Xác nhận hủy đơn hàng',
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <label for="cancelReason" style="font-weight: 600; display: block; margin-bottom: 8px;">Lý do hủy:</label>
          <select id="cancelReason" class="swal2-input" style="width: 100%; padding: 10px; margin: 0; box-sizing: border-box;">
            <option value="Khách hủy đơn">Khách hủy đơn</option>
            <option value="Hết hàng">Hết hàng</option>
            <option value="Không liên lạc được khách">Không liên lạc được khách</option>
            <option value="Địa chỉ sai">Địa chỉ sai</option>
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
    console.log("Dữ liệu gửi lên server:", { status: 4, cancelReason: reason, cancelNote: note }); // Debug

    try {
      const response = await fetch(`http://localhost:3000/privatesite/orders/changestatus/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ 
          status: 4,
          cancelReason: reason,
          cancelNote: note
        })
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(orders.map(order => 
          order.OrderId === orderId 
            ? { ...order, OrderStatusId: 4, CancelReason: reason, CancelNote: note } 
            : order
        ));
        setFilteredOrders(filteredOrders.map(order => 
          order.OrderId === orderId 
            ? { ...order, OrderStatusId: 4, CancelReason: reason, CancelNote: note } 
            : order
        ));
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
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi hủy đơn hàng.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-lg-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <div className="row">
                <div className="col-lg-6 col-md-6">
                  <h5 className="card-title fw-600 mb-4">Danh sách đơn hàng</h5>
                </div>
                <div className="col-lg-6 col-md-6">
                  <form id="findOrderForm" onSubmit={handleSearchSubmit}>
                    <div className="searchForm">
                      <input
                        className="form-control"
                        id="searchNameInput"
                        name="name"
                        placeholder="Nhập vào mã đơn hàng để tìm kiếm ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <button type="submit" id="btnSubmit_search" className="btn btn-default">
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
                      <th className='text-center'>
                        <h6 className="fw-600 mb-0">Mã đơn hàng</h6>
                      </th>
                      <th className='text-center'>
                        <h6 className="fw-600 mb-0">Khách hàng</h6>
                      </th>
                      <th className='text-center'>
                        <h6 className="fw-600 mb-0">Thời gian</h6>
                      </th>
                      <th className='text-center'>
                        <h6 className="fw-600 mb-0">Giá trị</h6>
                      </th>
                      <th className='text-center'>
                        <h6 className="fw-600 mb-0">Trạng thái</h6>
                      </th>
                      <th className='text-center'>
                        <h6 className="fw-600 mb-0">Lệnh</h6>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredOrders) && filteredOrders.map((order) => (
                    <tr key={order.OrderId}>
                      <td className="border-bottom-0 text-center">
                        <h6 className="fw-600 mb-0">{order.OrderId}</h6>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <h6 className="fw-600 mb-1">{order.CustomerId}</h6>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <p className="mb-0 fw-normal">{formatDate(order.CreateAt)}</p>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <span className="fw-600">{Number(order.TotalPrice).toLocaleString('vi-VN')} VNĐ</span>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <span className={`badge rounded-3 fw-600 ${
                            order.OrderStatusId === 1 ? "bg-success" : 
                            order.OrderStatusId === 3 ? "bg-warning" : 
                            order.OrderStatusId === 5 ? "bg-primary" : 
                            order.OrderStatusId === 6 ? "bg-warning text-dark" : 
                            "bg-danger"
                          }`}>
                            {order.OrderStatusId === 1 ? "Thành công" : 
                             order.OrderStatusId === 3 ? "Đang xử lí" : 
                             order.OrderStatusId === 4 ? "Đã hủy" : 
                             order.OrderStatusId === 5 ? "Đang vận chuyển" : 
                             order.OrderStatusId === 6 ? "User hủy đơn" : 
                             "Thất bại"}
                          </span>
                        </div>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                          <Link
                            to={`/privatesite/orders/${order.OrderId}`}
                            className="btn btn-info btn-sm rounded-pill px-3"
                            title="Xem chi tiết đơn hàng"
                          >
                            Chi tiết
                          </Link>
                          
                          {/* Nút Xác nhận đơn - Hiển thị khi đơn mới/chờ xử lý (chưa xác nhận) */}
                          {(!order.OrderStatusId || order.OrderStatusId === 2 || (order.OrderStatusId !== 3 && order.OrderStatusId !== 5 && order.OrderStatusId !== 1 && order.OrderStatusId !== 4 && order.OrderStatusId !== 6)) && (
                            <button
                              className="btn btn-primary btn-sm rounded-pill px-3"
                              onClick={() => handleUpdateStatus(order.OrderId, 3, 'xác nhận đơn')}
                              title="Xác nhận đơn hàng"
                            >
                              ✓ Xác nhận đơn
                            </button>
                          )}
                          
                          {/* Nút Xác nhận giao hàng - Hiển thị khi đang xử lý (status = 3) */}
                          {order.OrderStatusId === 3 && (
                            <button
                              className="btn btn-primary btn-sm rounded-pill px-3"
                              onClick={() => handleUpdateStatus(order.OrderId, 5, 'xác nhận giao hàng')}
                              title="Xác nhận đơn đã sẵn sàng giao"
                            >
                              Xác nhận giao hàng
                            </button>
                          )}
                          
                          {/* Nút Thành công - Hiển thị khi đang vận chuyển (status = 5) */}
                          {order.OrderStatusId === 5 && (
                            <button
                              className="btn btn-success btn-sm rounded-pill px-3"
                              onClick={() => handleUpdateStatus(order.OrderId, 1, 'thành công')}
                              title="Đánh dấu giao hàng thành công"
                            >
                              ✔ Thành công
                            </button>
                          )}
                          
                          {/* Nút Hủy - Hiển thị khi chưa hủy và không phải user hủy */}
                          {order.OrderStatusId !== 4 && order.OrderStatusId !== 1 && order.OrderStatusId !== 6 && (
                            <button
                              className="btn btn-warning btn-sm rounded-pill px-3"
                              onClick={() => handleCancelOrder(order.OrderId)}
                              title="Hủy đơn hàng"
                            >
                              Hủy đơn
                            </button>
                          )}
                          
                          {/* Hiển thị thông tin khi đã hủy (bởi admin) */}
                          {order.OrderStatusId === 4 && (
                            <button
                              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                              onClick={() => {
                                Swal.fire({
                                  title: 'Thông tin hủy đơn',
                                  html: `
                                    <div style="text-align: left;">
                                      <p><strong>Mã đơn hàng:</strong> ${order.OrderId}</p>
                                      <p><strong>Lý do hủy:</strong> ${order.CancelReason || 'Chưa ghi nhận'}</p>
                                      ${order.CancelNote ? `<p><strong>Ghi chú:</strong> ${order.CancelNote}</p>` : ''}
                                      <p><strong>Ngày tạo:</strong> ${formatDate(order.CreateAt)}</p>
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
                          
                          {/* Hiển thị thông tin khi user hủy đơn (status = 6) */}
                          {order.OrderStatusId === 6 && (
                            <button
                              className="btn btn-outline-warning btn-sm rounded-pill px-3"
                              onClick={() => {
                                Swal.fire({
                                  title: 'Thông tin hủy đơn bởi khách hàng',
                                  html: `
                                    <div style="text-align: left;">
                                      <p><strong>Mã đơn hàng:</strong> ${order.OrderId}</p>
                                      <p><strong>Người hủy:</strong> Khách hàng</p>
                                      <p><strong>Lý do hủy:</strong> ${order.CancelReason || 'Chưa ghi nhận'}</p>
                                      ${order.CancelNote ? `<p><strong>Ghi chú:</strong> ${order.CancelNote}</p>` : ''}
                                      <p><strong>Ngày tạo:</strong> ${formatDate(order.CreateAt)}</p>
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
export default Orders;
