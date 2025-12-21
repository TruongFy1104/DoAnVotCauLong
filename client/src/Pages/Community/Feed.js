// Feed.js
import React, { useState, useEffect } from "react";
import { FaImage } from "react-icons/fa";
import Post from "./Post";
import "../../Css/Community.css";
import axios from "axios";
import Swal from "sweetalert2";

const Feed = ({ 
  posts, 
  setPosts, 
  onLike, 
  onDelete,
  postSearchQuery,
  setPostSearchQuery,
  postFilterType,
  setPostFilterType
}) => {
  const [postContent, setPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Tách hàm fetchPosts để dùng lại sau khi đăng/sửa bài
  const fetchPosts = async () => {
    try {
      const response = await axios.get("http://localhost:3000/post/feed");
      setPosts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải bài đăng:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, []);

  const handlePost = async () => {
    if (!postContent.trim()) {
      alert("Vui lòng nhập nội dung bài đăng!");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("content", postContent);
      selectedImages.forEach((image) => {
        formData.append("images", image);
      });

      const response = await axios.post(
        "http://localhost:3000/post/create",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        setPostContent("");
        setSelectedImages([]);
        
        // Hiển thị thông báo với SweetAlert2
        Swal.fire({
          icon: "info",
          title: "Đăng bài thành công!",
          text: response.data.message || "Bài đăng của bạn đang chờ quản trị viên duyệt.",
          confirmButtonText: "Đã hiểu",
          confirmButtonColor: "#3085d6",
        });
        
        await fetchPosts(); // Luôn lấy lại danh sách bài viết mới nhất
      }
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      alert(error.response?.data?.message || "Đăng bài thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm cập nhật số lượng bình luận của 1 bài post cụ thể
  const updatePostCommentCount = (postId, newCommentCount) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.PostId === postId || post.id === postId
          ? { ...post, commentCount: newCommentCount }
          : post
      )
    );
  };

  // Truyền fetchPosts và updatePostCommentCount xuống Post
  return (
    <div className="community-feed">
      {/* Tìm kiếm bài viết */}
      <div className="post-filter-box">
        <div className="post-filter-header">
          <input
            type="text"
            placeholder={
              postFilterType === "author"
                ? "Tìm kiếm theo tên người đăng..."
                : "Tìm kiếm theo nội dung bài viết..."
            }
            value={postSearchQuery}
            onChange={(e) => setPostSearchQuery(e.target.value)}
            className="post-search-input"
          />
          <select
            value={postFilterType}
            onChange={(e) => setPostFilterType(e.target.value)}
            className="post-filter-select"
          >
            <option value="content">Nội dung</option>
            <option value="author">Tên người đăng</option>
          </select>
        </div>
        {postSearchQuery && (
          <div className="post-filter-info">
            Tìm thấy <strong>{posts.length}</strong> bài viết
            <button 
              className="clear-filter-btn"
              onClick={() => setPostSearchQuery("")}
            >
              ✕ Xóa tìm kiếm
            </button>
          </div>
        )}
      </div>

      {/* Create Post Box */}
      <div className="create-post-box">
        <textarea
          placeholder="Bạn đang nghĩ gì?"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          className="create-post-input"
          rows="3"
          disabled={isLoading}
        />

        {selectedImages.length > 0 && (
          <div className="preview-images">
            {selectedImages.map((image, index) => (
              <div key={index} className="preview-image">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`preview-${index}`}
                />
                <button
                  className="remove-image-btn"
                  onClick={() =>
                    setSelectedImages((prevImages) =>
                      prevImages.filter((_, i) => i !== index)
                    )
                  }
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="create-post-actions">
          <label className="action-btn-secondary">
            <FaImage /> Ảnh
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setSelectedImages((prevImages) => [...prevImages, ...files]);
              }}
              style={{ display: "none" }}
              disabled={isLoading}
            />
          </label>
          <button className="post-btn" onClick={handlePost} disabled={isLoading}>
            {isLoading ? "Đang đăng..." : "Đăng"}
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="posts-list">
        {posts.map((post) => (
          <Post
            key={post.PostId || post.id}
            post={post}
            onLike={onLike}
            onDelete={onDelete}
            fetchPosts={fetchPosts}
            updatePostCommentCount={updatePostCommentCount} // Truyền hàm cập nhật số lượng comment
          />
        ))}
      </div>
    </div>
  );
};

export default Feed;
