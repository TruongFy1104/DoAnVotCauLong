import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/**
 * CommentManagement.js — Admin page to manage all comments & replies
 * - Auto load tất cả comments khi vào
 * - Modal xem replies + nút Xóa reply
 * - Bỏ chức năng Ẩn/Hiện & checkbox showHidden
 * - Áp dụng className theo Style.css (card, card-hover, tag, searchForm, slot-time-form-box, ...)
 */

// API chạy ở port 3000 như yêu cầu
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [productId, setProductId] = useState("");
  const [q, setQ] = useState("");

  const [replyModal, setReplyModal] = useState({
    open: false,
    comment: null,
    data: [],
    loading: false,
    error: "",
  });

  const [products, setProducts] = useState([]); // map ProductName

  const loadProducts = async () => {
    const res = await axios.get(`${API}/products`, getAuth());
    const list = Array.isArray(res.data) ? res.data : res.data?.result ?? [];
    setProducts(list);
    return list;
  };

  const productNameOf = (pid) =>
    products.find((p) => String(p.ProductId) === String(pid))?.ProductName ||
    pid;

  // (A) Fetch comments theo ProductId (tuỳ chọn dùng để lọc nhanh một sản phẩm)
  const fetchByProduct = async () => {
    if (!productId) {
      setError("Bạn phải nhập ProductId để tải bình luận của sản phẩm đó.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!products.length) await loadProducts();
      const res = await axios.get(
        `${API}/comments/${encodeURIComponent(productId)}`,
        getAuth()
      );
      setRows(Array.isArray(res.data) ? res.data : res.data?.result ?? []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e.message ||
          "Lỗi khi tải danh sách bình luận"
      );
    } finally {
      setLoading(false);
    }
  };

  // (B) Fetch tất cả comments: /products -> forEach /comments/:productId
  const fetchAllComments = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await loadProducts();
      if (!list.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const requests = list.map((p) =>
        axios
          .get(`${API}/comments/${encodeURIComponent(p.ProductId)}`, getAuth())
          .then((r) => ({
            pid: p.ProductId,
            items: Array.isArray(r.data) ? r.data : r.data?.result ?? [],
          }))
          .catch(() => ({ pid: p.ProductId, items: [] }))
      );

      const results = await Promise.all(requests);
      const merged = results.flatMap((r) =>
        r.items.map((it) => ({ ...it, ProductId: it.ProductId || r.pid }))
      );
      setRows(merged);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e.message ||
          "Lỗi khi tải tất cả bình luận"
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto load tất cả khi vào trang
  useEffect(() => {
    fetchAllComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!kw) return true;
      const fields = [
        r.Content,
        r.content,
        r.ProductId,
        r.Account?.Username,
        r.Account?.Email,
        r.Account?.Firstname,
        r.Account?.Lastname,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(kw);
    });
  }, [rows, q]);

  // Replies modal handlers + DELETE reply
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
    if (!window.confirm(`Xóa phản hồi #${replyId}?`)) return;
    try {
      await axios.delete(`${API}/comments/reply/${replyId}`, getAuth());
      // cập nhật ngay trong modal
      setReplyModal((m) => ({
        ...m,
        data: (m.data || []).filter((r) => r.ReplyId !== replyId),
      }));
    } catch (e) {
      alert(
        e?.response?.data?.message || e.message || "Không xóa được phản hồi"
      );
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

  // Delete comment
  const onDelete = async (comment) => {
    if (!window.confirm(`Xóa bình luận #${comment.CommentId}?`)) return;
    try {
      await axios.delete(`${API}/comments/${comment.CommentId}`, getAuth());
      setRows((s) => s.filter((x) => x.CommentId !== comment.CommentId));
    } catch (e) {
      alert(
        e?.response?.data?.message || e.message || "Không xóa được bình luận"
      );
    }
  };

  // Bỏ nút Ẩn/Hiện — chỉ còn Xóa
  const Row = ({ r, idx }) => (
    <tr key={r.CommentId}>
      <td className="tag tag-sm tag-bg">{idx + 1}</td>
      <td>#{r.CommentId}</td>
      <td>
        <div className="tag tag-sm">{r.ProductId}</div>
        <div style={{ color: "#6b7280", fontSize: 12 }}>
          {productNameOf(r.ProductId)}
        </div>
      </td>
      <td>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <strong>
            {r.Account?.Username ||
              `${r.Account?.Firstname ?? ""} ${r.Account?.Lastname ?? ""}`}
          </strong>
          <span style={{ color: "#6b7280", fontSize: 12 }}>
            {r.Account?.Email}
          </span>
        </div>
      </td>
      <td style={{ whiteSpace: "pre-wrap" }}>{r.Content || r.content}</td>
      <td>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span>{fmt(r.createdAt || r.createAt)}</span>
          <span style={{ color: "#6b7280", fontSize: 12 }}>
            Sửa: {fmt(r.updatedAt || r.updateAt)}
          </span>
        </div>
      </td>
      <td>
        <button
          className="btn btn-sm"
          onClick={() => openReplies(r)}
          title="Xem phản hồi"
        >
          Xem phản hồi
        </button>
      </td>
      <td style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(r)}>
          Xóa
        </button>
      </td>
    </tr>
  );

  return (
    <div className="body-wrapper">
      <div className="container-fluid">
        <div className="card card-hover" style={{ padding: 16 }}>
          <div
            className="brand-logo"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 className="card-title" style={{ margin: 0 }}>
              Quản lý bình luận
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                onClick={fetchByProduct}
                disabled={!productId || loading}
                title="Tải theo ProductId"
              >
                {loading ? "Đang tải…" : "Tải theo ProductId"}
              </button>
              <button
                className="btn"
                onClick={fetchAllComments}
                disabled={loading}
                title="Làm mới toàn bộ"
              >
                {loading ? "Đang tải…" : "Làm mới"}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="slot-time-form-box" style={{ marginTop: 12 }}>
            <div className="searchForm" style={{ marginBottom: 10 }}>
              <input
                placeholder="Nhập ProductId (tuỳ chọn)"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchByProduct()}
              />
              <button
                onClick={fetchByProduct}
                style={{ padding: 4 }}
                disabled={!productId || loading}
                title="Tải theo ProductId"
              >
                Lọc
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
              }}
            >
              <input
                className="searchForm"
                placeholder="Tìm theo nội dung, username, email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                className="btn"
                onClick={fetchAllComments}
                disabled={loading}
              >
                {loading ? "Đang tải…" : "Làm mới"}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="tag tag-lg"
              style={{ background: "#fee2e2", color: "#991b1b", marginTop: 8 }}
            >
              ⚠️ {error}
            </div>
          )}

          <div className="table-responsive" style={{ marginTop: 12 }}>
            <table
              className="table"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>CommentId</th>
                  <th>Product</th>
                  <th>Người bình luận</th>
                  <th>Nội dung</th>
                  <th>Thời gian</th>
                  <th>Replies</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <Row key={r.CommentId} r={r} idx={i} />
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: "center", padding: 24 }}
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <div className="loader" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies Modal: có nút Xóa reply */}
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
              <button className="btn" onClick={closeReplies}>
                Đóng
              </button>
            </div>

            <div style={{ padding: 12 }}>
              {replyModal.loading && <div>Đang tải phản hồi…</div>}
              {replyModal.error && (
                <div style={{ color: "#b91c1c" }}>⚠️ {replyModal.error}</div>
              )}
              {!replyModal.loading && !replyModal.error && (
                <div className="table-responsive">
                  <table className="table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>ReplyId</th>
                        <th>Người trả lời</th>
                        <th>Nội dung</th>
                        <th>Thời gian</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {replyModal.data.map((rp, i) => (
                        <tr key={rp.ReplyId}>
                          <td>{i + 1}</td>
                          <td>#{rp.ReplyId}</td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <strong>
                                {rp.Account?.Username ||
                                  `${rp.Account?.Firstname ?? ""} ${
                                    rp.Account?.Lastname ?? ""
                                  }`}
                              </strong>
                              <span style={{ color: "#6b7280", fontSize: 12 }}>
                                {rp.Account?.Email}
                              </span>
                            </div>
                          </td>
                          <td style={{ whiteSpace: "pre-wrap" }}>
                            {rp.Content}
                          </td>
                          <td>{fmt(rp.CreatedAt)}</td>
                          <td>
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
                          <td
                            colSpan={6}
                            style={{ textAlign: "center", padding: 16 }}
                          >
                            Chưa có phản hồi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
