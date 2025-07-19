import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Css/Style.css";

export default function Checkout() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    email: "",
    payment: "cod",
  });
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [userInfo, setUserInfo] = useState({
    Firstname: "",
    Lastname: "",
    Address: "",
    Mobile: "",
    Email: "",
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để tiếp tục.');
      window.location.href = '/login';
      return;
    }

    fetch('http://localhost:3000/checkout/getcustomer', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            console.error("API error response:", text);
            throw new Error('Không thể lấy thông tin khách hàng.');
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Customer data:", data);
        setUserInfo(data);
      })
      .catch((error) => {
        console.error('Lỗi khi lấy thông tin khách hàng:', error);
        alert('Không thể lấy thông tin khách hàng. Vui lòng thử lại.');
      });
  }, []);

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(cartData);
    setTotal(cartData.reduce((sum, item) => sum + item.Price * item.Quantity, 0));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để thanh toán.');
      window.location.href = '/login';
      return;
    }

    if (cart.length === 0) {
      alert('Giỏ hàng của bạn đang rỗng. Vui lòng thêm sản phẩm vào giỏ hàng.');
      return;
    }

    // Kiểm tra thông tin khách hàng
    if (
      !userInfo.Address ||
      !userInfo.Mobile ||
      !userInfo.Email ||
      !userInfo.Firstname ||
      !userInfo.Lastname
    ) {
      alert('Vui lòng điền đầy đủ thông tin cá nhân.');
      return;
    }

    const subPrice = cart.reduce((acc, item) => acc + item.Price * item.Quantity, 0);
    const discount = 0;

    fetch('http://localhost:3000/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cart, // Mỗi item: { ProductId, ProductName, Price, Quantity, Size, Avatar }
        paymentMethod: form.payment,
        address: form.address,
        mobile: form.phone,
        email: form.email,
        firstname: form.firstName,
        lastname: form.lastName,
        subPrice,
        discount,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert('Đặt hàng thành công! Mã đơn hàng: ' + data.orderId);
          localStorage.removeItem('cart');
          setCart([]);
          window.location.href = '/';
        } else {
          alert('Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.');
        }
      })
      .catch((error) => {
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
        console.error(error);
      });
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-grid">
        {/* Thông tin khách hàng */}
        <div className="checkout-info">
            <div className="pd-breadcrumb">
        <Link to="/home" className="pd-breadcrumb-link">Giỏ hàng</Link>
        <span className="pd-breadcrumb-sep">-</span>
        <Link to="/home" className="pd-breadcrumb-link">Thanh toán</Link>
        </div>
          <div className="checkout-section-title">THÔNG TIN KHÁCH HÀNG</div>
          <div className="checkout-row">
            <div className="checkout-field">
              <label>First Name *</label>
              <input name="Firstname" value={userInfo.Firstname} onChange={handleInputChange} placeholder="Nhập tên" />
            </div>
            <div className="checkout-field">
              <label>Last Name *</label>
              <input name="Lastname" value={userInfo.Lastname} onChange={handleInputChange} placeholder="Nhập họ" />
            </div>
          </div>
          <div className="checkout-field">
            <label>Địa chỉ *</label>
            <input name="Address" value={userInfo.Address} onChange={handleInputChange} placeholder="Nhập địa chỉ" />
          </div>
          <div className="checkout-row">
            <div className="checkout-field">
              <label>Phone*</label>
              <input name="Mobile" value={userInfo.Mobile} onChange={handleInputChange} placeholder="Nhập số điện thoại" />
            </div>
            <div className="checkout-field">
              <label>Email Address *</label>
              <input name="Email" value={userInfo.Email} onChange={handleInputChange} placeholder="" />
            </div>
          </div>
        </div>
        {/* Đơn hàng */}
        <div className="checkout-order">
          <div className="checkout-section-title">YOUR ORDER</div>
          <table className="checkout-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Tổng giá</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    {item.ProductName} {item.Size && <span style={{color:"#2563eb"}}>Size: {item.Size}</span>} <b>X{item.Quantity}</b>
                  </td>
                  <td>{item.Price.toLocaleString()} VNĐ</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><b>Tổng tiền</b></td>
                <td><b>{total.toLocaleString()} VNĐ</b></td>
              </tr>
              <tr>
                <td><b>Shipping</b></td>
                <td><b style={{ color: "#218a5a" }}>Free</b></td>
              </tr>
              <tr>
                <td><b>Tổng đơn hàng</b></td>
                <td><b style={{ color: "#2563eb" }}>{total.toLocaleString()} VNĐ</b></td>
              </tr>
            </tfoot>
          </table>
          <div className="checkout-pay-method">
            <label>Phương thức thanh toán</label>
            <select name="payment" value={form.payment} onChange={handleChange}>
              <option value="cod">Thanh toán khi nhận hàng</option>
              <option value="bank">Chuyển khoản ngân hàng</option>
            </select>
          </div>
          <button className="checkout-btn" onClick={handleCheckout}>THANH TOÁN</button>
        </div>
      </div>
    </div>
  );
}