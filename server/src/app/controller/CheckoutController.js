const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Account = require('../models/Account');
const qs = require('qs');
const crypto = require('crypto');
const SECRET_KEY = 'saddasdasadsasdadsas';
const axios = require('axios');
const vnpayConfig = require('../../config/vnpayConfig'); // Thêm dòng này
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

//Thanh toán MoMo
exports.createMoMoPaymentUrl = async (req, res) => {
  try {
    const partnerCode = 'MOMO';
    const accessKey = 'F8BBA842ECF85';
    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
    const redirectUrl = 'http://localhost:3000/momo_return';
    const ipnUrl = 'http://localhost:3000/momo_ipn';
    const requestType = 'captureWallet';

    // Lấy token và giải mã user
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Token không được cung cấp" });
    }
    let user;
    try {
      user = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Lấy thông tin customer từ DB
    const customer = await Customer.findOne({
      where: { CustomerId: user.customerid },
    });
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng." });
    }

    // Nhận thông tin đơn hàng từ client
    const { amount, orderInfo, cart, address, mobile, email, firstname, lastname } = req.body;

    // 1. Lưu đơn hàng vào database với CustomerId
    const newOrder = await Order.create({
      CustomerId: customer.CustomerId,
      PaymentMethod: 'momo',
      Address: address || customer.Address,
      Mobile: mobile || customer.Mobile,
      Email: email || customer.Email,
      Firstname: firstname || customer.Firstname,
      Lastname: lastname || customer.Lastname,
      TotalPrice: amount,
      SubPrice: amount,
      Discount: 0,
      CreateAt: new Date(),
      OrderStatusId: 3,
    });

    // 2. Lưu chi tiết đơn hàng
    if (cart && Array.isArray(cart)) {
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
    }

    // 3. Tạo orderId duy nhất cho MoMo (không dùng OrderId trong DB)
    const orderId = `ORDER_${newOrder.OrderId}_${Date.now()}`;
    const requestId = Date.now().toString();

    // 4. Tạo link thanh toán MoMo như cũ
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo || 'Thanh toán đơn hàng'}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo: orderInfo || 'Thanh toán đơn hàng',
      redirectUrl,
      ipnUrl,
      extraData: "",
      requestType,
      signature,
      lang: 'vi'
    };

    const response = await axios.post(endpoint, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });


    if (response.data && response.data.payUrl) {
      res.json({ payUrl: response.data.payUrl });
    } else {
      res.status(400).json({ message: "Không tạo được link thanh toán MoMo", momoResponse: response.data });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo link thanh toán MoMo", error: error.message, momoResponse: error.response?.data });
  }
};


//Thanh toán VNPay
exports.createVNPayPaymentUrl = async (req, res) => {
  try {
    console.log("=== [VNPay] Bắt đầu tạo link thanh toán ===");
    const { amount, orderInfo, language, bankCode } = req.body;
    console.log("Request body:", req.body);

    const tmnCode = vnpayConfig.vnp_TmnCode;
    const secretKey = vnpayConfig.vnp_HashSecret;
    const vnpUrl = vnpayConfig.vnp_Url;
    const returnUrl = vnpayConfig.vnp_ReturnUrl;
    console.log("Config:", { tmnCode, secretKey, vnpUrl, returnUrl });

    // Ngày giờ theo định dạng VNPay: yyyyMMddHHmmss
    const date = new Date();
    const createDate = date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const orderId = Date.now().toString();
    console.log("createDate:", createDate, "orderId:", orderId);

    // Lấy IP khách hàng
    let ipAddr = req.headers['x-forwarded-for'] ||
                 req.connection.remoteAddress ||
                 req.socket?.remoteAddress ||
                 (req.connection.socket ? req.connection.socket.remoteAddress : null);
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';
    console.log("ipAddr:", ipAddr);

    // Tạo params ban đầu (KHÔNG có vnp_SecureHash)
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: language || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo || `Thanh toán đơn hàng #${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, 
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };
    if (bankCode) vnp_Params.vnp_BankCode = bankCode;
    console.log("vnp_Params (before sign):", vnp_Params);

    // 1. Sắp xếp params theo thứ tự alphabet
    const sortedKeys = Object.keys(vnp_Params).sort();
    console.log("sortedKeys:", sortedKeys);

    // 2. Tạo chuỗi signData KHÔNG encode
    const signData = sortedKeys
      .map(key => `${key}=${vnp_Params[key]}`)
      .join('&');
    console.log("signData:", signData);

    // 3. Tạo secure hash
    const secureHash = crypto.createHmac('sha512', secretKey)
                         .update(signData)
                         .digest('hex');
    console.log("secureHash:", secureHash);

    // 4. Gắn hash vào params
    vnp_Params.vnp_SecureHash = secureHash;
    console.log("vnp_Params (signed):", vnp_Params);

    // 5. Tạo URL thanh toán (encode toàn bộ params)
    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: true });
    console.log("paymentUrl:", paymentUrl);

    res.json({ paymentUrl });
  } catch (error) {
    console.error("VNPay ERROR:", error);
    res.status(500).json({ message: "Lỗi tạo link thanh toán VNPay" });
  }
};