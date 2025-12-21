import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {SlidebarFeatures,SlidebarGallery} from "../Component/Slidebar/Slidebar";  
import Slidebar from "../Component/Slidebar/Slidebar";
import "../Css/Style.css"; 
// Component đồng hồ đếm ngược
function CountdownTimer({ targetDate }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{ display: "flex", gap: "16px", justifyContent: "center", margin: "16px 0" }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: "8px 16px", minWidth: 60, textAlign: "center", boxShadow: "0 2px 8px #0001" }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{String(timeLeft.days).padStart(2, "0")}</div>
        <div style={{ fontWeight: 500, fontSize: 15, color: "#222" }}>Ngày</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 8, padding: "8px 16px", minWidth: 60, textAlign: "center", boxShadow: "0 2px 8px #0001" }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{String(timeLeft.hours).padStart(2, "0")}</div>
        <div style={{ fontWeight: 500, fontSize: 15, color: "#222" }}>Giờ</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 8, padding: "8px 16px", minWidth: 60, textAlign: "center", boxShadow: "0 2px 8px #0001" }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{String(timeLeft.minutes).padStart(2, "0")}</div>
        <div style={{ fontWeight: 500, fontSize: 15, color: "#222" }}>Phút</div>
      </div>
      <div style={{ background: "#fff", borderRadius: 8, padding: "8px 16px", minWidth: 60, textAlign: "center", boxShadow: "0 2px 8px #0001" }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{String(timeLeft.seconds).padStart(2, "0")}</div>
        <div style={{ fontWeight: 500, fontSize: 15, color: "#222" }}>Giây</div>
      </div>
    </div>
  );
}
const newsList = [
  {
    id: 1,
    title: "Ưu Đãi Lớn - Khuyến Mãi Khủng Nhân Dịp Khai Trương Cửa Hàng..",
    img: "/Images/Products/new1.webp",
    date: "01-07-2025 10:12",
    desc: "Nhận thấy sự ủng hộ nhiệt tình của mọi người tại TP. Vĩnh Long, nay ShopVNB chính thức ra mắt ch...",
  },
];


