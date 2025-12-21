import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const Post = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/login'
    throw new Error("Token không tồn tại. Hãy đăng nhập lại.");
  }
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [postDetail, setPostDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' hoặc 'replies'

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/privatesite/posts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể tải danh sách bài đăng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetail = async (postId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/privatesite/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPostDetail(data);
      setSelectedPostId(postId);
      setExpandedComments({});
      setActiveTab('comments');
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể tải chi tiết bài đăng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    const confirmApprove = await Swal.fire({
      title: 'Xác nhận duyệt',
      text: "Bạn có chắc chắn muốn duyệt bài đăng này không?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy'
    });

    if (!confirmApprove.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/privatesite/posts/approve/${postId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPosts(posts.map(post => 
          post.PostId === postId ? { ...post, IsApproved: true } : post
        ));
        if (postDetail && postDetail.PostId === postId) {
          setPostDetail({ ...postDetail, IsApproved: true });
        }
        Swal.fire('Thành công!', data.message || 'Duyệt bài đăng thành công!', 'success');
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi duyệt bài đăng.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  const handleHide = async (postId) => {
    const confirmHide = await Swal.fire({
      title: 'Xác nhận ẩn',
      text: "Bạn có chắc chắn muốn ẩn bài đăng này không?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ẩn',
      cancelButtonText: 'Hủy'
    });

    if (!confirmHide.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/privatesite/posts/hide/${postId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPosts(posts.map(post => 
          post.PostId === postId ? { ...post, IsHidden: true } : post
        ));
        if (postDetail && postDetail.PostId === postId) {
          setPostDetail({ ...postDetail, IsHidden: true });
        }
        Swal.fire('Thành công!', data.message || 'Ẩn bài đăng thành công!', 'success');
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi ẩn bài đăng.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmDelete = await Swal.fire({
      title: 'Xác nhận xóa',
      text: "Bạn có chắc chắn muốn xóa bình luận này không?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/privatesite/posts/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPostDetail({
          ...postDetail,
          PostComments: postDetail.PostComments.filter(c => c.CommentId !== commentId),
          CommentCount: (postDetail.CommentCount || 1) - 1
        });
        Swal.fire('Thành công!', 'Xóa bình luận thành công!', 'success');
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi xóa bình luận.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ.', 'error');
    }
  };

  const handleDeleteReply = async (replyId, commentId) => {
    const confirmDelete = await Swal.fire({
      title: 'Xác nhận xóa',
      text: "Bạn có chắc chắn muốn xóa trả lời này không?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/privatesite/posts/replies/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const updatedComments = postDetail.PostComments.map(comment => {
          if (comment.CommentId === commentId) {
            return {
              ...comment,
              PostCommentReplies: comment.PostCommentReplies.filter(r => r.ReplyId !== replyId)
            };
          }
          return comment;
        });
        setPostDetail({
          ...postDetail,
          PostComments: updatedComments
        });
        Swal.fire('Thành công!', 'Xóa trả lời thành công!', 'success');
      } else {
        Swal.fire('Thất bại!', data.message || 'Đã xảy ra lỗi khi xóa trả lời.', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối tới máy chủ.', 'error');
    }
  };

  const handleBackToList = () => {
    setPostDetail(null);
    setSelectedPostId(null);
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

  // Lấy tất cả replies từ tất cả comments
  const getAllReplies = () => {
    const allReplies = [];
    if (postDetail.PostComments) {
      postDetail.PostComments.forEach(comment => {
        if (comment.PostCommentReplies && comment.PostCommentReplies.length > 0) {
          comment.PostCommentReplies.forEach(reply => {
            allReplies.push({
              ...reply,
              commentId: comment.CommentId,
              commentContent: comment.Content,
              commentAuthor: comment.Account
            });
          });
        }
      });
    }
    return allReplies;
  };

  return (
    <div className='container-fluid'>
      {!selectedPostId ? (
        // Danh sách bài đăng
        <div className="row">
          <div className="col-12">
            <div className="card w-100">
              <div className="card-body p-4">
                <h5 className="card-title fw-600 mb-4">Danh sách bài đăng</h5>
                {loading ? (
                  <p className="text-center">Đang tải...</p>
                ) : posts.length === 0 ? (
                  <p className="text-center text-muted">Không có bài đăng nào.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table text-nowrap mb-0 align-middle">
                      <thead className="text-dark fs-4">
                        <tr>
                          <th className="text-center"><h6 className="fw-600 mb-0">Mã bài</h6></th>
                          <th><h6 className="fw-600 mb-0">Người đăng</h6></th>
                          <th className="text-center"><h6 className="fw-600 mb-0">Lượt thích</h6></th>
                          <th className="text-center"><h6 className="fw-600 mb-0">Bình luận</h6></th>
                          <th className="text-center"><h6 className="fw-600 mb-0">Ngày tạo</h6></th>
                          <th className="text-center"><h6 className="fw-600 mb-0">Trạng thái</h6></th>
                          <th className="text-center"><h6 className="fw-600 mb-0">Lệnh</h6></th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts
                          .slice()
                          .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))
                          .map((post) => (
                            <tr key={post.PostId}>
                              <td className="border-bottom-0 text-center">
                                <h6 className="fw-600 mb-1">{post.PostId}</h6>
                              </td>
                              <td className="border-bottom-0">
                                <h6 className="fw-600 mb-1">{getUserName(post.Account)}</h6>
                              </td>
                              <td className="border-bottom-0 text-center">
                                <h6 className="fw-600 mb-1">{post.LikeCount || 0}</h6>
                              </td>
                              <td className="border-bottom-0 text-center">
                                <h6 className="fw-600 mb-1">{post.CommentCount || 0}</h6>
                              </td>
                              <td className="border-bottom-0 text-center">
                                <h6 className="fw-600 mb-1">
                                  {new Date(post.CreatedAt).toLocaleDateString('vi-VN')}
                                </h6>
                              </td>
                              <td className="border-bottom-0 text-center">
                                {post.IsHidden ? (
                                  <span className="badge bg-secondary rounded-pill">Đã ẩn</span>
                                ) : post.IsApproved ? (
                                  <span className="badge bg-success rounded-pill">Đã duyệt</span>
                                ) : (
                                  <span className="badge bg-warning rounded-pill">Chờ duyệt</span>
                                )}
                              </td>
                              <td className="border-bottom-0 text-center">
                                <div className="d-flex gap-2 justify-content-center flex-wrap">
                                  <button
                                    className="btn btn-info btn-sm rounded-pill px-3"
                                    onClick={() => fetchPostDetail(post.PostId)}
                                  >
                                    📝 Chi tiết
                                  </button>
                                  {!post.IsApproved && !post.IsHidden && (
                                    <button
                                      className="btn btn-success btn-sm rounded-pill px-3"
                                      onClick={() => handleApprove(post.PostId)}
                                    >
                                      ✓ Duyệt
                                    </button>
                                  )}
                                  {!post.IsHidden && (
                                    <button
                                      className="btn btn-warning btn-sm rounded-pill px-3"
                                      onClick={() => handleHide(post.PostId)}
                                    >
                                      🚫 Ẩn
                                    </button>
                                  )}
                                </div>
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
      ) : (
        // Chi tiết bài đăng
        <div className="row">
          <div className="col-12">
            <button
              className="btn btn-secondary mb-3"
              onClick={handleBackToList}
            >
              ← Quay lại danh sách
            </button>
            <div className="card w-100">
              <div className="card-body p-4">
                <h5 className="card-title fw-600 mb-4">Chi tiết bài đăng #{postDetail?.PostId}</h5>
                
                {loading ? (
                  <p className="text-center">Đang tải...</p>
                ) : postDetail ? (
                  <div>
                    {/* Thông tin người đăng */}
                    <div className="mb-4 p-3 bg-light rounded">
                      <h6 className="fw-600">Người đăng</h6>
                      <p className="mb-1"><strong>Tên:</strong> {getUserName(postDetail.Account)}</p>
                      <p className="mb-0"><strong>ID:</strong> {postDetail.AccountId}</p>
                    </div>

                    {/* Nội dung bài đăng */}
                    <div className="mb-4 p-3 bg-light rounded">
                      <h6 className="fw-600">Nội dung</h6>
                      <p className="mb-0">{postDetail.Content}</p>
                    </div>

                    {/* Ảnh bài đăng */}
                    {postDetail.PostImages && postDetail.PostImages.length > 0 && (
                      <div className="mb-4 p-3 bg-light rounded">
                        <h6 className="fw-600 mb-3">Hình ảnh ({postDetail.PostImages.length})</h6>
                        <div className="row">
                          {postDetail.PostImages.map((image) => (
                            <div className="col-md-3 mb-3" key={image.ImageId}>
                              <img
                                src={`http://localhost:3000${image.ImageUrl}`}
                                alt="Post"
                                className="img-fluid rounded"
                                style={{ maxHeight: '200px', objectFit: 'cover', cursor: 'pointer' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thống kê */}
                    <div className="row mb-4">
                      <div className="col-md-3">
                        <div className="p-3 bg-light rounded text-center">
                          <h6 className="fw-600">Lượt thích</h6>
                          <h4 className="fw-600 text-primary">{postDetail.LikeCount || 0}</h4>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="p-3 bg-light rounded text-center">
                          <h6 className="fw-600">Bình luận</h6>
                          <h4 className="fw-600 text-info">{postDetail.CommentCount || 0}</h4>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded">
                          <h6 className="fw-600">Thời gian</h6>
                          <p className="mb-1"><strong>Tạo:</strong> {new Date(postDetail.CreatedAt).toLocaleString('vi-VN')}</p>
                          <p className="mb-0"><strong>Cập nhật:</strong> {new Date(postDetail.UpdatedAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách lượt thích */}
                    {postDetail.PostLikes && postDetail.PostLikes.length > 0 && (
                      <div className="mb-4 p-3 bg-light rounded">
                        <h6 className="fw-600 mb-3">
                          <button
                            className="btn btn-sm btn-link"
                            onClick={() => setExpandedComments({...expandedComments, likes: !expandedComments.likes})}
                          >
                            {expandedComments.likes ? '▼' : '▶'} Danh sách lượt thích ({postDetail.PostLikes.length})
                          </button>
                        </h6>
                        {expandedComments.likes && (
                          <div className="table-responsive">
                            <table className="table table-sm mb-0">
                              <thead>
                                <tr>
                                  <th>Người thích</th>
                                  <th>ID</th>
                                </tr>
                              </thead>
                              <tbody>
                                {postDetail.PostLikes.map((like) => (
                                  <tr key={like.LikeId}>
                                    <td>{getUserName(like.Account)}</td>
                                    <td>{like.AccountId}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab Bình luận và Trả lời */}
                    {postDetail.PostComments && postDetail.PostComments.length > 0 && (
                      <div className="mb-4 p-3 bg-light rounded">
                        <h6 className="fw-600 mb-3">Quản lý bình luận & trả lời</h6>
                        
                        {/* Nav tabs */}
                        <ul className="nav nav-tabs mb-3" role="tablist">
                          <li className="nav-item" role="presentation">
                            <button
                              className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
                              onClick={() => setActiveTab('comments')}
                              type="button"
                            >
                              Bình luận ({postDetail.PostComments.length})
                            </button>
                          </li>
                          <li className="nav-item" role="presentation">
                            <button
                              className={`nav-link ${activeTab === 'replies' ? 'active' : ''}`}
                              onClick={() => setActiveTab('replies')}
                              type="button"
                            >
                              Trả lời ({getAllReplies().length})
                            </button>
                          </li>
                        </ul>

                        {/* Tab pane - Bình luận */}
                        {activeTab === 'comments' && (
                          <div className="tab-pane active">
                            {postDetail.PostComments.length === 0 ? (
                              <p className="text-muted">Không có bình luận nào.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                  <thead>
                                    <tr>
                                      <th>Người bình luận</th>
                                      <th>Nội dung</th>
                                      <th>Ngày tạo</th>
                                      <th className="text-center">Trả lời</th>
                                      <th className="text-center">Lệnh</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {postDetail.PostComments.map((comment) => (
                                      <React.Fragment key={comment.CommentId}>
                                        <tr>
                                          <td>
                                            <strong>{getUserName(comment.Account)}</strong><br />
                                            <small className="text-muted">{comment.AccountId}</small>
                                          </td>
                                          <td>{comment.Content}</td>
                                          <td>{new Date(comment.CreatedAt).toLocaleString('vi-VN')}</td>
                                          <td className="text-center">
                                            <button
                                              className="btn btn-sm btn-info"
                                              onClick={() =>
                                                setExpandedComments((prev) => ({
                                                  ...prev,
                                                  [comment.CommentId]: !prev[comment.CommentId],
                                                }))
                                              }
                                            >
                                              {comment.PostCommentReplies?.length || 0}
                                            </button>
                                          </td>
                                          <td className="text-center">
                                            <button
                                              className="btn btn-sm btn-danger"
                                              onClick={() => handleDeleteComment(comment.CommentId)}
                                            >
                                              Xóa
                                            </button>
                                          </td>
                                        </tr>
                                        {/* Hiển thị replies nếu mở rộng */}
                                        {expandedComments[comment.CommentId] && comment.PostCommentReplies?.length > 0 && (
                                          <tr>
                                            <td colSpan={5} style={{ background: "#f8f9fa" }}>
                                              <div>
                                                <strong>Trả lời:</strong>
                                                <table className="table table-bordered table-sm mt-2 mb-0">
                                                  <thead>
                                                    <tr>
                                                      <th>Người trả lời</th>
                                                      <th>Nội dung</th>
                                                      <th>Ngày tạo</th>
                                                      <th className="text-center">Lệnh</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {comment.PostCommentReplies.map((reply) => (
                                                      <tr key={reply.ReplyId}>
                                                        <td>
                                                          <strong>{getUserName(reply.Account)}</strong><br />
                                                          <small className="text-muted">{reply.AccountId}</small>
                                                        </td>
                                                        <td>{reply.Content}</td>
                                                        <td>{new Date(reply.CreatedAt).toLocaleString('vi-VN')}</td>
                                                        <td className="text-center">
                                                          <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteReply(reply.ReplyId, comment.CommentId)}
                                                          >
                                                            Xóa
                                                          </button>
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab pane - Trả lời */}
                        {activeTab === 'replies' && (
                          <div className="tab-pane active">
                            {getAllReplies().length === 0 ? (
                              <p className="text-muted">Không có trả lời nào.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                  <thead>
                                    <tr>
                                      <th>Trả lời cho</th>
                                      <th>Người trả lời</th>
                                      <th>Nội dung</th>
                                      <th>Ngày tạo</th>
                                      <th className="text-center">Lệnh</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {getAllReplies().map((reply) => (
                                      <tr key={reply.ReplyId}>
                                        <td>
                                          <small className="text-muted">
                                            <strong>{getUserName(reply.commentAuthor)}</strong><br />
                                            "{reply.commentContent}"
                                          </small>
                                        </td>
                                        <td>
                                          <strong>{getUserName(reply.Account)}</strong><br />
                                          <small className="text-muted">{reply.AccountId}</small>
                                        </td>
                                        <td>{reply.Content}</td>
                                        <td>{new Date(reply.CreatedAt).toLocaleString('vi-VN')}</td>
                                        <td className="text-center">
                                          <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteReply(reply.ReplyId, reply.commentId)}
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
                        )}
                      </div>
                    )}

                    {/* Nút hành động */}
                    <div className="d-flex gap-2 justify-content-end mt-4">
                      {!postDetail.IsApproved && (
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            handleApprove(postDetail.PostId);
                            handleBackToList();
                          }}
                        >
                          Duyệt bài đăng
                        </button>
                      )}
                      {!postDetail.IsHidden && (
                        <button
                          className="btn btn-warning"
                          onClick={() => {
                            handleHide(postDetail.PostId);
                            handleBackToList();
                          }}
                        >
                          Ẩn bài đăng
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted">Không thể tải chi tiết bài đăng.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;