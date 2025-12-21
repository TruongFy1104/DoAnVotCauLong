import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import Swal from "sweetalert2";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recaptchaValue, setRecaptchaValue] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home");
  }, [navigate]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!recaptchaValue) {
    setError("Vui lòng xác nhận bạn không phải là người máy.");
    return;
  }

  try {
    const response = await axios.post(
      "http://localhost:3000/auth/login",
      { username, password },
      { withCredentials: true }
    );

    const { data } = response;

    // Lưu token
    localStorage.setItem("token", data.token);

    // 🔥 LƯU USER VÀO LOCAL STORAGE (bạn đang thiếu dòng này)
    localStorage.setItem("user", JSON.stringify(data.user));

    // Hiển thị thông báo đăng nhập thành công với SweetAlert
    const userRole = data.user.idgroup;
    const isAdmin = userRole === 1;

    await Swal.fire({
      icon: 'success',
      title: 'Đăng nhập thành công!',
      html: `
        <div style="text-align: center; padding: 10px;">
          <p style="font-size: 16px; margin: 10px 0;">
            Chào mừng trở lại, <strong>${data.user.username}</strong>! 👋
          </p>
          <p style="color: #666; font-size: 14px;">
            ${isAdmin ? '🔐 Đang chuyển đến trang quản trị...' : '🏠 Đang chuyển đến trang chủ...'}
          </p>
        </div>
      `,
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false
    });

    if (isAdmin) {
      window.location.href = "/privatesite/dashboard";
    } else {
      navigate("/home");
    }
  } catch (err) {
    const errorData = err.response?.data;
    
    // Nếu tài khoản bị khóa, hiển thị thông báo bằng SweetAlert
    if (errorData?.contactInfo) {
      const result = await Swal.fire({
        icon: 'error',
        title: 'Tài khoản đã bị khóa',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="color: #d33; font-weight: 600; margin-bottom: 15px;">
              ${errorData.message}
            </p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <p style="margin: 10px 0;">
              <strong>📧 Email:</strong> 
              <a href="mailto:${errorData.contactInfo.email}" style="color: #0066cc;">
                ${errorData.contactInfo.email}
              </a>
            </p>
            <p style="margin: 10px 0;">
              <strong>📞 Điện thoại:</strong> 
              <a href="tel:${errorData.contactInfo.phone}" style="color: #0066cc;">
                ${errorData.contactInfo.phone}
              </a>
            </p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-style: italic; margin-top: 15px;">
              ${errorData.contactInfo.note}
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '🏠 Về trang chủ',
        cancelButtonText: 'Đóng',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        width: '600px'
      });
      
      // Nếu người dùng click "Về trang chủ"
      if (result.isConfirmed) {
        navigate('/');
      }
      
      setError(""); // Xóa error text cũ
    } else {
      setError(errorData?.message || "Đăng nhập thất bại");
    }
  }
};
  return (
    <div id="login_page">
      <div className="container">
        <div className="circle circle1" />
        <div className="circle circle2" />
        <div className="circle circle3" />
        <div className="circle circle4" />

        <div className="form-container">
          <div className="login-container">
            <h2>Đăng nhập</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Tên đăng nhập"
                />
              </div>

              <div className="input-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mật khẩu"
                />
              </div>

              <div style={{ width: "100%", margin: "16px 0" }}>
                <ReCAPTCHA
                  sitekey="6LfKqK4rAAAAAPOFsWIDc8s6hDXZUDr0pzFbplZG"
                  onChange={(v) => setRecaptchaValue(v)}
                />
              </div>

              {error && (
                <div style={{ 
                  color: "red", 
                  marginBottom: 8, 
                  fontWeight: 500,
                  whiteSpace: "pre-line",
                  textAlign: "center",
                  padding: "10px",
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 0, 0, 0.3)"
                }}>
                  {error}
                </div>
              )}

              <button type="submit" className="login-btn">
                Đăng nhập
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "15px", marginBottom: "10px" }}>
              <a 
                href="/forgot-password" 
                style={{ 
                  color: "#050705ff", 
                  textDecoration: "none",
                  fontSize: "14px"
                }}
              >
                Quên mật khẩu?
              </a>
            </div>

            <div className="register-link">
              <p>
                Bạn chưa có tài khoản?{" "}
                <a href="/register">Register</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