export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [rackets, setRackets] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [shoes, setShoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Hàm xử lý thêm vào giỏ hàng
  const handleAddToCart = async (product) => {
    try {
      // Lấy chi tiết sản phẩm để có thông tin size
      const detailResponse = await fetch(`http://localhost:3000/products/productdetails/${product.ProductId}`);
      const productDetail = await detailResponse.json();
      
      const clothingSizes = productDetail.ClothingSizes || [];
      const shoeSizes = productDetail.ShoeSizes || [];
      const hasSizes = clothingSizes.length > 0 || shoeSizes.length > 0;

      // Nếu sản phẩm có size, hiển thị modal chọn size
      if (hasSizes) {
        // Extract size values from objects
        const clothingSizeValues = clothingSizes.map(s => s.Size || s.size || s);
        const shoeSizeValues = shoeSizes.map(s => s.Size || s.size || s);
        const sizeOptions = [...clothingSizeValues, ...shoeSizeValues];
        
        const { value: selectedSize } = await Swal.fire({
          title: 'Chọn size',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p style="margin-bottom: 15px; font-weight: 600;">${product.ProductName}</p>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                ${sizeOptions.map(size => `
                  <button class="size-option-btn" data-size="${size}" style="
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
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
          confirmButtonText: 'Thêm vào giỏ',
          cancelButtonText: 'Hủy',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          didOpen: () => {
            const buttons = document.querySelectorAll('.size-option-btn');
            let selectedBtn = null;
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

        if (selectedSize) {
          addToCartWithSize(product, selectedSize);
        }
      } else {
        // Sản phẩm không có size, thêm trực tiếp
        addToCartWithSize(product, null);
      }
    } catch (error) {
      console.error('Error checking sizes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể kiểm tra size sản phẩm.',
        confirmButtonColor: '#d33'
      });
    }
  };

  const addToCartWithSize = (product, size) => {
    try {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const cartItem = {
        Avatar: product.Avatar,
        ProductId: product.ProductId,
        ProductName: product.ProductName,
        Price: product.Price,
        Quantity: 1,
        Size: size
      };

      const existingProductIndex = cart.findIndex(
        item => item.ProductId === cartItem.ProductId && item.Size === cartItem.Size
      );

      if (existingProductIndex !== -1) {
        cart[existingProductIndex].Quantity += 1;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Sản phẩm đã được thêm vào giỏ hàng!',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.',
        confirmButtonColor: '#d33'
      });
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch("http://localhost:3000/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);

        // Giả sử CategoryId: 1=vợt, 2=áo, 3=giày (bạn sửa lại cho đúng DB)
        setRackets(data.filter(p => p.CategoryId === 1));
        setClothes(data.filter(p => p.CategoryId === 2));
        setShoes(data.filter(p => p.CategoryId === 3));
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, []);

  if (isLoading) return <p>Loading products...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="homepage-main">
      <div className="advertisement">
        <Slidebar />
        <SlidebarFeatures />
        <SlidebarGallery />
      </div>
      <ProductCarousel products={products} handleAddToCart={handleAddToCart} />
      <RacketGrid rackets={rackets} handleAddToCart={handleAddToCart} />
      <div className="section-divider">
        <span className="section-divider-text">— GIÀY CẦU LÔNG  —</span>
      </div>
      <ClothesGrid clothes={clothes} handleAddToCart={handleAddToCart} />
      <div className="section-divider">
        <span className="section-divider-text">— QUẦN ÁO CẦU LÔNG —</span>
      </div>
      <ShoesGrid shoes={shoes} handleAddToCart={handleAddToCart} />
    </div>
  );
}
// ---- HẾT SỬA ĐOẠN NÀY----

// Các component con nhận props thay vì dùng biến toàn cục
function ProductCarousel({ products, handleAddToCart }) {
  const [startIdx, setStartIdx] = useState(0);
  const visibleCount = 5;
  const maxIdx = Math.max(0, products.length - visibleCount);

  const carouselRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, lastX: 0 });

  const handleMouseDown = (e) => {
    dragState.current.dragging = true;
    dragState.current.startX = e.clientX;
    dragState.current.lastX = e.clientX;
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.lastX;
    dragState.current.lastX = e.clientX;
    if (dx > 30 && startIdx > 0) {
      setStartIdx((idx) => Math.max(0, idx - 1));
      dragState.current.dragging = false;
      document.body.style.cursor = "";
    }
    if (dx < -30 && startIdx < maxIdx) {
      setStartIdx((idx) => Math.min(maxIdx, idx + 1));
      dragState.current.dragging = false;
      document.body.style.cursor = "";
    }
  };

  const handleMouseUp = () => {
    dragState.current.dragging = false;
    document.body.style.cursor = "";
  };

  useEffect(() => {
    if (!carouselRef.current) return;
    const node = carouselRef.current;
    node.addEventListener("mousemove", handleMouseMove);
    node.addEventListener("mouseup", handleMouseUp);
    node.addEventListener("mouseleave", handleMouseUp);
    return () => {
      node.removeEventListener("mousemove", handleMouseMove);
      node.removeEventListener("mouseup", handleMouseUp);
      node.removeEventListener("mouseleave", handleMouseUp);
    };
    // eslint-disable-next-line
  }, [startIdx, maxIdx]);

  // Touch event cho mobile
  const touchState = useRef({ dragging: false, startX: 0, lastX: 0 });
  const handleTouchStart = (e) => {
    touchState.current.dragging = true;
    touchState.current.startX = e.touches[0].clientX;
    touchState.current.lastX = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    if (!touchState.current.dragging) return;
    const dx = e.touches[0].clientX - touchState.current.lastX;
    touchState.current.lastX = e.touches[0].clientX;
    if (dx > 30 && startIdx > 0) {
      setStartIdx((idx) => Math.max(0, idx - 1));
      touchState.current.dragging = false;
    }
    if (dx < -30 && startIdx < maxIdx) {
      setStartIdx((idx) => Math.min(maxIdx, idx + 1));
      touchState.current.dragging = false;
    }
  };
  const handleTouchEnd = () => {
    touchState.current.dragging = false;
  };

  const endIdx = Math.min(startIdx + visibleCount, products.length);
  const visibleProducts = products.slice(startIdx, endIdx);
  const placeholders = Array.from({ length: visibleCount - visibleProducts.length });

  // Hiệu ứng GSAP cho icon giỏ hàng
  const cartRefs = useRef([]);

  const handleCartHover = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1.25,
      rotate: 15,
      duration: 0.25,
      ease: "power1.out",
    });
  };

  const handleCartLeave = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1,
      rotate: 0,
      duration: 0.25,
      ease: "power1.inOut",
    });
  };

  return (
    <div className="product-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div className="product-section-header">
          <span className="hot-label">🔥</span>
          <span className="section-title">HÀNG HOT BÁN CHẠY</span>
        </div>
        <div style={{ minWidth: 320, marginTop: 0 }}>
          <CountdownTimer targetDate={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)} />
        </div>
      </div>
      <div
        className="product-carousel" 
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button className="carousel-btn prev" onClick={() => setStartIdx(Math.max(0, startIdx - 1))} disabled={startIdx === 0}>
          &#10094;
        </button>
        <div className="product-list">
          {visibleProducts.map((p, idx) => (
            <div className="product-card" key={p.ProductId}>
              <div className="product-img-wrap">
                <Link to={`/products/productdetails/${p.ProductId}`}>
                  <img src={`http://localhost:3000/uploads/${p.Avatar}`} alt={p.ProductName} />
                </Link>
              </div>
              <div className="product-info">
                <div className="product-name">{p.ProductName}</div>
                <div className="product-price">{Number(p.Price).toLocaleString()} VNĐ</div>
                <div className="product-status">
                  {p.status} <span role="img" aria-label="fire" style={{ marginLeft: 4 }}>🔥</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(p)}
                    style={{ flex: 1 }}
                    onMouseEnter={() => handleCartHover(idx)}
                    onMouseLeave={() => handleCartLeave(idx)}
                  >
                    <span
                      role="img"
                      aria-label="cart"
                      ref={el => (cartRefs.current[idx] = el)}
                      style={{ display: "inline-block" }}
                    >
                      🛒
                    </span>{" "}
                  </button>
                  <Link to={`/products/productdetails/${p.ProductId}`} style={{ flex: 1 }}>
                    <button className="add-to-cart-btn" style={{ width: '100%' }}>
                      👁️
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {placeholders.map((_, idx) => (
            <div className="product-card placeholder" key={`placeholder-${idx}`} />
          ))}
        </div>
        <button className="carousel-btn next" onClick={() => setStartIdx(Math.min(maxIdx, startIdx + 1))} disabled={startIdx >= maxIdx}>
          &#10095;
        </button>
      </div>
    </div>
  );
};

function RacketGrid({ rackets, handleAddToCart }) {
  const cartRefs = useRef([]);
  const handleCartHover = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1.25,
      rotate: 15,
      duration: 0.25,
      ease: "power1.out",
    });
  };
  const handleCartLeave = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1,
      rotate: 0,
      duration: 0.25,
      ease: "power1.inOut",
    });
  };

  return (
    <div className="racket-section">
      <div className="racket-section-header">
        <span className="section-title" style={{ fontWeight: 700, fontSize: 22, color: "#23406e" }}>
          | VỢT CẦU LÔNG
        </span>
      </div>
      <div className="racket-grid">
        {[0, 1].map((row) => (
          <div className="racket-row" key={row}>
            {rackets.slice(row * 5, row * 5 + 5).map((p, idx) => (
              <div className="product-card" key={p.ProductId}>
                <div className="product-img-wrap">
                  <img src={`http://localhost:3000/uploads/${p.Avatar}`} alt={p.ProductName} />
                </div>
                <div className="product-info">
                  <div className="product-name">{p.ProductName}</div>
                  <div className="product-price">{Number(p.Price).toLocaleString()} VNĐ</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(p)}
                      style={{ flex: 1 }}
                      onMouseEnter={() => handleCartHover(row * 5 + idx)}
                      onMouseLeave={() => handleCartLeave(row * 5 + idx)}
                    >
                      <span
                        role="img"
                        aria-label="cart"
                        ref={el => (cartRefs.current[row * 5 + idx] = el)}
                        style={{ display: "inline-block" }}
                      >
                        🛒
                      </span>{" "}
                    </button>
                    <Link to={`/products/productdetails/${p.ProductId}`} style={{ flex: 1 }}>
                      <button className="add-to-cart-btn" style={{ width: '100%' }}>
                        👁️ 
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
         <Link to="/allproducts?category=1">
          <button className="view-all-btn">Xem tất cả »</button>
        </Link>
      </div>
    </div>
  );
}

function ClothesGrid({ clothes, handleAddToCart }) {
  const cartRefs = useRef([]);
  const handleCartHover = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1.25,
      rotate: 15,
      duration: 0.25,
      ease: "power1.out",
    });
  };
  const handleCartLeave = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1,
      rotate: 0,
      duration: 0.25,
      ease: "power1.inOut",
    });
  };

  return (
    <div className="racket-section">
      <div className="racket-section-header">
        <span className="section-title" style={{ fontWeight: 700, fontSize: 22, color: "#23406e" }}>
          | GIÀY CẦU LÔNG
        </span>
      </div>
      <div className="racket-grid">
        {[0, 1].map((row) => (
          <div className="racket-row" key={row}>
            {clothes.slice(row * 5, row * 5 + 5).map((p, idx) => (
              <div className="product-card" key={p.ProductId}>
                <div className="product-img-wrap">
                  <img src={`http://localhost:3000/uploads/${p.Avatar}`} alt={p.ProductName} />
                </div>
                <div className="product-info">
                  <div className="product-name">{p.ProductName}</div>
                  <div className="product-price">{Number(p.Price).toLocaleString()} VNĐ</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(p)}
                      style={{ flex: 1 }}
                      onMouseEnter={() => handleCartHover(row * 5 + idx)}
                      onMouseLeave={() => handleCartLeave(row * 5 + idx)}
                    >
                      <span
                        role="img"
                        aria-label="cart"
                        ref={el => (cartRefs.current[row * 5 + idx] = el)}
                        style={{ display: "inline-block" }}
                      >
                        🛒
                      </span>{" "}
                  
                    </button>
                    <Link to={`/products/productdetails/${p.ProductId}`} style={{ flex: 1 }}>
                      <button className="add-to-cart-btn" style={{ width: '100%' }}>
                        👁️ 
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
       <Link to="/allproducts?category=2">
          <button className="view-all-btn">Xem tất cả »</button>
        </Link>
      </div>
    </div>
  );
}

function ShoesGrid({ shoes, handleAddToCart }) {
  const cartRefs = useRef([]);
  const handleCartHover = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1.25,
      rotate: 15,
      duration: 0.25,
      ease: "power1.out",
    });
  };
  const handleCartLeave = (idx) => {
    gsap.to(cartRefs.current[idx], {
      scale: 1,
      rotate: 0,
      duration: 0.25,
      ease: "power1.inOut",
    });
  };

  return (
    <div className="racket-section">
      <div className="racket-section-header">
        <span className="section-title" style={{ fontWeight: 700, fontSize: 22, color: "#23406e" }}>
          | QUẦN ÁO CẦU LÔNG
        </span>
      </div>
      <div className="racket-grid">
        {[0, 1].map((row) => (
          <div className="racket-row" key={row}>
            {shoes.slice(row * 5, row * 5 + 5).map((p, idx) => (
              <div className="product-card" key={p.ProductId}>
                <div className="product-img-wrap">
                  <img src={`http://localhost:3000/uploads/${p.Avatar}`} alt={p.ProductName} />
                </div>
                <div className="product-info">
                  <div className="product-name">{p.ProductName}</div>
                  <div className="product-price">{Number(p.Price).toLocaleString()} VNĐ</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(p)}
                      style={{ flex: 1 }}
                      onMouseEnter={() => handleCartHover(row * 5 + idx)}
                      onMouseLeave={() => handleCartLeave(row * 5 + idx)}
                    >
                      <span
                        role="img"
                        aria-label="cart"
                        ref={el => (cartRefs.current[row * 5 + idx] = el)}
                        style={{ display: "inline-block" }}
                      >
                        🛒
                      </span>{" "}
                  
                    </button>
                    <Link to={`/products/productdetails/${p.ProductId}`} style={{ flex: 1 }}>
                      <button className="add-to-cart-btn" style={{ width: '100%' }}>
                        👁️ 
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
         <Link to="/allproducts?category=3">
          <button className="view-all-btn">Xem tất cả »</button>
        </Link>
      </div>
    </div>
  );
}


