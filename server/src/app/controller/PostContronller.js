const Post = require("../models/Post");
const Account = require("../models/Account");
const PostLike = require('../models/PostLike');
const PostComment = require("../models/PostComment");
const PostImage = require("../models/PostImage");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const SECRET_KEY = "saddasdasadsasdadsas"; 

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
// ===== TẠO BÀI ĐĂNG MỚI =====
exports.createPost = async (req, res) => {
  upload.array("images", 10)(req, res, async (err) => { // Cho phép upload tối đa 10 hình ảnh
    if (err) {
      console.error("Lỗi khi upload hình ảnh:", err); // Log lỗi upload
      return res.status(500).json({ error: "Lỗi khi upload hình ảnh" });
    }

    try {
      const { content } = req.body;
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({ message: "Token không hợp lệ hoặc không có quyền truy cập." });
      }

      const decoded = jwt.verify(token, SECRET_KEY);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: "Token không hợp lệ." });
      }

      const accountId = decoded.userId;

      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Nội dung bài đăng không được để trống!" });
      }

      // Tạo bài đăng (cần duyệt trước khi hiển thị)
      const post = await Post.create({
        AccountId: accountId,
        Content: content,
        CreatedAt: new Date(),
        IsApproved: false,
        IsHidden: false,
      });

      // Lưu danh sách hình ảnh vào bảng PostImage
      if (req.files && req.files.length > 0) {
        const imageRecords = req.files.map((file) => ({
          PostId: post.PostId,
          ImageUrl: `/uploads/${file.filename}`,
        }));

        await PostImage.bulkCreate(imageRecords); // Lưu nhiều hình ảnh vào bảng PostImage
      }

      const author = await Account.findByPk(accountId, {
        attributes: ["AccountId", "Firstname", "Lastname", "Avatar"],
      });

      const images = req.files.map((file) => ({
        ImageId: null,
        ImageUrl: `/uploads/${file.filename}`,
      })); // Lấy danh sách hình ảnh

      return res.status(201).json({
        message: "Đăng bài thành công! Bài đăng của bạn đang chờ quản trị viên duyệt.",
        post: {
          PostId: post.PostId,
          content: post.Content,
          images,
          author: {
            id: author.AccountId,
            name: `${author.Firstname || ""} ${author.Lastname || ""}`.trim(),
            avatar: author.Avatar || "https://placehold.co/50x50/3b82f6/FFF?text=USER",
          },
          time: "Vừa xong",
          likes: 0,
          comments: [],
          IsApproved: false,
        },
      });
    } catch (error) {
      console.error("Lỗi khi tạo bài đăng:", error); // Log lỗi chi tiết
      return res.status(500).json({ error: error.message });
    }
  });
};

