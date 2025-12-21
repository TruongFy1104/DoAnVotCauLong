import React from "react";
import "../Footer/Footer.css";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-col">
          <div className="footer-logo-row">
            <img src="/Images/AT-white.png" alt="XBSports" className="footer-logo"/>
            <span className="footer-logo-text">NPT BADMINTON</span>
          </div>
          <p>NPT BADMINTON - Hệ thống cửa hàng chuyên cung cấp các sản phẩm cầu lông chính hãng: vợt, giày, quần áo, phụ kiện.</p>
          <ul className="footer-contact">
            <li><span role="img" aria-label="location">📍</span> Hệ thống cửa hàng toàn quốc</li>
            <li><span role="img" aria-label="phone">📞</span> 0343439444</li>
            <li><span role="img" aria-label="mail">✉️</span> NPTBadminton@gmail.com</li>
          </ul>
          <div>Hotline mua hàng: 0343439444</div>
          <div style={{ marginTop: 8 }}>
            <img src="/Images/Products/pay2.webp" alt="Bộ Công Thương" style={{ height: 40 }} />
          </div>
        </div>
        <div className="footer-col">
          <h4>CHÍNH SÁCH</h4>
          <ul>
            <li>Chính sách giao hàng và đổi trả</li>
            <li>Chính sách bảo mật thông tin</li>
            <li>Liên hệ CSKH Online</li>
            <li>Chính sách thanh toán</li>
            <li>Điều khoản dịch vụ</li>
            <li>Chính sách bảo hành</li>
            <li>Kiểm tra đơn hàng</li>
            <li>Hỏi đáp - FAQs</li>
            <li>Tuyển Dụng</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>HỎI ĐÁP - DỊCH VỤ</h4>
          <ul>
            <li>Sản phẩm khuyến mãi</li>
            <li>Sản phẩm nổi bật</li>
            <li>Tất cả sản phẩm</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>THỜI GIAN MỞ CỬA</h4>
          <div>24/7</div>
          <div style={{ margin: "8px 0" }}>
            Tư vấn online qua Zalo <a >0343439444</a>
          </div>
          <div>PHƯƠNG THỨC THANH TOÁN</div>
          <div className="footer-payments">
            <img src="/Images/Products/pay1.webp" alt="Phương thức thanh toán" style={{ height: 28 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <img src="/Images/Products/pay2.webp" alt="Bộ Công Thương" style={{ height: 40 }} />
          </div>
          <div className="footer-social">
            <a href="#"><i className="fab fa-facebook-square"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
            <a href="#"><i className="fab fa-tiktok"></i></a>
          </div>
        </div>
      </div>
      <button className="back-to-top-btn" onClick={scrollToTop} title="Lên đầu trang">
        ⬆
      </button>
      <div className="footer-copyright">
        © Copyright 2025 By ATSports - Hệ thống cửa hàng cầu lông uy tín.
      </div>
    </footer>
  );
}