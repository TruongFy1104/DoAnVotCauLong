import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
const { formatDate } = require('../Common');

const DashboardStaff = () => {
  const [stats, setStats] = useState({
    pendingOrders: [],
    pendingComments: [],
    pendingPosts: []
  });
  const [selectedComment, setSelectedComment] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    // Kiểm tra token và quyền
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = '/Login';
      return;
    }

    const { decodeJWT } = require("../../Pages/Common");
    const decodedToken = decodeJWT(token);
    if (decodedToken.idgroup !== 3) {
      window.location.href = '/privatesite/dashboard';
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Lấy đơn hàng chờ duyệt (OrderStatusId = 2 hoặc null/undefined - chưa xác nhận)
      const ordersRes = await fetch("http://localhost:3000/privatesite/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!ordersRes.ok) {
        console.error("Failed to fetch orders:", ordersRes.status);
        throw new Error(`HTTP error! status: ${ordersRes.status}`);
      }
      
      const ordersData = await ordersRes.json();
      
      console.log('All orders:', ordersData);
      
      // Kiểm tra ordersData có phải là array không
      if (!Array.isArray(ordersData)) {
        console.error("ordersData is not an array:", ordersData);
        throw new Error("Invalid data format from server");
      }
      
      // Lấy các đơn hàng cần xử lý: chưa xác nhận (null/2), đang xử lý (3), đang vận chuyển (5)
      const pending = ordersData.filter(order => 
        !order.OrderStatusId || order.OrderStatusId === 2 || order.OrderStatusId === 3 || order.OrderStatusId === 5
      );
      console.log('Filtered pending orders (awaiting action):', pending);

      // Lấy tất cả bình luận chưa duyệt
      const productsRes = await fetch("http://localhost:3000/products");
      const products = await productsRes.json();
      let allPendingComments = [];
      
      for (const product of products) {
        try {
          const commentsRes = await fetch(
            `http://localhost:3000/comments/admin/${product.ProductId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const comments = await commentsRes.json();
          console.log(`Comments for product ${product.ProductId}:`, comments);
          
          const pendingComments = comments
            .filter(c => !c.IsApproved)
            .map(c => ({ 
              ...c, 
              ProductName: product.ProductName,
              ProductId: product.ProductId
            }));
          allPendingComments = [...allPendingComments, ...pendingComments];
        } catch (error) {
          console.error(`Error fetching comments for product ${product.ProductId}:`, error);
        }
      }

      // Lấy bài viết chờ duyệt
      const postsRes = await fetch("http://localhost:3000/privatesite/posts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const postsData = await postsRes.json();
      const pendingPosts = (Array.isArray(postsData) ? postsData : postsData.posts || [])
        .filter(post => !post.IsApproved && !post.IsHidden);

      console.log('Pending orders:', pending);
      console.log('Pending comments:', allPendingComments);
      console.log('Pending posts:', pendingPosts);

      setStats({
        pendingOrders: pending.slice(0, 10),
        pendingComments: allPendingComments.slice(0, 10),
        pendingPosts: pendingPosts.slice(0, 10)
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Xác nhận đơn hàng (chuyển từ trạng thái mới sang đang xử lý)
  const handleConfirmOrder = async (orderId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/privatesite/orders/changestatus/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 3 })
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire('Thành công!', 'Đã xác nhận đơn hàng!', 'success');
        fetchDashboardData();
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi xác nhận đơn hàng.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  // Xác nhận giao hàng (chuyển từ đang xử lý sang đang vận chuyển)
  const handleConfirmShipping = async (orderId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/privatesite/orders/changestatus/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 5 })
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire('Thành công!', 'Đã xác nhận giao hàng!', 'success');
        fetchDashboardData();
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi cập nhật trạng thái.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  // Xác nhận hoàn thành (chuyển từ đang vận chuyển sang thành công)
  const handleCompleteOrder = async (orderId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/privatesite/orders/changestatus/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 1 })
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire('Thành công!', 'Đơn hàng đã được hoàn thành!', 'success');
        fetchDashboardData();
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
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/privatesite/orders/changestatus/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 4,
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
        fetchDashboardData();
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi hủy đơn hàng.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  const handleApproveComment = async (commentId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/comments/approve/${commentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        Swal.fire('Thành công!', 'Đã duyệt bình luận!', 'success');
        fetchDashboardData();
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể duyệt bình luận', 'error');
    }
  };

  const handleApprovePost = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/privatesite/posts/approve/${postId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        Swal.fire('Thành công!', 'Đã duyệt bài viết!', 'success');
        fetchDashboardData();
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể duyệt bài viết', 'error');
    }
  };

  const viewCommentDetail = (comment) => {
    Swal.fire({
      title: 'Chi tiết bình luận',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Sản phẩm:</strong> ${comment.ProductName}</p>
          <p><strong>Người bình luận:</strong> ${comment.Account?.Firstname || ''} ${comment.Account?.Lastname || ''}</p>
          <p><strong>Nội dung:</strong></p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${comment.CommentText}</p>
          <p><strong>Ngày tạo:</strong> ${new Date(comment.CommentDate).toLocaleString('vi-VN')}</p>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 600
    });
  };

  const viewPostDetail = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/privatesite/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const post = await response.json();
      
      Swal.fire({
        title: 'Chi tiết bài viết',
        html: `
          <div style="text-align: left; padding: 10px; max-height: 500px; overflow-y: auto;">
            <p><strong>Tác giả:</strong> ${post.Account?.Firstname || ''} ${post.Account?.Lastname || ''}</p>
            <p><strong>Nội dung:</strong></p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${post.Content}</p>
            ${post.ImageURL ? `<p><strong>Hình ảnh:</strong><br/><img src="${post.ImageURL}" style="max-width: 100%; border-radius: 8px; margin-top: 10px;"/></p>` : ''}
            <p><strong>Ngày tạo:</strong> ${new Date(post.CreatedAt).toLocaleString('vi-VN')}</p>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: 700
      });
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể tải chi tiết bài viết', 'error');
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 70px)", padding: "24px", backgroundColor: "#f5f5f5" }}>
      <div className="container-fluid">
        <h2 className="mb-4" style={{ fontWeight: 600 }}>Dashboard - Nhân viên</h2>
        
        {/* Thống kê số lượng cần duyệt */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #f59e0b" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Đơn hàng chờ duyệt</h6>
                <h3 className="mb-1" style={{ color: "#f59e0b" }}>
                  {stats.pendingOrders.length}
                </h3>
                <p className="mb-0 text-muted small">Cần xử lý hôm nay</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #3b82f6" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Bình luận chờ duyệt</h6>
                <h3 className="mb-1" style={{ color: "#3b82f6" }}>
                  {stats.pendingComments.length}
                </h3>
                <p className="mb-0 text-muted small">Cần kiểm duyệt</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #10b981" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Bài viết chờ duyệt</h6>
                <h3 className="mb-1" style={{ color: "#10b981" }}>
                  {stats.pendingPosts.length}
                </h3>
                <p className="mb-0 text-muted small">Cần kiểm duyệt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Đơn hàng chờ duyệt */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card shadow" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">Đơn hàng chờ duyệt</h5>
                  <Link to="/privatesite/order" className="btn btn-sm btn-primary">
                    Xem tất cả
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-post text-nowrap mb-0 align-middle">
                    <thead className="text-dark fs-4">
                      <tr>
                        <th className="text-center"><h6 className="fw-600 mb-0">Mã đơn</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Khách hàng</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Tổng tiền</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Ngày tạo</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Trạng thái</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Lệnh</h6></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pendingOrders.length > 0 ? (
                        stats.pendingOrders.map((order) => (
                          <tr key={order.OrderId}>
                            <td className="border-bottom-0 text-center">
                              <h6 className="fw-600 mb-0">{order.OrderId}</h6>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <h6 className="fw-600 mb-1">{order.Customer?.Firstname || ''} {order.Customer?.Lastname || ''}</h6>
                            </td>
                            <td className="border-bottom-0 text-center">
                              {Number(order.TotalPrice || 0).toLocaleString()} đ
                            </td>
                            <td className="border-bottom-0 text-center">
                              <p className="mb-0 fw-normal">
                                {order.CreateAt ? formatDate(order.CreateAt) : 'N/A'}
                              </p>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <span className={`badge rounded-3 fw-600 ${order.OrderStatusId === 1 ? "bg-success" : order.OrderStatusId === 3 ? "bg-warning" : order.OrderStatusId === 5 ? "bg-primary" : "bg-danger"}`}>
                                  {order.OrderStatusId === 1 ? "Thành công" : order.OrderStatusId === 3 ? "Đang xử lí" : order.OrderStatusId === 4 ? "Đã hủy" : order.OrderStatusId === 5 ? "Đang vận chuyển" : "Chờ xác nhận"}
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
                                {(!order.OrderStatusId || order.OrderStatusId === 2) && (
                                  <button
                                    className="btn btn-primary btn-sm rounded-pill px-3"
                                    onClick={() => handleConfirmOrder(order.OrderId)}
                                    title="Xác nhận đơn hàng"
                                  >
                                    ✓ Xác nhận đơn
                                  </button>
                                )}
                                
                                {/* Nút Xác nhận giao hàng - Hiển thị khi đang xử lý (status = 3) */}
                                {order.OrderStatusId === 3 && (
                                  <button
                                    className="btn btn-primary btn-sm rounded-pill px-3"
                                    onClick={() => handleConfirmShipping(order.OrderId)}
                                    title="Xác nhận đơn đã sẵn sàng giao"
                                  >
                                    Xác nhận giao hàng
                                  </button>
                                )}
                                
                                {/* Nút Thành công - Hiển thị khi đang vận chuyển (status = 5) */}
                                {order.OrderStatusId === 5 && (
                                  <button
                                    className="btn btn-success btn-sm rounded-pill px-3"
                                    onClick={() => handleCompleteOrder(order.OrderId)}
                                    title="Đánh dấu giao hàng thành công"
                                  >
                                    ✔ Thành công
                                  </button>
                                )}
                                
                                {/* Nút Hủy - Hiển thị khi chưa hủy và chưa thành công */}
                                {order.OrderStatusId !== 4 && order.OrderStatusId !== 1 && (
                                  <button
                                    className="btn btn-warning btn-sm rounded-pill px-3"
                                    onClick={() => handleCancelOrder(order.OrderId)}
                                    title="Hủy đơn hàng"
                                  >
                                    Hủy đơn
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center text-muted">
                            Không có đơn hàng cần xử lý
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bình luận chờ duyệt */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card shadow" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">Bình luận chờ duyệt</h5>
                  <Link to="/privatesite/comment" className="btn btn-sm btn-primary">
                    Xem tất cả
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table text-nowrap mb-0 align-middle">
                    <thead className="text-dark fs-4">
                      <tr>
                        <th className="text-center"><h6 className="fw-600 mb-0">Sản phẩm</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Người bình luận</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Nội dung</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Ngày tạo</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Lệnh</h6></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pendingComments.length > 0 ? (
                        stats.pendingComments.map((comment) => (
                          <tr key={comment.CommentId}>
                            <td className="border-bottom-0 text-center">
                              <h6 className="fw-600 mb-1">{comment.ProductName || 'N/A'}</h6>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <strong>
                                {comment.Account?.Firstname || ''} {comment.Account?.Lastname || 'Khách'}
                              </strong>
                              <div style={{ color: '#6b7280', fontSize: 12 }}>
                                {comment.Account?.Email || ''}
                              </div>
                            </td>
                            <td className="border-bottom-0">
                              <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {comment.CommentText || comment.Content}
                              </div>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <p className="mb-0 fw-normal">
                                {comment.CommentDate ? formatDate(comment.CommentDate) : (comment.createdAt ? formatDate(comment.createdAt) : 'N/A')}
                              </p>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <div className="d-flex gap-2 justify-content-center flex-wrap">
                                <button 
                                  className="btn btn-success btn-sm rounded-pill px-3"
                                  onClick={() => handleApproveComment(comment.CommentId)}
                                >
                                  ✓ Duyệt
                                </button>
                                <Link
                                  to="/privatesite/comment"
                                  state={{ productId: comment.ProductId }}
                                  className="btn btn-info btn-sm rounded-pill px-3"
                                >
                                  Chi tiết
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">
                            Không có bình luận chờ duyệt
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bài viết chờ duyệt */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card shadow" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">Bài viết chờ duyệt</h5>
                  <Link to="/privatesite/post" className="btn btn-sm btn-primary">
                    Xem tất cả
                  </Link>
                </div>
                <div className="table-responsive">
                  <table className="table text-nowrap mb-0 align-middle">
                    <thead className="text-dark fs-4">
                      <tr>
                        <th><h6 className="fw-600 mb-0">Tiêu đề</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Tác giả</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Ngày tạo</h6></th>
                        <th className="text-center"><h6 className="fw-600 mb-0">Lệnh</h6></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pendingPosts.length > 0 ? (
                        stats.pendingPosts.map((post) => (
                          <tr key={post.PostId}>
                            <td className="border-bottom-0">
                              <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {post.Content?.substring(0, 50)}...
                              </div>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <h6 className="fw-600 mb-1">
                                {post.Account?.Firstname || ''} {post.Account?.Lastname || 'Khách'}
                              </h6>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <h6 className="fw-600 mb-1">
                                {post.CreatedAt ? new Date(post.CreatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                              </h6>
                            </td>
                            <td className="border-bottom-0 text-center">
                              <div className="d-flex gap-2 justify-content-center flex-wrap">
                                <button 
                                  className="btn btn-success btn-sm rounded-pill px-3"
                                  onClick={() => handleApprovePost(post.PostId)}
                                >
                                  ✓ Duyệt
                                </button>
                                <button 
                                  className="btn btn-info btn-sm rounded-pill px-3"
                                  onClick={() => viewPostDetail(post.PostId)}
                                >
                                  Chi tiết
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">
                            Không có bài viết chờ duyệt
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardStaff;
