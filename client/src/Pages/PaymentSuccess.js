import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PaymentSuccess = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderIdParam = params.get("orderId");
    setOrderId(orderIdParam);
  }, [location]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1 style={{ color: "green" }}>✅ Thanh toán thành công!</h1>
      {orderId && (
        <p>
          Mã đơn hàng: <strong>{orderId}</strong>
        </p>
      )}
      <p>Cảm ơn bạn đã mua hàng tại BadmintonShop.</p>
      <p>Đơn hàng của bạn đang được xử lý.</p>
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        Về trang chủ
      </button>
    </div>
  );
};

export default PaymentSuccess;
