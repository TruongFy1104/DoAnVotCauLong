const express = require("express");
const cors = require("cors");
const sequelize = require("./src/config/db/index.js"); 
const bodyParser = require("body-parser");
const path = require("path");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:3001", credentials: true })); 
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'src', 'app', 'uploads')));
console.log('UPLOADS DIR:', path.join(__dirname, 'src', 'app', 'uploads'));
const { getRepliesByComment, addReply } = require('./src/app/controller/CommentReplyContronller.js');
const { getCommentsByProduct , addComment } = require('./src/app/controller/CommentController');
const privateSiteRoutes = require("./src/routes/privateSiteRoutes");
const brandRoutes = require("./src/routes/brandRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const authorize = require("./src/Common/Authorize");
const authRoutes = require("./src/routes/authenRoutes");
const productRoutes = require("./src/routes/productRoutes");
const { getAllAccountsUser, getProfileUser, updateProfileUser, changePasswordUser } = require("./src/app/controller/AccountUserController.js");
const cartRoutes = require("./src/routes/cartRoutes");
const checkoutRoutes = require('./src/routes/checkoutRoutes');



//Account routes
app.get("/accountmanagementUser", authorize(["Người dùng"]), getAllAccountsUser);
app.get('/profileUser', authorize(["Người dùng"]), getProfileUser);
app.put('/updateprofileUser', authorize(["Người dùng"]), updateProfileUser);
app.put('/profile/changepasswordUser', authorize(["Người dùng"]), changePasswordUser); 
///
app.use("/privatesite", privateSiteRoutes);
app.use("/brands", brandRoutes);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/categories",categoryRoutes);
//comments
app.get('/comments/:productId', getCommentsByProduct);
app.post('/comments', addComment);
//replies
app.post('/comments/reply', addReply); // <-- Thêm dòng này!
app.get('/comments/:commentId/replies', getRepliesByComment); // <-- Đúng RESTful hơn
//payment
app.use("/cart", cartRoutes);
app.use("/checkout", checkoutRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT} hẹ hẹ`);
});
