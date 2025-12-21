const Post = require('../models/Post');
const PostImage = require('../models/PostImage');
const PostComment = require('../models/PostComment');
const PostLike = require('../models/PostLike');
const CommentReply = require('../models/CommentReply');
const Account = require('../models/Account');

// Lấy danh sách tất cả bài đăng
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        { model: PostImage, as: 'PostImages', required: false },
        { model: PostLike, as: 'PostLikes', required: false },
        { model: PostComment, as: 'PostComments', required: false },
        { model: Account, as: 'Account', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'], required: false }
      ],
      order: [['CreatedAt', 'DESC']],
    });

    const postsWithStats = posts.map(post => ({
      ...post.toJSON(),
      LikeCount: post.PostLikes ? post.PostLikes.length : 0,
      CommentCount: post.PostComments ? post.PostComments.length : 0,
    }));

    res.json(postsWithStats);
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết bài đăng
exports.getPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id, {
      include: [
        { model: PostImage, as: 'PostImages', required: false },
        {
          model: PostLike,
          as: 'PostLikes',
          include: [{ model: Account, as: 'Account', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'] }],
          required: false
        },
        {
          model: PostComment,
          as: 'PostComments',
          include: [
            { model: Account, as: 'Account', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'] },
            {
              model: CommentReply,
              as: 'PostCommentReplies',
              include: [{ model: Account, as: 'Account', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'] }],
              required: false
            }
          ],
          required: false
        },
        { model: Account, as: 'Account', attributes: ['AccountId', 'Username', 'Firstname', 'Lastname'], required: false }
      ],
    });

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const postData = post.toJSON();
    console.log('Post data:', JSON.stringify(postData, null, 2));
    
    postData.LikeCount = post.PostLikes ? post.PostLikes.length : 0;
    postData.CommentCount = post.PostComments ? post.PostComments.length : 0;

    res.json(postData);
  } catch (error) {
    console.error('Error in getPostDetail:', error);
    res.status(500).json({ message: error.message });
  }
};

// Xóa bài đăng
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    await post.destroy();
    res.json({ message: "Xóa bài đăng thành công!" });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ message: error.message });
  }
};

// Xóa bình luận
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    console.log('Deleting comment:', commentId);
    
    const comment = await PostComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    await CommentReply.destroy({ where: { CommentId: commentId } });
    await comment.destroy();
    res.json({ message: "Xóa bình luận thành công!" });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({ message: error.message });
  }
};

// Xóa trả lời bình luận
exports.deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    console.log('Deleting reply:', replyId);
    
    const reply = await CommentReply.findByPk(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Không tìm thấy trả lời" });
    }

    await reply.destroy();
    res.json({ message: "Xóa trả lời thành công!" });
  } catch (error) {
    console.error('Error in deleteReply:', error);
    res.status(500).json({ message: error.message });
  }
};

// Duyệt bài đăng
exports.approvePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng!" });
    }
    
    post.IsApproved = true;
    await post.save();
    
    res.json({ message: "Duyệt bài đăng thành công!", post });
  } catch (error) {
    console.error('Error in approvePost:', error);
    res.status(500).json({ message: error.message });
  }
};

// Ẩn bài đăng
exports.hidePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng!" });
    }
    
    post.IsHidden = true;
    await post.save();
    
    res.json({ message: "Ẩn bài đăng thành công!", post });
  } catch (error) {
    console.error('Error in hidePost:', error);
    res.status(500).json({ message: error.message });
  }
};