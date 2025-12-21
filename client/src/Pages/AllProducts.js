import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import "../Css/Style.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const priceOptions = [
  { label: "Giá dưới 500.000đ", value: "under500k", min: 0, max: 500000 },
  { label: "500.000đ - 1 triệu", value: "500k-1m", min: 500000, max: 1000000 },
  { label: "1 - 2 triệu", value: "1m-2m", min: 1000000, max: 2000000 },
  { label: "2 - 3 triệu", value: "2m-3m", min: 2000000, max: 3000000 },
  { label: "Giá trên 3 triệu", value: "above3m", min: 3000000, max: Infinity },
];

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priceFilters, setPriceFilters] = useState({});
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState("default");
  const [sortBoxFocus, setSortBoxFocus] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const query = useQuery();
  const categoryParam = query.get("category");
  const brandParam = query.get("brand");

  // Fetch data
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("http://localhost:3000/products").then(res => res.json()),
      fetch("http://localhost:3000/brands").then(res => res.json()),
      fetch("http://localhost:3000/categories").then(res => res.json()),
    ]).then(([prod, br, cat]) => {
      setProducts(prod);
      setBrands(br);
      setCategories(cat);
      setFilteredProducts(prod);
      setIsLoading(false);
      // console.log("products sample:", prod[0]);
    }).catch(() => setIsLoading(false));
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = products;
    // Lọc theo query param nếu có
    if (categoryParam) {
      filtered = filtered.filter(p => String(p.CategoryId) === String(categoryParam));
    }
    if (brandParam) {
      filtered = filtered.filter(p => String(p.IdBrand) === String(brandParam));
    }
    // Lọc theo filter sidebar
    if (selectedCategories.length > 0)
      filtered = filtered.filter(p => selectedCategories.includes(Number(p.CategoryId)));
    if (selectedBrands.length > 0)
      filtered = filtered.filter(p => selectedBrands.includes(p.IdBrand));
    const activePrices = Object.keys(priceFilters).filter(k => priceFilters[k]);
    if (activePrices.length > 0) {
      filtered = filtered.filter(p =>
        activePrices.some(key => {
          const opt = priceOptions.find(o => o.value === key);
          return p.Price >= opt.min && p.Price < opt.max;
        })
      );
    }
    setFilteredProducts(filtered);
  }, [selectedBrands, selectedCategories, priceFilters, products, categoryParam, brandParam]);

  // Sắp xếp sản phẩm
  useEffect(() => {
    let sorted = [...filteredProducts];
    if (sortOption === "price-asc") {
      sorted.sort((a, b) => a.Price - b.Price);
    } else if (sortOption === "price-desc") {
      sorted.sort((a, b) => b.Price - a.Price);
    } else if (sortOption === "az") {
      sorted.sort((a, b) => a.ProductName.localeCompare(b.ProductName));
    } else if (sortOption === "za") {
      sorted.sort((a, b) => b.ProductName.localeCompare(a.ProductName));
    }
    setFilteredProducts(sorted);
    // eslint-disable-next-line
  }, [sortOption]);

  // Handlers
  const handleBrandChange = id => setSelectedBrands(prev =>
    prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
  );
  const handleCategoryChange = id => setSelectedCategories(prev =>
    prev.includes(Number(id))
      ? prev.filter(c => c !== Number(id))
      : [...prev, Number(id)]
  );
  const handlePriceChange = key => setPriceFilters(prev => ({
    ...prev, [key]: !prev[key]
  }));
  const handleReset = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setPriceFilters({});
  };

  const cartRefs = useRef([]);
  const handleCartHover = idx => {
    const el = cartRefs.current[idx];
    if (!el) return;
    el.style.transition = "transform 0.18s ease";
    el.style.transform = "translateY(-4px) scale(1.06)";
  };
  const handleCartLeave = idx => {
    const el = cartRefs.current[idx];
    if (!el) return;
    el.style.transform = "";
  };

  // Hàm thêm vào giỏ hàng
  const handleAddToCart = async (product) => {
    try {
      // Fetch product details to check sizes
      const response = await fetch(`http://localhost:3000/products/productdetails/${product.ProductId}`);
      const data = await response.json();
      
      const clothingSizes = data.ClothingSizes || [];
      const shoeSizes = data.ShoeSizes || [];
      const hasSizes = clothingSizes.length > 0 || shoeSizes.length > 0;
      
      if (hasSizes) {
        // Có size - hiển thị modal để chọn
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
        // Không có size - thêm trực tiếp
        addToCartWithSize(product, null);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải thông tin sản phẩm. Vui lòng thử lại!',
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

      window.dispatchEvent(new Event("storage"));
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


  return (
    <div style={{ background: "#f7f7f7", minHeight: "100vh", padding: "32px 0" }}>
      <div style={{
        maxWidth: 1500,
        margin: "0 auto",
        display: "flex",
        gap: 24
      }}>
        {/* Sidebar bộ lọc */}
        <aside
          style={{
            background: "#eaf4fb",
            borderRadius: 16,
            boxShadow: "0 2px 12px #0001",
            border: "1px solid #b6d4ef",
            padding: 24,
            minWidth: 260,
            maxWidth: 320,
            flex: "0 0 280px",
            height: "fit-content"
          }}
        >
          {/* Nút xem tất cả sản phẩm */}
          <button
            style={{
              width: "100%",
              background: "linear-gradient(20deg, #5f9bd8 0%, #d9dde2 100%)",
              color: "#000000ff",
              border: "none",
              borderRadius: 6,
              padding: "10px 0",
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 18,
              cursor: "pointer"
            }}
            onClick={() => navigate("/allproducts")}
          >
            Xem tất cả sản phẩm
          </button>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 18 }}>CHỌN MỨC GIÁ</div>
          <div style={{ marginBottom: 24 }}>
            {priceOptions.map(opt => (
              <div key={opt.value} style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={priceFilters[opt.value] || false}
                    onChange={() => handlePriceChange(opt.value)}
                  />
                  <span style={{ marginLeft: 8 }}>{opt.label}</span>
                </label>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>THƯƠNG HIỆU</div>
          <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 24 }}>
            {brands.map(brand => (
              <div key={brand.BrandId} style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.BrandId)}
                    onChange={() => handleBrandChange(brand.BrandId)}
                  />
                  <span style={{ marginLeft: 8 }}>{brand.BrandName}</span>
                </label>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>THỂ LOẠI</div>
          <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 24 }}>
            {categories.map(cat => (
              <div key={cat.CategoryId} style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(Number(cat.CategoryId))}
                    onChange={() => handleCategoryChange(cat.CategoryId)}
                  />
                  <span style={{ marginLeft: 8 }}>{cat.CategoryName}</span>
                </label>
              </div>
            ))}
          </div>
          <button
            className="view-all-btn"
            style={{
              background: "#fff",
              color: "#007bff",
              border: "1px solid #007bff",
              borderRadius: 6,
              padding: "6px 18px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 8
            }}
            onClick={handleReset}
          >
            Bỏ lọc
          </button>
        </aside>
        <main style={{
          flex: 1,
          background: "#eaf4fb",
          borderRadius: 16,
          boxShadow: "0 2px 12px #0001",
          border: "1px solid #b6d4ef",
          padding: 24
        }}>
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginBottom: 18
          }}>
            <div
              style={{
                background: "#f5faff",
                border: (sortBoxFocus || sortDropdownOpen) ? "2px solid #007bff" : "2px solid #b6d4ef",
                borderRadius: 10,
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                boxShadow: "none",
                transition: "border-color 0.18s"
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 15, marginRight: 8 }}>Sắp xếp:</span>
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                onFocus={() => setSortBoxFocus(true)}
                onBlur={() => { setSortBoxFocus(false); setTimeout(() => setSortDropdownOpen(false), 150); }}
                onMouseDown={() => setSortDropdownOpen(true)}
                style={{
                  border: (sortBoxFocus || sortDropdownOpen) ? "1.5px solid #007bff" : "1px solid #ddd",
                  borderRadius: 6,
                  padding: "4px 12px",
                  outline: "none",
                  transition: "border-color 0.18s"
                }}
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </div>
          </div>
          {/* Tiêu đề */}
          <div style={{
            fontWeight: 700,
            fontSize: 22,
            color: "#222",
            marginBottom: 18
          }}>
            TẤT CẢ SẢN PHẨM
          </div>
          {/* Lưới sản phẩm */}
          <div
            className="product-list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 24,
            }}
          >
            {isLoading ? (
              <div style={{ color: "#222", fontWeight: 500, gridColumn: "1/-1" }}>Đang tải sản phẩm...</div>
            ) : filteredProducts.length > 0 ? filteredProducts.map((product, idx) => (
              <div className="product-card" key={product.ProductId} style={{
                borderRadius: 12,
                border: "1px solid #eee",
                background: "#fff",
                boxShadow: "0 2px 8px #0001",
                transition: "box-shadow .2s"
              }}>
                <div className="product-img-wrap" style={{
                  background: "#fafafa",
                  borderRadius: 8,
                  height: 160,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10
                }}>
                  <Link to={`/products/productdetails/${product.ProductId}`}>
                    <img
                      src={`http://localhost:3000/uploads/${product.Avatar}`}
                      alt={product.ProductName}
                      style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain" }}
                    />
                  </Link>
                </div>
                <div className="product-info" style={{ padding: "0 8px 8px" }}>
                  <div className="product-name" style={{
                    fontWeight: 500,
                    fontSize: 15,
                    marginBottom: 4,
                    minHeight: 40,
                    color: "#222"
                  }}>{product.ProductName}</div>
                  <div className="product-price" style={{
                    color: "#e60023",
                    fontWeight: 700,
                    fontSize: 17
                  }}>
                    {Number(product.Price).toLocaleString()} đ
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
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
                    <Link to={`/products/productdetails/${product.ProductId}`} style={{ flex: 1 }}>
                      <button className="add-to-cart-btn" style={{ width: '100%' }}>
                        👁️ 
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ color: "#c42241", fontWeight: 500, marginTop: 32, gridColumn: "1/-1" }}>Không có sản phẩm nào phù hợp với bộ lọc của bạn.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AllProducts;