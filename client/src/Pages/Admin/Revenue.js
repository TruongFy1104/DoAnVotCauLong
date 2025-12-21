import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const RevenuePage = () => {
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [yearlyOrders, setYearlyOrders] = useState(0);
  const [revenueMonthly, setRevenueMonthly] = useState(0);
  const [revenueYear, setRevenueYear] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [bookingStatsMonthly, setBookingStatsMonthly] = useState(null);
  const [bookingStatsYear, setBookingStatsYear] = useState(null);
  const [monthlyBookingData, setMonthlyBookingData] = useState([]);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const response = await fetch("http://localhost:3000/privatesite/revenue");
      const data = await response.json();
      console.log("Revenue data received:", data);
      console.log("Monthly data:", data.MonthlyData);
      setMonthlyOrders(data.CountOrdersMonthly || 0);
      setYearlyOrders(data.CountOrdersYear || 0);
      setRevenueMonthly(data.RevenueMonthly || 0);
      setRevenueYear(data.RevenueYear || 0);
      setMonthlyData(data.MonthlyData || []);
      setBookingStatsMonthly(data.BookingStatsMonthly || null);
      setBookingStatsYear(data.BookingStatsYear || null);
      setMonthlyBookingData(data.MonthlyBookingData || []);
    } catch (error) {
      setMonthlyOrders(0);
      setYearlyOrders(0);
      setRevenueMonthly(0);
      setRevenueYear(0);
      setMonthlyData([]);
      setBookingStatsMonthly(null);
      setBookingStatsYear(null);
      setMonthlyBookingData([]);
      console.error("Error fetching revenue data:", error);
    }
  };

  // Chart data
  const monthlyRevenueData = {
    labels: monthlyData.map(item => `Tháng ${item.month}`),
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: monthlyData.map(item => item.revenue),
        backgroundColor: "#36A2EB",
        borderColor: "#2563eb",
        borderWidth: 1,
      },
    ],
  };

  const monthlyOrdersData = {
    labels: monthlyData.map(item => `Tháng ${item.month}`),
    datasets: [
      {
        label: "Số đơn hàng",
        data: monthlyData.map(item => item.orders),
        backgroundColor: "#4BC0C0",
        borderColor: "#2d9f9f",
        borderWidth: 1,
      },
    ],
  };

  const monthlyBookingsData = {
    labels: monthlyBookingData.map(item => `Tháng ${item.month}`),
    datasets: [
      {
        label: "Doanh thu đặt sân (VNĐ)",
        data: monthlyBookingData.map(item => item.revenue),
        backgroundColor: "#FF6384",
        borderColor: "#dc2626",
        borderWidth: 1,
      },
    ],
  };

  const monthlyBookingCountData = {
    labels: monthlyBookingData.map(item => `Tháng ${item.month}`),
    datasets: [
      {
        label: "Hoàn thành",
        data: monthlyBookingData.map(item => item.completed),
        backgroundColor: "#4ade80",
        borderColor: "#16a34a",
        borderWidth: 1,
      },
      {
        label: "Hủy",
        data: monthlyBookingData.map(item => item.cancelled),
        backgroundColor: "#f87171",
        borderColor: "#dc2626",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div
      className="content-wrapper"
      style={{
        minHeight: "100vh",
        padding: "32px 0",
      }}
    >
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12 text-center">
              <h2 style={{ fontWeight: 700, color: "#2563eb", letterSpacing: 1 }}>
                THỐNG KÊ DOANH THU
              </h2>
              <p style={{ color: "#333", fontSize: 18 }}>
                Số liệu tổng hợp đơn hàng và doanh thu hệ thống
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          {/* Thống kê tháng này - Chi tiết */}
          <div className="row mb-3">
            <div className="col-12">
              <h4 style={{ fontWeight: 600, color: "#1e293b" }}>Thống kê tháng này</h4>
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #3b82f6" }}>
                <div className="card-body" style={{ textAlign: "center" }}>
                  <h6 className="text-muted mb-2">Đơn hàng</h6>
                  <h3 className="mb-1" style={{ color: "#3b82f6" }}>
                    {(revenueMonthly ?? 0).toLocaleString()} đ
                  </h3>
                  <p className="mb-0 text-muted small">{monthlyOrders} đơn hàng</p>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #f59e0b" }}>
                <div className="card-body" style={{ textAlign: "center" }}>
                  <h6 className="text-muted mb-2">Đặt sân</h6>
                  <h3 className="mb-1" style={{ color: "#f59e0b" }}>
                    {bookingStatsMonthly ? (bookingStatsMonthly.revenue || 0).toLocaleString() : 0} đ
                  </h3>
                  <p className="mb-0 text-muted small">
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>
                      {bookingStatsMonthly ? bookingStatsMonthly.completed : 0}
                    </span> hoàn thành | <span style={{ color: "#dc2626", fontWeight: 600 }}>
                      {bookingStatsMonthly ? bookingStatsMonthly.cancelled : 0}
                    </span> hủy
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #8b5cf6" }}>
                <div className="card-body" style={{ textAlign: "center" }}>
                  <h6 className="text-muted mb-2">Tổng doanh thu</h6>
                  <h3 className="mb-1" style={{ color: "#8b5cf6" }}>
                    {((revenueMonthly ?? 0) + (bookingStatsMonthly ? (bookingStatsMonthly.revenue || 0) : 0)).toLocaleString()} đ
                  </h3>
                  <p className="mb-0 text-muted small">Đơn hàng + Đặt sân</p>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #10b981" }}>
                <div className="card-body" style={{ textAlign: "center" }}>
                  <h6 className="text-muted mb-2">Tổng đơn</h6>
                  <h3 className="mb-1" style={{ color: "#10b981" }}>
                    {monthlyOrders + (bookingStatsMonthly ? bookingStatsMonthly.total : 0)}
                  </h3>
                  <p className="mb-0 text-muted small">
                    {monthlyOrders} đơn hàng + {bookingStatsMonthly ? bookingStatsMonthly.total : 0} đặt sân
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê tổng quan năm */}
          <div className="row mb-3 mt-5">
            <div className="col-12">
              <h4 style={{ fontWeight: 600, color: "#1e293b" }}>Tổng quan năm nay</h4>
            </div>
          </div>
          <div className="row mb-4 justify-content-center">
            <div className="col-md-3 mb-3">
              <div
                className="card shadow"
                style={{
                  background: "#e3f0fa",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "32px 16px",
                }}
              >
                <h5 style={{ color: "#2563eb", fontWeight: 600 }}>Đơn hàng</h5>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#2563eb" }}>
                  {(revenueYear ?? 0).toLocaleString()} đ
                </div>
                <div style={{ fontSize: 18, color: "#333", marginTop: 8 }}>
                  <span style={{ color: "#4BC0C0", fontWeight: 600 }}>
                    {yearlyOrders}
                  </span>{" "}
                  đơn hàng
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div
                className="card shadow"
                style={{
                  background: "#fef3c7",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "32px 16px",
                }}
              >
                <h5 style={{ color: "#d97706", fontWeight: 600 }}>Đặt sân</h5>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#d97706" }}>
                  {bookingStatsYear ? (bookingStatsYear.revenue || 0).toLocaleString() : 0} đ
                </div>
                <div style={{ fontSize: 18, color: "#333", marginTop: 8 }}>
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    {bookingStatsYear ? bookingStatsYear.completed : 0}
                  </span>{" "}
                  hoàn thành | <span style={{ color: "#dc2626", fontWeight: 600 }}>
                    {bookingStatsYear ? bookingStatsYear.cancelled : 0}
                  </span>{" "}
                  hủy
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div
                className="card shadow"
                style={{
                  background: "#f3e8ff",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "32px 16px",
                }}
              >
                <h5 style={{ color: "#8b5cf6", fontWeight: 600 }}>Tổng doanh thu</h5>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#8b5cf6" }}>
                  {((revenueYear ?? 0) + (bookingStatsYear ? (bookingStatsYear.revenue || 0) : 0)).toLocaleString()} đ
                </div>
                <div style={{ fontSize: 18, color: "#333", marginTop: 8 }}>
                  Đơn hàng + Đặt sân
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div
                className="card shadow"
                style={{
                  background: "#dcfce7",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "32px 16px",
                }}
              >
                <h5 style={{ color: "#16a34a", fontWeight: 600 }}>Tổng đơn</h5>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#16a34a" }}>
                  {yearlyOrders + (bookingStatsYear ? bookingStatsYear.total : 0)}
                </div>
                <div style={{ fontSize: 18, color: "#333", marginTop: 8 }}>
                  {yearlyOrders} đơn hàng + {bookingStatsYear ? bookingStatsYear.total : 0} đặt sân
                </div>
              </div>
            </div>
          </div>
          
          {/* Thống kê đặt sân chi tiết */}
          <div className="row mb-3 mt-5">
            <div className="col-12">
              <h4 style={{ fontWeight: 600, color: "#1e293b" }}>CHI TIẾT ĐẶT SÂN</h4>
            </div>
          </div>
          <div className="row mb-4 justify-content-center">
            <div className="col-md-5 mb-3">
              <div
                className="card shadow"
                style={{
                  background: "#fef3c7",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "32px 16px",
                }}
              >
                <h4 style={{ color: "#d97706", fontWeight: 600 }}>Tháng này</h4>
                <div style={{ fontSize: 38, fontWeight: 700, color: "#d97706" }}>
                  {bookingStatsMonthly ? (bookingStatsMonthly.revenue || 0).toLocaleString() : 0} đ
                </div>
                <div style={{ fontSize: 18, color: "#333", marginTop: 12 }}>
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    {bookingStatsMonthly ? bookingStatsMonthly.completed : 0}
                  </span>{" "}
                  hoàn thành
                  {" | "}
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>
                    {bookingStatsMonthly ? bookingStatsMonthly.cancelled : 0}
                  </span>{" "}
                  hủy
                </div>
                <div style={{ fontSize: 16, color: "#666", marginTop: 8 }}>
                  Tổng: {bookingStatsMonthly ? bookingStatsMonthly.total : 0} đơn
                </div>
              </div>
            </div>
            <div className="col-md-5 mb-3">
              <div
                className="card shadow"
                style={{
                  background: "#dbeafe",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "32px 16px",
                }}
              >
                <h4 style={{ color: "#2563eb", fontWeight: 600 }}>Năm nay</h4>
                <div style={{ fontSize: 38, fontWeight: 700, color: "#2563eb" }}>
                  {bookingStatsYear ? (bookingStatsYear.revenue || 0).toLocaleString() : 0} đ
                </div>
                <div style={{ fontSize: 18, color: "#333", marginTop: 12 }}>
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    {bookingStatsYear ? bookingStatsYear.completed : 0}
                  </span>{" "}
                  hoàn thành
                  {" | "}
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>
                    {bookingStatsYear ? bookingStatsYear.cancelled : 0}
                  </span>{" "}
                  hủy
                </div>
                <div style={{ fontSize: 16, color: "#666", marginTop: 8 }}>
                  Tổng: {bookingStatsYear ? bookingStatsYear.total : 0} đơn
                </div>
              </div>
            </div>
          </div>
          
          <div className="row mb-4 justify-content-center">
            <div className="col-md-6 mb-4">
              <div className="card shadow" style={{ borderRadius: 16 }}>
                <div className="card-body">
                  <h5 className="card-title fw-600 mb-4 text-center">
                    Doanh thu theo tháng
                  </h5>
                  {monthlyData.length > 0 ? (
                    <Bar data={monthlyRevenueData} options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return value.toLocaleString() + ' đ';
                            }
                          }
                        }
                      }
                    }} />
                  ) : (
                    <p className="text-center text-muted">Đang tải dữ liệu...</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-6 mb-4">
              <div className="card shadow" style={{ borderRadius: 16 }}>
                <div className="card-body">
                  <h5 className="card-title fw-600 mb-4 text-center">
                    Đơn hàng theo tháng
                  </h5>
                  {monthlyData.length > 0 ? (
                    <Bar data={monthlyOrdersData} options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }} />
                  ) : (
                    <p className="text-center text-muted">Đang tải dữ liệu...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Biểu đồ thống kê booking */}
          <div className="row mb-4 justify-content-center">
            <div className="col-md-6 mb-4">
              <div className="card shadow" style={{ borderRadius: 16 }}>
                <div className="card-body">
                  <h5 className="card-title fw-600 mb-4 text-center">
                    Doanh thu đặt sân theo tháng
                  </h5>
                  {monthlyBookingData.length > 0 ? (
                    <Bar data={monthlyBookingsData} options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return value.toLocaleString() + ' đ';
                            }
                          }
                        }
                      }
                    }} />
                  ) : (
                    <p className="text-center text-muted">Đang tải dữ liệu...</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-6 mb-4">
              <div className="card shadow" style={{ borderRadius: 16 }}>
                <div className="card-body">
                  <h5 className="card-title fw-600 mb-4 text-center">
                    Thống kê đơn đặt sân theo tháng
                  </h5>
                  {monthlyBookingData.length > 0 ? (
                    <Bar data={monthlyBookingCountData} options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }} />
                  ) : (
                    <p className="text-center text-muted">Đang tải dữ liệu...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RevenuePage;