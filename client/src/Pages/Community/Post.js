import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaThumbsUp, FaComment, FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import "../../Css/Community.css";

const API_URL = "http://localhost:3000";

const Post = ({ post, onLike, onDelete, onUpdate, fetchPosts, updatePostCommentCount }) => {
  // Đảm bảo dữ liệu đầu vào luôn đầy đủ
  const [editContent, setEditContent] = useState(post.content || post.Content || "");
  const [editImages, setEditImages] = useState(post.images ? post.images.map(img => ({
    ImageId: img.ImageId,
    ImageUrl: img.ImageUrl || img,
  })) : []);
  const [originalImages, setOriginalImages] = useState(editImages);
  const [newImages, setNewImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyInput, setReplyInput] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewingImage, setIsViewingImage] = useState(false);

  const token = localStorage.getItem("token");
  const postId = post.PostId || post.id;

  // Lấy userId từ token
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId);
      } catch (error) {
        console.error("Lỗi decode token:", error);
      }
    }
  }, [token]);

  // Lấy userId chủ bài đăng
  const postOwnerId = post.author?.id;
  const isOwner = currentUserId && postOwnerId && String(currentUserId) === String(postOwnerId);

  // Khi nhận post mới, cập nhật lại state
  useEffect(() => {
    setEditContent(post.content || post.Content || "");
    const imgs = post.images ? post.images.map(img => ({
      ImageId: img.ImageId,
      ImageUrl: img.ImageUrl || img,
    })) : [];
    setEditImages(imgs);
    setOriginalImages(imgs);
  }, [post]);

  // Lấy trạng thái like, số lượng like, số lượng bình luận
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/like/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsLiked(response.data.liked);
        setLikesCount(response.data.likesCount);
        setCommentsCount(response.data.commentsCount);
      } catch (error) {
        console.error("Lỗi khi tải trạng thái like:", error);
      }
    };
    fetchLikeStatus();
  }, [postId, token]);

  // Lấy bình luận
  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_URL}/post-comments/${postId}`);
      const commentsWithReplies = await Promise.all(
        res.data.map(async (comment) => {
          try {
            const replyRes = await axios.get(
              `${API_URL}/post-comments/${comment.id || comment.CommentId}/replies`
            );
            return { ...comment, replies: replyRes.data || [] };
          } catch {
            return { ...comment, replies: [] };
          }
        })
      );
      setComments(commentsWithReplies);
    } catch (err) {
      setComments([]);
    }
  };

  useEffect(() => {
    if (showCommentBox) fetchComments();
  }, [showCommentBox]);

  // Like/Unlike
  const handleToggleLike = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/like`,
        { PostId: postId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error("Lỗi khi like/unlike bài viết:", error);
    }
  };

  // Gửi bình luận
  const handleSendComment = async () => {
    if (commentText.trim()) {
      try {
        await axios.post(
          `${API_URL}/post-comments`,
          { PostId: postId, Content: commentText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCommentText("");
        fetchComments();
        
        // Cập nhật số lượng bình luận realtime
        setCommentsCount((prev) => prev + 1);
        if (updatePostCommentCount) {
          updatePostCommentCount(postId, commentsCount + 1);
        }
      } catch (err) {
        alert("Gửi bình luận thất bại!");
      }
    }
  };

  // Gửi trả lời bình luận
  const handleSendReply = async (commentId) => {
    if (replyInput[commentId]?.trim()) {
      try {
        await axios.post(
          `${API_URL}/post-comments/reply`,
          { CommentId: commentId, Content: replyInput[commentId] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReplyInput((prev) => ({ ...prev, [commentId]: "" }));
        setShowReplyInput((prev) => ({ ...prev, [commentId]: false }));
        fetchComments();
        
        // Cập nhật số lượng bình luận realtime (reply cũng tính là 1 comment)
        setCommentsCount((prev) => prev + 1);
        if (updatePostCommentCount) {
          updatePostCommentCount(postId, commentsCount + 1);
        }
      } catch (err) {
        alert("Gửi phản hồi thất bại!");
      }
    }
  };

  // Xóa bài đăng
  const handleDeletePost = async () => {
    try {
      const response = await axios.delete(`${API_URL}/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        Swal.fire("Thành công!", "Bài đăng đã được xóa thành công.", "success");
        if (typeof onDelete === "function") onDelete(postId);
        if (typeof fetchPosts === "function") fetchPosts();
      } else {
        Swal.fire("Thất bại!", "Bạn không phải là chủ sở hữu bài đăng này.", "error");
      }
    } catch (error) {
      Swal.fire("Lỗi", "Bạn không phải là chủ sở hữu bài đăng này.", "error");
    }
  };

  // Xóa hình ảnh tạm thời
  const handleDeleteImage = (image) => {
    setEditImages((prevImages) => prevImages.filter((img) => img.ImageUrl !== image.ImageUrl));
    if (image.ImageId && typeof image.ImageId === 'number') {
      setDeletedImages((prevDeleted) => [...prevDeleted, image]);
    }
  };

  // Thêm hình ảnh mới
  const handleAddImages = (event) => {
    const files = Array.from(event.target.files);
    const newImageUrls = files.map((file) => URL.createObjectURL(file));
    setNewImages((prevNewImages) => [...prevNewImages, ...files]);
    setEditImages((prevImages) => [
      ...prevImages,
      ...newImageUrls.map((url) => ({ ImageUrl: url, ImageId: null })),
    ]);
  };

  // Cập nhật bài đăng
  const handleUpdatePost = async () => {
    try {
      const formData = new FormData();
      formData.append("content", editContent);
      const validDeletedImageIds = deletedImages
        .filter((img) => img.ImageId && typeof img.ImageId === 'number')
        .map((img) => img.ImageId);
      formData.append("deletedImageIds", JSON.stringify(validDeletedImageIds));
      newImages.forEach((image) => {
        formData.append("images", image);
      });
      const response = await axios.put(`${API_URL}/post/${postId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200) {
        alert("Cập nhật bài đăng thành công!");
        setIsEditing(false);
        setDeletedImages([]);
        setNewImages([]);
        // Luôn gọi lại fetchPosts để lấy dữ liệu mới nhất từ server
        if (typeof fetchPosts === "function") fetchPosts();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật bài đăng:", error);
      alert("Cập nhật bài đăng thất bại!");
    }
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditImages(originalImages);
    setDeletedImages([]);
    setNewImages([]);
    setEditContent(post.content || post.Content || "");
    setIsEditing(false);
  };

  // Xem ảnh
  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setIsViewingImage(true);
  };
  const handleCloseImage = () => setIsViewingImage(false);
  const handleNextImage = () => setCurrentImageIndex((prevIndex) => (prevIndex + 1) % editImages.length);
  const handlePreviousImage = () => setCurrentImageIndex((prevIndex) =>
    prevIndex === 0 ? editImages.length - 1 : prevIndex - 1
  );

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <img src={post.author?.avatar} alt={post.author?.name} className="post-avatar" />
        <div className="post-author-info">
          <p className="post-author-name">{post.author?.name}</p>
          <p className="post-time">{post.time}</p>
        </div>
        {isOwner && (
          <>
            <button className="edit-post-btn" onClick={() => setIsEditing(true)}>
              <FaEdit />
            </button>
            <button className="delete-post-btn" onClick={handleDeletePost}>
              <FaTrash />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {!isEditing ? (
        <div className="post-content">{post.content || post.Content}</div>
      ) : (
        <div className="edit-post">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Sửa nội dung bài đăng..."
          />
          <div className="edit-images">
            {editImages.map((image, index) => (
              <div key={`${image.ImageId}-${index}`} className="edit-image-item">
                <img
                  src={image.ImageUrl.startsWith("blob:") || image.ImageUrl.startsWith("http") ? image.ImageUrl : `http://localhost:3000${image.ImageUrl}`}
                  alt={`edit-image-${index}`}
                  className="edit-image"
                />
                <button
                  className="delete-image-btn"
                  onClick={() => handleDeleteImage(image)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            multiple
            onChange={handleAddImages}
          />
          <button onClick={handleUpdatePost}>Cập nhật</button>
          <button onClick={handleCancelEdit}>Hủy</button>
        </div>
      )}

      {/* Images */}
      {!isEditing && editImages && editImages.length > 0 && (
        <div className="post-images">
          {editImages.length === 1 ? (
            <img
              src={editImages[0].ImageUrl.startsWith("http") 
                ? editImages[0].ImageUrl 
                : `http://localhost:3000${editImages[0].ImageUrl}`}
              alt="post-image"
              className="single-image"
              onClick={() => handleImageClick(0)}
            />
          ) : (
            <div className={`grid-layout ${editImages.length > 4 ? "limit-layout" : ""}`}>
              {editImages.slice(0, 5).map((image, index) => (
                <img
                  key={index}
                  src={image.ImageUrl.startsWith("http") 
                    ? image.ImageUrl 
                    : `http://localhost:3000${image.ImageUrl}`}
                  alt={`post-image-${index}`}
                  className="grid-image"
                  onClick={() => handleImageClick(index)}
                />
              ))}
              {editImages.length > 5 && (
                <div className="more-images" onClick={() => handleImageClick(5)}>
                  +{editImages.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal hiển thị hình ảnh */}
      {isViewingImage && editImages.length > 0 && (
        <div className="image-modal">
          <button className="close-modal-btn" onClick={handleCloseImage}>
            X
          </button>
          <button
            className="prev-image-btn"
            onClick={handlePreviousImage}
            disabled={currentImageIndex === 0}
          >
            {"<"}
          </button>
          <img
            src={editImages[currentImageIndex].ImageUrl.startsWith("http")
              ? editImages[currentImageIndex].ImageUrl
              : `http://localhost:3000${editImages[currentImageIndex].ImageUrl}`}
            alt={`modal-image-${currentImageIndex}`}
            className="modal-image"
          />
          <button
            className="next-image-btn"
            onClick={handleNextImage}
            disabled={currentImageIndex === editImages.length - 1}
          >
            {">"}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="post-stats">
        <span>❤️ Thích ({likesCount})</span>
        <span onClick={() => setShowCommentBox((prev) => !prev)}>
          💬 Bình luận ({commentsCount})
        </span>
      </div>

      {/* Action */}
      <div className="post-actions">
        <button className={`action-btn ${isLiked ? "liked" : ""}`} onClick={handleToggleLike}>
          <FaThumbsUp /> {isLiked ? "Bỏ thích" : "Thích"}
        </button>
        <button className="action-btn" onClick={() => setShowCommentBox(!showCommentBox)}>
          <FaComment /> Bình luận
        </button>
      </div>

      {/* COMMENT MODAL */}
      {showCommentBox && (
        <div className="comment-modal-overlay" onClick={() => setShowCommentBox(false)}>
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-header">
              <span>Bình luận</span>
              <button className="close-btn" onClick={() => setShowCommentBox(false)}>
                ×
              </button>
            </div>
            <div className="comment-modal-body">
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id || comment.CommentId} className="comment">
                    <div className="comment-author">{comment.Account?.Email || "Ẩn danh"}</div>
                    <div className="comment-text">{comment.Content}</div>
                    <button
                      className="reply-btn"
                      onClick={() =>
                        setShowReplyInput((prev) => ({
                          ...prev,
                          [comment.id || comment.CommentId]:
                            !prev[comment.id || comment.CommentId],
                        }))
                      }
                    >
                      Trả lời
                    </button>
                    {showReplyInput[comment.id || comment.CommentId] && (
                      <div className="reply-input-section">
                        <input
                          type="text"
                          placeholder="Nhập trả lời..."
                          value={replyInput[comment.id || comment.CommentId] || ""}
                          onChange={(e) =>
                            setReplyInput((prev) => ({
                              ...prev,
                              [comment.id || comment.CommentId]: e.target.value,
                            }))
                          }
                          className="reply-input"
                        />
                        <button
                          className="reply-send-btn"
                          onClick={() => handleSendReply(comment.id || comment.CommentId)}
                        >
                          Gửi
                        </button>
                      </div>
                    )}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-section">
                        {comment.replies.map((reply) => (
                          <div key={reply.id || reply.ReplyId} className="reply">
                            <div className="reply-author">
                              {reply.Account?.Email || "Ẩn danh"}
                            </div>
                            <div className="reply-text">{reply.Content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="comment-modal-footer">
              <input
                type="text"
                className="comment-input"
                placeholder="Nhập bình luận..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button className="comment-send-btn" onClick={handleSendComment}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
