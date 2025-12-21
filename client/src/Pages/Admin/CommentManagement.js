import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";
const getAuth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});
const fmt = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleString();
};

export default function CommentManagement() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyModal, setReplyModal] = useState({
    open: false,
    comment: null,
    data: [],
    loading: false,
    error: "",
  });
  const [productComments, setProductComments] = useState([]);

  // Lấy danh sách sản phẩm
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`, getAuth());
      const list = Array.isArray(res.data) ? res.data : res.data?.result ?? [];
      setProducts(list);
    } catch {
      setProducts([]);
    }
  };

  // Lấy bình luận theo ProductId (tất cả, bao gồm chưa duyệt)
  const fetchCommentsByProduct = async (productId) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/comments/admin/${encodeURIComponent(productId)}`,
        getAuth()
      );
      setComments(Array.isArray(res.data) ? res.data : res.data?.result ?? []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProductComments = async () => {
      setLoading(true);
      try {
        // Lấy danh sách sản phẩm
        const res = await axios.get(`${API}/products`, getAuth());
        const products = Array.isArray(res.data) ? res.data : res.data?.result ?? [];
        // Lấy bình luận từng sản phẩm
        const requests = products.map((p) =>
          axios
            .get(`${API}/comments/admin/${encodeURIComponent(p.ProductId)}`, getAuth())
            .then((r) => ({
              ...p,
              comments: Array.isArray(r.data) ? r.data : r.data?.result ?? [],
            }))
            .catch(() => ({
              ...p,
              comments: [],
            }))
        );
        const results = await Promise.all(requests);
        // Chỉ lấy sản phẩm có bình luận
        const filtered = results
          .filter((p) => p.comments.length > 0)
          .map((p) => ({
            ...p,
            commentCount: p.comments.length,
          }));
        setProductComments(filtered);

        // Nếu có productId từ navigation state (từ DashboardStaff), tự động chọn sản phẩm đó
        if (location.state?.productId) {
          const targetProduct = results.find(
            (p) => p.ProductId === location.state.productId
          );
          if (targetProduct) {
            setSelectedProduct(targetProduct);
            setComments(targetProduct.comments);
          }
        }
      } catch {
        setProductComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductComments();
  }, [location.state]);

  // Modal quản lý phản hồi
  const openReplies = async (comment) => {
    setReplyModal((m) => ({
      ...m,
      open: true,
      comment,
      loading: true,
      error: "",
      data: [],
    }));
    try {
      const res = await axios.get(
        `${API}/comments/${comment.CommentId}/replies`,
        getAuth()
      );
      const data = Array.isArray(res.data) ? res.data : res.data?.result ?? [];
      setReplyModal({ open: true, comment, data, loading: false, error: "" });
    } catch (e) {
      setReplyModal({
        open: true,
        comment,
        data: [],
        loading: false,
        error: e?.response?.data?.message || e.message,
      });
    }
  };

  const deleteReply = async (replyId) => {
    const result = await Swal.fire({
      title: `Xóa phản hồi #${replyId}?`,
      text: "Bạn có chắc chắn muốn xóa phản hồi này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API}/comments/reply/${replyId}`, getAuth());
      setReplyModal((m) => ({
        ...m,
        data: (m.data || []).filter((r) => r.ReplyId !== replyId),
      }));
      Swal.fire({
        title: "Đã xóa!",
        text: "Phản hồi đã được xóa thành công.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Lỗi", e?.response?.data?.message || e.message, "error");
    }
  };

  const closeReplies = () =>
    setReplyModal({
      open: false,
      comment: null,
      data: [],
      loading: false,
      error: "",
    });

  // Duyệt bình luận
  const onApproveComment = async (comment) => {
    const result = await Swal.fire({
      title: `Duyệt bình luận #${comment.CommentId}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Duyệt",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.put(`${API}/comments/approve/${comment.CommentId}`, {}, getAuth());
      Swal.fire("Thành công", "Đã duyệt bình luận!", "success");
      // Cập nhật lại danh sách
      setComments((s) =>
        s.map((x) =>
          x.CommentId === comment.CommentId ? { ...x, IsApproved: true } : x
        )
      );
    } catch (e) {
      Swal.fire("Lỗi", e?.response?.data?.message || e.message, "error");
    }
  };

  // Xóa bình luận
  const onDeleteComment = async (comment) => {
    const result = await Swal.fire({
      title: `Xóa bình luận #${comment.CommentId}?`,
      text: "Bạn có chắc chắn muốn xóa bình luận này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${API}/comments/${comment.CommentId}`, getAuth());
      setComments((s) => s.filter((x) => x.CommentId !== comment.CommentId));
      Swal.fire({
        title: "Đã xóa!",
        text: "Bình luận đã được xóa thành công.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Lỗi", e?.response?.data?.message || e.message, "error");
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card w-100">
            <div className="card-body p-4">
              <h5 className="fw-600 mb-4">Quản lý bình luận theo sản phẩm</h5>
              {!selectedProduct ? (
                <table className="table text-nowrap mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Tên sản phẩm</th>
                      <th>ID</th>
                      <th className="text-center">Số bình luận</th>
                      <th className="text-center">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productComments.map((p) => (
                      <tr key={p.ProductId}>
                        <td>{p.ProductName}</td>
                        <td>{p.ProductId}</td>
                        <td className="text-center">{p.commentCount}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => {
                              setSelectedProduct(p);
                              setComments(p.comments);
                            }}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                    {productComments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">
                          Không có sản phẩm nào có bình luận.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <>
                  <button
                    className="btn btn-secondary mb-3"
                    onClick={() => {
                      setSelectedProduct(null);
                      setComments([]);
                    }}
                  >
                    ← Quay lại danh sách sản phẩm
                  </button>
                  <h6>
                    Bình luận cho sản phẩm:{" "}
                    <strong>{selectedProduct.ProductName}</strong> (ID:{" "}
                    {selectedProduct.ProductId})
                  </h6>
                  {loading ? (
                    <p className="text-center">Đang tải...</p>
                  ) : (
                    <table className="table text-nowrap mb-0 align-middle">
                      <thead>
                        <tr>
                          <th className="text-center">#</th>
                          <th className="text-center">CommentId</th>
                          <th className="text-center">Người bình luận</th>
                          <th className="text-center">Nội dung</th>
                          <th className="text-center">Thời gian</th>
                          <th className="text-center">Trạng thái</th>
                          <th className="text-center">Phản hồi</th>
                          <th className="text-center">Lệnh</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comments.map((c, i) => (
                          <tr key={c.CommentId}>
                            <td className="text-center">{i + 1}</td>
                            <td className="text-center">#{c.CommentId}</td>
                            <td className="text-center">
                              <strong>
                                {c.Account?.Username ||
                                  `${c.Account?.Firstname ?? ""} ${c.Account?.Lastname ?? ""}`}
                              </strong>
                              <div style={{ color: "#6b7280", fontSize: 12 }}>
                                {c.Account?.Email}
                              </div>
                            </td>
                            <td>{c.Content || c.content}</td>
                            <td className="text-center">
                              <span>{fmt(c.createdAt || c.createAt)}</span>
                              <br />
                              <span style={{ color: "#6b7280", fontSize: 12 }}>
                                Sửa: {fmt(c.updatedAt || c.updateAt)}
                              </span>
                            </td>
                            <td className="text-center">
                              {c.IsApproved ? (
                                <span className="badge bg-success">Đã duyệt</span>
                              ) : (
                                <span className="badge bg-warning">Chờ duyệt</span>
                              )}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => openReplies(c)}
                              >
                                Xem phản hồi
                              </button>
                            </td>
                            <td className="text-center">
                              {!c.IsApproved && (
                                <button
                                  className="btn btn-sm btn-success me-1"
                                  onClick={() => onApproveComment(c)}
                                >
                                  Duyệt
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => onDeleteComment(c)}
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                        {comments.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center text-muted">
                              Không có bình luận nào cho sản phẩm này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal quản lý phản hồi */}
      {replyModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: "min(900px, 94vw)",
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <strong>
                Phản hồi của bình luận #{replyModal.comment?.CommentId}
              </strong>
              <button className="btn btn-secondary" onClick={closeReplies}>
                Đóng
              </button>
            </div>
            <div style={{ padding: 12 }}>
              {replyModal.loading && <div>Đang tải phản hồi…</div>}
              {replyModal.error && (
                <div className="alert alert-danger mb-2">
                  ⚠️ {replyModal.error}
                </div>
              )}
              {!replyModal.loading && !replyModal.error && (
                <table className="table text-nowrap mb-0 align-middle">
                  <thead>
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">ReplyId</th>
                      <th className="text-center">Người trả lời</th>
                      <th className="text-center">Nội dung</th>
                      <th className="text-center">Thời gian</th>
                      <th className="text-center">Lệnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replyModal.data.map((rp, i) => (
                      <tr key={rp.ReplyId}>
                        <td className="text-center">{i + 1}</td>
                        <td className="text-center">#{rp.ReplyId}</td>
                        <td className="text-center">
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong>
                              {rp.Account?.Username ||
                                `${rp.Account?.Firstname ?? ""} ${rp.Account?.Lastname ?? ""}`}
                            </strong>
                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                              {rp.Account?.Email}
                            </span>
                          </div>
                        </td>
                        <td>{rp.Content}</td>
                        <td className="text-center">{fmt(rp.CreatedAt)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteReply(rp.ReplyId)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                    {replyModal.data.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                          Chưa có phản hồi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}