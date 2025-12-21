import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./Login.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Nhập email+username, 2: Nhập OTP, 3: Nhập mật khẩu mới
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Bước 1: Gửi OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email || !username) {
      Swal.fire("Lỗi", "Vui lòng nhập đầy đủ email và tên đăng nhập", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/forgot-password/send-otp",
        { email, username }
      );

      Swal.fire({
        icon: "success",
        title: "Đã gửi OTP!",
        text: response.data.message,
        timer: 3000
      });

      setStep(2);
      // Bắt đầu đếm ngược 10 phút
      setCountdown(600); // 600 giây = 10 phút
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      const message = error.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.";
      Swal.fire("Lỗi", message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp) {
      Swal.fire("Lỗi", "Vui lòng nhập mã OTP", "error");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3000/forgot-password/verify-otp",
        { email, username, otp }
      );

      Swal.fire({
        icon: "success",
        title: "Xác thực thành công!",
        text: "Vui lòng nhập mật khẩu mới",
        timer: 2000
      });

      setStep(3);
    } catch (error) {
      const message = error.response?.data?.message || "Mã OTP không đúng";
      Swal.fire("Lỗi", message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      Swal.fire("Lỗi", "Vui lòng nhập đầy đủ thông tin", "error");
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/forgot-password/reset",
        { email, username, otp, newPassword }
      );

      await Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: response.data.message,
        timer: 3000
      });

      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message || "Không thể đặt lại mật khẩu";
      Swal.fire("Lỗi", message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Hàm gửi lại OTP
  const handleResendOTP = () => {
    setStep(1);
    setOtp("");
    setCountdown(0);
  };

  // Format thời gian đếm ngược
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="login_page">
      <div className="container">
        <div className="circle circle1" />
        <div className="circle circle2" />
        <div className="circle circle3" />
        <div className="circle circle4" />

        <div className="form-container">
          <div className="login-container" style={{ height: "auto", minHeight: "500px", padding: "2.5rem 3rem" }}>
            {/* Header với nút back */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem", position: "relative" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  position: "absolute",
                  left: "-10px",
                  background: "none",
                  border: "none",
                  fontSize: "28px",
                  cursor: "pointer",
                  color: "#fff",
                  padding: "0",
                  lineHeight: "1"
                }}
              >
                ←
              </button>
              <h2 style={{ margin: "0 auto", color: "#fbf8f8", fontSize: "1.8rem" }}>Quên mật khẩu</h2>
            </div>

            {/* Stepper */}
            <div style={{ marginBottom: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ 
                  flex: 1, 
                  textAlign: "center",
                  color: step >= 1 ? "#89ff02ff" : "#999",
                  fontWeight: step === 1 ? "bold" : "normal",
                  fontSize: "13px"
                }}>
                  1. Email
                </div>
                <div style={{ 
                  flex: 1, 
                  textAlign: "center",
                  color: step >= 2 ? "#89ff02ff" : "#999",
                  fontWeight: step === 2 ? "bold" : "normal",
                  fontSize: "13px"
                }}>
                  2. OTP
                </div>
                <div style={{ 
                  flex: 1, 
                  textAlign: "center",
                  color: step >= 3 ? "#89ff02ff" : "#999",
                  fontWeight: step === 3 ? "bold" : "normal",
                  fontSize: "13px"
                }}>
                  3. Mật khẩu mới
                </div>
              </div>
              <div style={{ 
                height: "3px", 
                background: "#444", 
                borderRadius: "2px",
                overflow: "hidden"
              }}>
                <div style={{ 
                  height: "100%", 
                  background: "linear-gradient(20deg, #5f9bd8 0%, #d9dde2 100%)",
                  width: `${(step / 3) * 100}%`,
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>

            {/* Bước 1: Nhập Email + Username */}
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <p style={{ textAlign: "center", color: "#ccc", marginBottom: "20px", fontSize: "14px" }}>
                  Nhập email và tên đăng nhập để nhận mã OTP khôi phục mật khẩu
                </p>
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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Email đã đăng ký"
                  />
                </div>
                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            )}

            {/* Bước 2: Nhập OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <p style={{ textAlign: "center", color: "#ccc", marginBottom: "5px", fontSize: "14px" }}>
                  Mã OTP đã được gửi đến email:<br />
                  <strong style={{ color: "#fff" }}>{email}</strong>
                </p>
                <p style={{ textAlign: "center", color: "#aaa", marginBottom: "15px", fontSize: "12px" }}>
                  Tài khoản: <strong style={{ color: "#fff" }}>{username}</strong>
                </p>
                {countdown > 0 && (
                  <p style={{ 
                    textAlign: "center", 
                    color: "#4CAF50", 
                    marginBottom: "15px",
                    fontSize: "13px"
                  }}>
                    ⏱️ Mã có hiệu lực: {formatTime(countdown)}
                  </p>
                )}
                <div className="input-group">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="Nhập mã OTP (6 số)"
                    maxLength="6"
                    style={{ textAlign: "center", fontSize: "20px", letterSpacing: "8px", fontWeight: "bold" }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "Đang xác thực..." : "Xác thực OTP"}
                </button>
                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4CAF50",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Không nhận được mã? Gửi lại
                  </button>
                </div>
              </form>
            )}

            {/* Bước 3: Nhập mật khẩu mới */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <p style={{ textAlign: "center", color: "#ccc", marginBottom: "20px", fontSize: "14px" }}>
                  Nhập mật khẩu mới cho tài khoản của bạn
                </p>
                <div className="input-group">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                    minLength="6"
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </div>
                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                </button>
              </form>
            )}

            <div className="register-link" style={{ marginTop: "20px" }}>
              <p>
                Đã nhớ mật khẩu?{" "}
                <a href="/login">Đăng nhập</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
