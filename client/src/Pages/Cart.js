import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../Css/Style.css";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Lấy giỏ hàng từ localStorage khi load trang
  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(cartData);
    calculateTotal(cartData);
  }, []);

  // Tính tổng tiền
  const calculateTotal = (cartData) => {
    let total = 0;
    cartData.forEach(item => {
      total += item.Price * item.Quantity;
    });
    setTotalPrice(total);
  };

  // Cập nhật số lượng
  const updateQuantity = (productId, size, newQuantity) => {
    const updatedCart = cart.map(item => {
      if (item.ProductId === productId && item.Size === size) {
        return { ...item, Quantity: Math.max(1, newQuantity) };
      }
      return item;
    });
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    calculateTotal(updatedCart);
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeProduct = (productId, size) => {
    const updatedCart = cart.filter(item => !(item.ProductId === productId && item.Size === size));
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    calculateTotal(updatedCart);
  };

  // Thay đổi size sản phẩm
  const changeSize = async (item) => {
    try {
      // Lấy chi tiết sản phẩm để có thông tin size
      const detailResponse = await fetch(`http://localhost:3000/products/productdetails/${item.ProductId}`);
      const productDetail = await detailResponse.json();
      
      const clothingSizes = productDetail.ClothingSizes || [];
      const shoeSizes = productDetail.ShoeSizes || [];
      const hasSizes = clothingSizes.length > 0 || shoeSizes.length > 0;

      if (!hasSizes) {
        Swal.fire({
          icon: 'info',
          title: 'Thông báo',
          text: 'Sản phẩm này không có size để thay đổi.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Extract size values from objects
      const clothingSizeValues = clothingSizes.map(s => s.Size || s.size || s);
      const shoeSizeValues = shoeSizes.map(s => s.Size || s.size || s);
      const sizeOptions = [...clothingSizeValues, ...shoeSizeValues];
      
      const { value: selectedSize } = await Swal.fire({
        title: 'Chọn size mới',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; font-weight: 600;">${item.ProductName}</p>
            <p style="margin-bottom: 15px; color: #666;">Size hiện tại: <strong>${item.Size}</strong></p>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
              ${sizeOptions.map(size => `
                <button class="size-option-btn" data-size="${size}" style="
                  padding: 12px;
                  border: 2px solid ${size === item.Size ? '#3085d6' : '#e5e7eb'};
                  border-radius: 8px;
                  background: ${size === item.Size ? '#3085d6' : 'white'};
                  color: ${size === item.Size ? 'white' : 'black'};
                  cursor: pointer;
                  font-weight: 600;
                  transition: all 0.2s;
                ">
                  ${size}
                </button>
              `).join('')}
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Cập nhật',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        didOpen: () => {
          const buttons = document.querySelectorAll('.size-option-btn');
          let selectedBtn = Array.from(buttons).find(btn => btn.getAttribute('data-size') === item.Size);
          
          buttons.forEach(btn => {
            btn.addEventListener('click', () => {
              if (selectedBtn) {
                selectedBtn.style.border = '2px solid #e5e7eb';
                selectedBtn.style.background = 'white';
                selectedBtn.style.color = 'black';
              }
              btn.style.border = '2px solid #3085d6';
              btn.style.background = '#3085d6';
              btn.style.color = 'white';
              selectedBtn = btn;
            });
          });
        },
        preConfirm: () => {
          const selectedBtn = document.querySelector('.size-option-btn[style*="rgb(48, 133, 214)"]');
          if (!selectedBtn) {
            Swal.showValidationMessage('Vui lòng chọn size!');
            return false;
          }
          return selectedBtn.getAttribute('data-size');
        }
      });

      if (selectedSize && selectedSize !== item.Size) {
        // Kiểm tra xem size mới đã tồn tại trong giỏ hàng chưa
        const existingItem = cart.find(
          cartItem => cartItem.ProductId === item.ProductId && cartItem.Size === selectedSize
        );

        let updatedCart;
        if (existingItem) {
          // Nếu size mới đã tồn tại, gộp số lượng và xóa item cũ
          updatedCart = cart.map(cartItem => {
            if (cartItem.ProductId === item.ProductId && cartItem.Size === selectedSize) {
              return { ...cartItem, Quantity: cartItem.Quantity + item.Quantity };
            }
            return cartItem;
          }).filter(cartItem => !(cartItem.ProductId === item.ProductId && cartItem.Size === item.Size));
        } else {
          // Nếu size mới chưa tồn tại, cập nhật size của item hiện tại
          updatedCart = cart.map(cartItem => {
            if (cartItem.ProductId === item.ProductId && cartItem.Size === item.Size) {
              return { ...cartItem, Size: selectedSize };
            }
            return cartItem;
          });
        }

        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        calculateTotal(updatedCart);

        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: `Đã cập nhật size thành ${selectedSize}`,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      console.error('Error changing size:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể thay đổi size.',
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <div className="cart-container">
      <div className="pd-breadcrumb">
        <Link to="/home" className="pd-breadcrumb-link">Trang chủ</Link>
        <span className="pd-breadcrumb-sep">-</span>
        <Link to="/home" className="pd-breadcrumb-link">Giỏ hàng</Link>
      </div>
      <div className="cart-title">GIỎ HÀNG CỦA BẠN</div>
      <div className="cart-section-title">GIỎ HÀNG</div>
      <div className="cart-list">
        {cart.length === 0 ? (
          <div>Giỏ hàng trống.</div>
        ) : (
          cart.map(item => (
            <div className="cart-item" key={item.ProductId + (item.Size || "")}>
              <img
                src={`http://localhost:3000/uploads/${item.Avatar}`}
                alt={item.ProductName}
                className="cart-item-img"
              />          
              <div className="cart-item-name">{item.ProductName}</div>
              {/* Hiển thị size nếu có */}
              {item.Size && (
                <div 
                  className="cart-item-size" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => changeSize(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#3085d6';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '';
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                  title="Click để thay đổi size"
                >
                  Size: <b>{item.Size}</b> 🔄
                </div>
              )}
              <div className="cart-item-qty">
                <button onClick={() => updateQuantity(item.ProductId, item.Size, item.Quantity - 1)}>-</button>
                <span>{item.Quantity}</span>
                <button onClick={() => updateQuantity(item.ProductId, item.Size, item.Quantity + 1)}>+</button>
              </div>
              <div className="cart-item-price">
                {item.Price.toLocaleString()} đ
              </div>
              <button
                className="cart-item-remove"
                onClick={() => removeProduct(item.ProductId, item.Size)}
                title="Xóa sản phẩm"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M7 7L15 15M15 7L7 15" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
      <div className="cart-total-row">
        <span className="cart-total-label">TỔNG TIỀN:</span>
        <span className="cart-total-value">{totalPrice.toLocaleString()} đ</span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '32px', 
        justifyContent: 'center',
        padding: '0 20px'
      }}>
        <Link to="/home" style={{ flex: '1', maxWidth: '280px' }}>
          <button 
            style={{ 
              width: '100%',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Quay lại trang chủ
          </button>
        </Link>
        
        <a
          href="#"
          style={{ flex: '1', maxWidth: '280px', textDecoration: 'none' }}
          onClick={e => {
            e.preventDefault();
            if (cart.length === 0) {
              alert("Giỏ hàng của bạn trống. Vui lòng thêm sản phẩm để tiếp tục thanh toán.");
              return;
            }
            const token = localStorage.getItem("token");
            if (token) {
              window.location.href = "/checkout";
            } else {
              alert("Bạn cần đăng nhập để tiếp tục thanh toán.");
              window.location.href = "/login";
            }
          }}
        >
          <button 
            disabled={cart.length === 0}
            style={{ 
              width: '100%',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              background: cart.length > 0 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                : 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
              color: 'white',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: cart.length > 0 
                ? '0 4px 14px rgba(59, 130, 246, 0.4)' 
                : '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (cart.length > 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (cart.length > 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)';
              }
            }}
          >
            Tiếp tục thanh toán
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </a>
      </div>
    </div>
  );
};

export default Cart;