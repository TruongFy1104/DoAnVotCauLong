import React, { useState } from "react";
import { Link,useNavigate  } from "react-router-dom";
import axios from "axios";
import "./Login.css"
const Login =()=>{
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = '/home'
    }
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState('');
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Hook dùng để chuyển hướng
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        // req
        const response = await axios.post(
          "http://localhost:3000/auth/login",
          
          { username, password },
          { withCredentials: true }
        );
        localStorage.setItem('token', response.data.token); //  JWT token
        setMessage('Đăng nhập thành công');
        const userRole = response.data.user.idgroup;
        if (response.data.message === "Đăng nhập thành công") {
          alert("Đăng nhập thành công!");
          if (userRole === 1) {
            window.location.href = '/privatesite/dashboard'
            // navigate("/privatesite/dashboard"); 
          } else if (userRole === 2) {
            navigate("/home");
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Đăng nhập thất bại");
      }
    };
    return(
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
            <button type="submit" className="login-btn">
              Đăng nhập
            </button>
          </form>
          <div className="register-link">
            <p>
              Bạn chưa có tài khoản? Hãy nhấn vào{" "}
              <a href="/register" >Register</a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
    )
}
export default Login;