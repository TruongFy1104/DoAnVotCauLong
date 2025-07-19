import React, { useState, useRef, useEffect } from "react";
import "./Header.css";
import { FaSearch, FaShoppingCart, FaUserCircle, FaChevronDown } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";
const {decodeJWT} = require('../../Pages/Common')

const productMenu = [
  {
    label: "Vợt cầu lông",
    brands: ["Yonex", "Victor", "Lining", "Mizuno"]
  },
  {
    label: "Giày cầu lông",
    brands: ["Yonex", "Victor", "Lining", "Mizuno"]
  },
  {
    label: "Quần áo cầu lông",
    brands: ["Yonex", "Victor", "Lining", "Mizuno"]
  },
  {
    label: "Phụ kiện",
    brands: ["Yonex", "Victor", "Lining", "Mizuno"]
  }
];

const suggestedProducts = [
  {
    name: "Vợt Yonex Astrox 88D Pro",
    price: "3.990.000₫",
    image: "Images/gay.webp",
  },
  // ...thêm sản phẩm nếu muốn
];

const Header = () => {
  // useEffect(() => {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("username");
  // }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [productDropdown, setProductDropdown] = useState(false);
  const [hoveredType, setHoveredType] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Kiểm tra trạng thái đăng nhập
  const [idGroup, setIdGroup] = useState(0);
  const [username, setUsername] = useState(""); // Lưu tên người dùng
  const [cartItems, setCartItems] = useState([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const navigate = useNavigate(); 
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    // Xóa thêm các thông tin khác nếu có
    setIsLoggedIn(false);
    setIdGroup(2);
    setUsername("");
    window.location.href = "/Login";
  }

  const fetchSearchResults = async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/products/search?q=${query}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (debounceTimer) clearTimeout(debounceTimer);

    if (value.length > 0) {
      const timer = setTimeout(() => {
        fetchSearchResults(value);
      }, 300);
      setDebounceTimer(timer);
    } else {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      const decodedToken = decodeJWT(token);
      setIdGroup(decodedToken.idgroup)
      // console.log(decodedToken.idgroup)
      setUsername(localStorage.getItem("username")); // Lưu tên người dùng từ localStorage (nếu có)
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(cart);
  }, []);

  // Đóng search và dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
        setFocused(false);
        setSearch("");           // <-- Thêm dòng này để xóa nội dung search khi đóng
        setSearchResults([]);    // <-- Xóa luôn kết quả gợi ý nếu muốn
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setProductDropdown(false);
        setHoveredType(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đóng dropdown user khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = searchResults;
  
const handleViewDetails = (productId) => {
    setSearchOpen(false);
    setSearch(""); // Xóa nội dung tìm kiếm
    setSearchResults([]); // Xóa kết quả tìm kiếm
    navigate(`/products/productdetails/${productId}`);
  };
  return (
    <header className="modern-header">
      <div className="header-logo">
        <Link to="/home" >
        <img src="Images/AT.png" alt="Logo" className="logo-img" />
        <span className="logo-text">AT BADMINTON</span>
        </Link>
      </div>
      <nav className="header-nav">
        <ul>
          <li><Link to="/home"><a href="#">Home</a></Link></li>

          <li
            className="dropdown-parent"
            ref={dropdownRef}
            onMouseEnter={() => setProductDropdown(true)}
            onMouseLeave={() => { setProductDropdown(false); setHoveredType(null); }}
          >
            <a
              href="#"
              className=""
              onClick={e => { e.preventDefault(); setProductDropdown(v => !v); }}
            >
              Products
            </a>
            <div className={`dropdown-menu${productDropdown ? " show" : ""}`}>
              <div className="dropdown-level1">
                {productMenu.map((cat, idx) => (
                  <button
                    key={cat.label}
                    className={`dropdown-level1-item${hoveredType === idx ? " active" : ""}`}
                    onMouseEnter={() => setHoveredType(idx)}
                    onFocus={() => setHoveredType(idx)}
                    tabIndex={0}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {hoveredType !== null && (
                <div className="dropdown-level2">
                  <div className="dropdown-level2-title">{productMenu[hoveredType].label}</div>
                  <ul className="dropdown-level2-list">
                    {productMenu[hoveredType].brands.map(brand => (
                      <li key={brand}>
                        <a href={`#${productMenu[hoveredType].label}-${brand}`}>
                          {brand}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </li>
          <li><a href="#">Page</a></li>
          <li><a href="#">About Us</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
      <div className="header-actions">
        <div className="search-container" ref={searchRef}>
          {searchOpen && (
            <div className="search-box-brown">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={handleSearchChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                autoFocus
              />
              {focused && (
                <ul className="suggestions-list">
                  {isLoading ? (
                    <li className="suggestion-no-result">Đang tìm kiếm...</li>
                  ) : filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        className="suggestion-product-item"
                        onClick={() => handleViewDetails(item.ProductId)}
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={`http://localhost:3000/uploads/${item.Avatar}`}
                          alt={item.ProductName}
                          className="suggestion-product-img"
                        />
                        <div className="suggestion-product-info">
                          <div className="suggestion-product-name">{item.ProductName}</div>
                          <div className="suggestion-product-price">{Number(item.Price).toLocaleString()} VNĐ</div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="suggestion-no-result">Không tìm thấy sản phẩm phù hợp.</li>
                  )}
                </ul>
              )}
            </div>
          )}
          <button
            className="search-btn"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search"
          >
            <FaSearch />
          </button>
        </div>
        <Link to="/cart">
         <button className="icon-btn" aria-label="Cart">
          <FaShoppingCart />
        </button>
        </Link>       
        <div className="user-dropdown-container" ref={userDropdownRef}>
          {!isLoggedIn ? (
            <button
              className="icon-btn"
              aria-label="Profile"
              onClick={() => window.location.href = "/Login"}
            >
              <FaRegUser />
            </button>
          ) : (
            <div
              className="user-avatar-btn"
              onClick={() => setUserDropdownOpen((v) => !v)}
              tabIndex={0}
            >
              <img src="/Images/user2.png" alt="User Avatar" className="user-avatar-img" />
              <span className="username">{username}</span>
              <FaChevronDown style={{ marginLeft: 4, fontSize: 13 }} />
              {userDropdownOpen && (
                <div className="user-dropdown-menu">
                  <ul>
                    {idGroup === 2 ? (
                      <>
                        <li>
                          <Link to="/UserProfile">Thông tin</Link>
                        </li>
                        <li>
                          <a href="#" onClick={handleLogout}>Logout</a>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link to="/Privatesite/Dashboard">Trang quản trị</Link>
                        </li>
                        <li>
                          <a href="#" onClick={handleLogout}>Logout</a>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;