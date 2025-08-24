import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PaymentFailed = () => {
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    setError(errorParam);
  }, [location]);

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "24":
        return "Giao dịch bị hủy bởi người dùng";
      case "51":
        return "Tài khoản không đủ số dư";
      case "65":
        return "Tài khoản đã vượt quá hạn mức giao dịch trong ngày";
      case "75":
        return "Ngân hàng thanh toán đang bảo trì";
      case "79":
        return "Khách hàng nhập sai mật khẩu quá số lần quy định";
      default:
        return "Có lỗi xảy ra trong quá trình thanh toán";
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1 style={{ color: "red" }}>❌ Thanh toán thất bại!</h1>
      {error && (
        <p>
          Mã lỗi: <strong>{error}</strong>
        </p>
      )}
      <p style={{ color: "#666" }}>
        {error
          ? getErrorMessage(error)
          : "Có lỗi xảy ra trong quá trình thanh toán."}
      </p>
      <p>Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => (window.location.href = "/checkout")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            marginRight: "10px",
          }}
        >
          Thử lại
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default PaymentFailed;
