const Account = require('../models/Account');
const Order =require('../models/Order');
const OrderDetail =require('../models/OrderDetail');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'saddasdasadsasdadsas'; 
const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');

exports.getAllAccountsUser = async (req, res) => {
    try {
        const accounts = await Account.findAll();
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching all accounts:', error);
        res.status(500).json({ error: error.message });
    }
};

// admin
exports.getProfileUser = async (req, res) => {
    try {
        const user = req.user;
        res.json(user); 
    } catch (err) {
        console.error('Error retrieving user profile:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfileUser = async (req, res) => {
    const { lastname, firstname, gender, address, mobile } = req.body;
    const userId = req.user.userId;
    

    try {
        const user = await Account.findOne({ where: { AccountId: userId } });
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ error: 'Người dùng không tồn tại' });
        }

        user.Lastname = lastname || user.Lastname;
        user.Firstname = firstname || user.Firstname;
        user.Gender = gender || user.Gender;
        user.Address = address || user.Address;
        user.Mobile = mobile || user.Mobile;

        const customer = await Customer.findOne({ where: { CustomerId: user.CustomerId } });
        console.log(customer)
        customer.Mobile = user.Mobile;
        customer.Address = user.Address;

        await user.save();
        await customer.save();
        
        // Generate new token after updating user information
        const newToken = jwt.sign(
            {
                username: user.Username,
                userId: user.AccountId,
                email: user.Email,
                mobile: user.Mobile,
                address: user.Address,
                firstname: user.Firstname,
                lastname: user.Lastname,
                gender: user.Gender,
            },
            SECRET_KEY, // Use secret key from environment or config
            { expiresIn: '1h' } // Set token expiration time
        );

        res.json({
            message: 'Thông tin người dùng đã được cập nhật',
            user,
            token: newToken, // Return new token
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.changePasswordUser = async (req, res) => {
    const { oldPassword, newPassword } = req.body; // Nhận mật khẩu cũ và mật khẩu mới từ request body
    const userId = req.user.userId;  // Lấy userId từ token đã xác thực

    try {
        // Lấy thông tin người dùng từ cơ sở dữ liệu
        const user = await Account.findOne({ where: { AccountId: userId } });
        
        // Nếu không tìm thấy người dùng
        if (!user) {
            return res.status(404).json({ error: 'Người dùng không tồn tại' });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.Password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu cũ không chính xác' });
        }

        // Kiểm tra tính hợp lệ của mật khẩu mới (ví dụ: ít nhất 8 ký tự)
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu mới vào cơ sở dữ liệu
        user.Password = hashedPassword;
        await user.save();

        // Tạo lại token mới với thông tin người dùng đã thay đổi mật khẩu
        const newToken = jwt.sign(
            {
                username: user.Username,
                userId: user.AccountId,
                email: user.Email,
                mobile: user.Mobile,
                address: user.Address,
                firstname: user.Firstname,
                lastname: user.Lastname,
                gender: user.Gender,
            },
            SECRET_KEY, 
            { expiresIn: '7d' } 
        );

        // Trả về token mới và thông báo thay đổi mật khẩu thành công
        res.json({
            message: 'Mật khẩu đã được thay đổi thành công',
            token: newToken, // Trả về token mới
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getOrderUser = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(403).json({ message: "Token không được cung cấp" });
    }

    try {
        const user = jwt.verify(token, SECRET_KEY);
        req.user = user; 

       
        const customer = await Customer.findOne({
            where: { CustomerId: user.customerid },
        });
        if (!customer) {
            return res.status(404).json({ message: "Không tìm thấy khách hàng." });
        }
        const orders = await Order.findAll({
            where: { CustomerId: user.customerid },
            order: [["CreateAt", "DESC"]], 
        });
      
        if (orders.length === 0) {
            return res
                .status(404)
                .json({ message: "Khách hàng này chưa có đơn hàng nào." });
        }
        // Trả về danh sách đơn hàng
        res.json({ customer, orders });
    } catch (err) {
        console.error("Error: ", err.message);
        res.status(500).json({ error: err.message });
    }
};
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params; // Lấy orderId từ params
        console.log(orderId)

        const orderDetail = await OrderDetail.findAll({
            where: {OrderId: orderId}, 
            
            include: [{
                model: Product,
                as: "Product"
            },
            {
                model: Order,
                as:"Order" 
            }]
        });
        if (!orderDetail) {
            return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });
        }
        // Trả về thông tin đơn hàng, khách hàng và các sản phẩm trong đơn hàng
        res.json(orderDetail);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
        res.status(500).json({ error: error.message });
    }
};