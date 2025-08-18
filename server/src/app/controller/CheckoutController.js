const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Account = require('../models/Account'); // Thêm dòng này nếu chưa có
const SECRET_KEY = 'saddasdasadsasdadsas';

exports.getCustomerData = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Token không được cung cấp" });
  }
  try {
    const user = jwt.verify(token, SECRET_KEY);

    const customer = await Customer.findOne({
      where: { CustomerId: user.customerid },
    });
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng." });
    }
    res.json({
      Firstname: customer.Firstname,
      Lastname: customer.Lastname,
      Address: customer.Address,
      Mobile: customer.Mobile,
      Email: customer.Email,
    });
  } catch (err) {
    console.error("Error in getCustomerData:", err);
    res.status(401).json({ message: "Token không hợp lệ" });
  }
}; 

// Xử lý thanh toán và tạo đơn hàng
exports.checkout = async (req, res) => {
  const { cart, paymentMethod, address, mobile, email, firstname, lastname } = req.body;

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(403).json({ message: "Token không được cung cấp" });
  }

  try {
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user;

    // Lấy thông tin khách hàng từ DB
    const customer = await Customer.findOne({
      where: { CustomerId: user.customerid },
    });

    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng." });
    }

    // Lấy thông tin account từ DB
    const account = await Account.findOne({
      where: { AccountId: user.userId },
    });

    // Debug giá trị nhận được và giá trị hiện tại
    

    // Nếu có địa chỉ hoặc số điện thoại mới, cập nhật vào Customer và Account
    let needUpdateCustomer = false;
    let needUpdateAccount = false;
    if (address && address !== customer.Address) {
      customer.Address = address;
      needUpdateCustomer = true;
    }
    if (mobile && mobile !== customer.Mobile) {
      customer.Mobile = mobile;
      needUpdateCustomer = true;
    }
    if (account) {
      if (address && address !== account.Address) {
        account.Address = address;
        needUpdateAccount = true;
      }
      if (mobile && mobile !== account.Mobile) {
        account.Mobile = mobile;
        needUpdateAccount = true;
      }
    }
    if (needUpdateCustomer) {
      await customer.save();
    }
    if (needUpdateAccount) {
      await account.save();
    }

    // Tính tổng tiền giỏ hàng (SubPrice)
    const subPrice = cart.reduce((acc, item) => acc + (item.Price * item.Quantity), 0);
    const discount = 2;  
    const newOrder = await Order.create({
      CustomerId: customer.CustomerId,
      PaymentMethod: paymentMethod,
      Address: address || customer.Address,
      Mobile: mobile || customer.Mobile,
      Email: email || customer.Email,
      Firstname: firstname || customer.Firstname,
      Lastname: lastname || customer.Lastname,
      TotalPrice: subPrice,
      SubPrice: subPrice,
      Discount: discount,
      CreateAt: new Date(),
      OrderStatusId : 3,
    });

    if (!newOrder.OrderId) {
      return res.status(400).json({ message: "Không thể tạo đơn hàng." });
    }

    // Tạo các chi tiết đơn hàng, thêm Size
    const orderDetails = cart.map(item => ({
      OrderId: newOrder.OrderId,
      ProductId: item.ProductId,
      Quantity: item.Quantity,
      Size: item.Size || null
    }));

    for (let i = 0; i < orderDetails.length; i++) {
      await OrderDetail.create({
        OrderId: orderDetails[i].OrderId,
        ProductId: orderDetails[i].ProductId,
        Quantity: orderDetails[i].Quantity,
        Size: orderDetails[i].Size
      });
    }

    res.status(201).json({
      message: "Đơn hàng đã được tạo thành công!",
      orderId: newOrder.OrderId,
      totalAmount: newOrder.TotalPrice,
      orderDate: newOrder.CreateAt,
      customer: {
        Address: customer.Address,
        Mobile: customer.Mobile
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};