// ===== LẤY DANH SÁCH BÀI ĐĂNG =====
exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: {
        IsApproved: true,
        IsHidden: false,
      },
      include: [
        {
          model: PostImage,
          as: "PostImages", // Sử dụng alias đã định nghĩa
          attributes: ["ImageId", "ImageUrl"],
        },
        {
          model: Account,
          as: "Account", // Sử dụng alias đã định nghĩa
          attributes: ["AccountId", "Firstname", "Lastname", "Avatar"],
        },
      ],
      order: [["CreatedAt", "DESC"]],
    });

    const formattedPosts = posts.map((post) => ({
      PostId: post.PostId,
      content: post.Content,
      images: post.PostImages.map((image) => ({
        ImageId: image.ImageId,
        ImageUrl: image.ImageUrl,
      })),
      author: {
        id: post.Account.AccountId,
        name: `${post.Account.Firstname || ""} ${post.Account.Lastname || ""}`.trim(),
        avatar: post.Account.Avatar || "https://placehold.co/50x50/3b82f6/FFF?text=USER",
      },
      time: post.CreatedAt,
      likes: 0,
      comments: [],
    }));

    return res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Lỗi khi tải feed:", error);
    return res.status(500).json({ message: "Lỗi server!" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc không có quyền truy cập." });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }

    const accountId = decoded.userId; // ID tài khoản từ token
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: "Bài đăng không tồn tại!" });
    }

    // Kiểm tra quyền sở hữu bài đăng níu là tài khoản đó mới đc xóa bài đó
    if (String(post.AccountId) !== String(accountId)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài đăng này!" });
    }

    // Xóa bài đăng nếu là chủ sở hữu
    await post.destroy();
    return res.json({ message: "Xóa bài đăng thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa bài đăng:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ===== THÍCH / BỎ THÍCH BÀI ĐĂNG =====
exports.toggleLikePost = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Không có token." });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const AccountId = decoded?.userId;

    const { PostId } = req.body;

    const post = await Post.findByPk(PostId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại." });

    const existingLike = await PostLike.findOne({ where: { PostId, AccountId } });

    if (existingLike) {
      await existingLike.destroy();
    } else {
      await PostLike.create({ PostId, AccountId });
    }

    const likesCount = await PostLike.count({ where: { PostId } });

    res.json({
      liked: !existingLike,
      likesCount,
    });
  } catch (error) {
    console.error("Lỗi like:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// ===== LẤY TRẠNG THÁI LIKE, COMMENT =====
exports.getLikeStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Không có token." });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const AccountId = decoded?.userId;

    const PostId = req.params.PostId;

    const post = await Post.findByPk(PostId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại." });

    const existingLike = await PostLike.findOne({ where: { PostId, AccountId } });
    const likesCount = await PostLike.count({ where: { PostId } });
    const commentsCount = await PostComment.count({ where: { PostId } }); // Đếm số bình luận

    res.json({
      liked: !!existingLike,
      likesCount,
      commentsCount, // Trả về tổng số bình luận
    });
  } catch (error) {
    console.error("Lỗi trạng thái like:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

// ===== CHỈNH SỬA BÀI ĐĂNG =====
exports.updatePost = async (req, res) => {
  upload.array("images", 10)(req, res, async (err) => {
    if (err) {
      console.error("Lỗi khi upload hình ảnh:", err);
      return res.status(500).json({ error: "Lỗi khi upload hình ảnh" });
    }

    try {
      const { postId } = req.params;
      const { content, deletedImageIds } = req.body; // Nhận danh sách hình ảnh bị xóa
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Token không hợp lệ hoặc không có quyền truy cập." });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, SECRET_KEY);
      } catch (error) {
        console.error("Lỗi xác thực token:", error);
        return res.status(401).json({ message: "Token không hợp lệ." });
      }

      const accountId = decoded.userId;
      

      const post = await Post.findByPk(postId);
      if (!post) {
        return res.status(404).json({ message: "Bài đăng không tồn tại!" });
      }

      // Kiểm tra quyền sở hữu bài đăng
      if (String(post.AccountId) !== String(accountId)) {
        console.log("Người dùng không có quyền cập nhật bài đăng này.");
        return res.status(403).json({ message: "Bạn không có quyền sửa bài đăng này!" });
      }

      // Cập nhật nội dung bài đăng
      post.Content = content || post.Content;

      // Xóa hình ảnh nếu có
      if (deletedImageIds && deletedImageIds.length > 0) {
        // Kiểm tra deletedImageIds an toàn hơn
        let deletedIds = [];
        try {
          deletedIds = JSON.parse(deletedImageIds);
        } catch (e) {
          return res.status(400).json({ message: "Danh sách hình ảnh xóa không hợp lệ!" });
        }
        for (const imageId of deletedIds) {
          const image = await PostImage.findByPk(imageId);
          if (image) {
            const filePath = path.join(__dirname, "..", image.ImageUrl);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            await image.destroy();
          }
        }
      }

      // Lưu hình ảnh mới vào cơ sở dữ liệu
      if (req.files && req.files.length > 0) {

        const imageRecords = req.files.map((file) => ({
          PostId: postId,
          ImageUrl: `/uploads/${file.filename}`,
        }));
        await PostImage.bulkCreate(imageRecords);
      }

      await post.save();

      // Lấy danh sách hình ảnh mới sau khi cập nhật
      const updatedImages = await PostImage.findAll({ where: { PostId: postId } });

      return res.status(200).json({
        message: "Cập nhật bài đăng thành công!",
        post: {
          PostId: post.PostId,
          content: post.Content,
          images: updatedImages.map((image) => ({
            ImageId: image.ImageId,
            ImageUrl: image.ImageUrl,
          })),
        },
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật bài đăng:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};

// ======================================================
// 🍀 XÓA HÌNH ẢNH
// ======================================================
exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc không có quyền truy cập." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (error) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }

    const accountId = decoded.userId;

    const image = await PostImage.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ message: "Hình ảnh không tồn tại!" });
    }

    const post = await Post.findByPk(image.PostId);
    if (!post || String(post.AccountId) !== String(accountId)) {
      console.log("Không có quyền xóa hình ảnh. AccountId:", accountId, "Post.AccountId:", post?.AccountId);
      return res.status(403).json({ message: "Bạn không có quyền xóa hình ảnh này!" });
    }

    // Xóa file khỏi thư mục uploads
    const filePath = path.join(__dirname, "..", image.ImageUrl);
    console.log("Đường dẫn file cần xóa:", filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File đã bị xóa: ${filePath}`);
    } else {
      console.log("File không tồn tại:", filePath);
    }

    // Xóa hình ảnh khỏi cơ sở dữ liệu
    await image.destroy();
    console.log(`Hình ảnh với ID ${imageId} đã bị xóa khỏi cơ sở dữ liệu.`);

    return res.status(200).json({ message: "Xóa hình ảnh thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa hình ảnh:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ===== DUYỆT BÀI ĐĂNG =====
exports.approvePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    // Cập nhật trạng thái duyệt
    post.IsApproved = true;
    await post.save();

    return res.status(200).json({ 
      message: "Duyệt bài đăng thành công!", 
      post 
    });
  } catch (error) {
    console.error("Lỗi khi duyệt bài đăng:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ===== ẨN BÀI ĐĂNG =====
exports.hidePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    // Cập nhật trạng thái ẩn
    post.IsHidden = true;
    await post.save();

    return res.status(200).json({ 
      message: "Ẩn bài đăng thành công!", 
      post 
    });
  } catch (error) {
    console.error("Lỗi khi ẩn bài đăng:", error);
    return res.status(500).json({ error: error.message });
  }
};

