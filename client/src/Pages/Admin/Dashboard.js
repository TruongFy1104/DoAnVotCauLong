import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    today: { revenue: 0, cost: 0, profit: 0, orders: 0 },
    monthly: { revenue: 0, cost: 0, profit: 0, orders: 0 },
    topProducts: [],
    recentOrders: [],
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    last7Days: [],
    bookingToday: { total: 0, completed: 0, cancelled: 0, revenue: 0 },
    bookingMonthly: { total: 0, completed: 0, cancelled: 0, revenue: 0 }
  });

  useEffect(() => {
    // Kiểm tra token và quyền
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = '/Login';
      return;
    }

    const { decodeJWT } = require("../../Pages/Common");
    const decodedToken = decodeJWT(token);
    if (decodedToken.idgroup !== 1) {
      window.location.href = '/privatesite/dashboard-staff';
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://localhost:3000/privatesite/dashboard");
      const data = await response.json();
      console.log("Dashboard data:", data);
  
      setStats({
        today: data.today || { revenue: 0, cost: 0, profit: 0, orders: 0 },
        monthly: data.monthly || { revenue: 0, cost: 0, profit: 0, orders: 0 },
        topProducts: data.topProducts || [],
        recentOrders: data.recentOrders || [],
        totalCustomers: data.totalCustomers || 0,
        totalProducts: data.totalProducts || 0,
        totalOrders: data.totalOrders || 0,
        last7Days: data.last7Days || [],
        bookingToday: data.bookingToday || { total: 0, completed: 0, cancelled: 0, revenue: 0 },
        bookingMonthly: data.bookingMonthly || { total: 0, completed: 0, cancelled: 0, revenue: 0 }
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Chart data cho doanh thu 7 ngày
  const last7DaysChartData = {
    labels: (stats.last7Days || []).map(item => item.date),
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: (stats.last7Days || []).map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Chi phí (VNĐ)',
        data: (stats.last7Days || []).map(item => item.cost || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Lợi nhuận (VNĐ)',
        data: (stats.last7Days || []).map(item => item.profit || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
  };

  return (
    <div style={{ minHeight: "calc(100vh - 70px)", padding: "24px", backgroundColor: "#f5f5f5" }}>
      <div className="container-fluid">
        <h2 className="mb-4" style={{ fontWeight: 600 }}>Dashboard - Tổng quan hệ thống</h2>
        
        {/* Thống kê hôm nay */}
        <div className="row mb-3">
          <div className="col-12">
            <h5 style={{ fontWeight: 600, color: "#1e293b" }}>Thống kê hôm nay</h5>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #3b82f6" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Đơn hàng</h6>
                <h3 className="mb-1" style={{ color: "#3b82f6" }}>
                  {stats.today.revenue.toLocaleString()} đ
                </h3>
                <p className="mb-0 text-muted small">{stats.today.orders} đơn hàng</p>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #f59e0b" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Đặt sân</h6>
                <h3 className="mb-1" style={{ color: "#f59e0b" }}>
                  {stats.bookingToday.revenue.toLocaleString()} đ
                </h3>
                <p className="mb-0 text-muted small">
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>{stats.bookingToday.completed}</span> hoàn thành | <span style={{ color: "#dc2626", fontWeight: 600 }}>{stats.bookingToday.cancelled}</span> hủy
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #8b5cf6" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Tổng doanh thu</h6>
                <h3 className="mb-1" style={{ color: "#8b5cf6" }}>
                  {(stats.today.revenue + stats.bookingToday.revenue).toLocaleString()} đ
                </h3>
                <p className="mb-0 text-muted small">Đơn hàng + Đặt sân</p>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #10b981" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Lợi nhuận</h6>
                <h3 className="mb-1" style={{ color: "#10b981" }}>
                  {stats.today.profit.toLocaleString()} đ
                </h3>
                <p className="mb-0 text-muted small">Doanh thu - Chi phí</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê tổng quát */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #3b82f6" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Doanh thu tháng</h6>
                <h3 className="mb-1" style={{ color: "#3b82f6" }}>
                  {stats.monthly.revenue.toLocaleString()} đ
                </h3>
                <p className="mb-0 text-muted small">Tổng tiền thực thu</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #ef4444" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Chi phí tháng</h6>
                <h3 className="mb-1" style={{ color: "#ef4444" }}>
                  {stats.monthly.cost.toLocaleString()} đ
                </h3>
                <p className="mb-0 text-muted small">Tổng giá nhập</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow" style={{ borderRadius: 12, borderLeft: "4px solid #f59e0b" }}>
              <div className="card-body">
                <h6 className="text-muted mb-2">Tổng đơn hàng</h6>
                <h3 className="mb-1" style={{ color: "#f59e0b" }}>
                  {stats.totalOrders}
                </h3>
                <p className="mb-0 text-muted small">Tất cả thời gian</p>
              </div>
            </div>
          </div>
        </div>

        {/* Biểu đồ doanh thu 7 ngày */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card shadow" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <h5 className="card-title mb-4">Doanh thu - Chi phí - Lợi nhuận 7 ngày gần nhất</h5>
                {(stats.last7Days || []).length > 0 ? (
                  <div style={{ height: '300px' }}>
                    <Bar data={last7DaysChartData} options={chartOptions} />
                  </div>
                ) : (
                  <p className="text-center text-muted">Đang tải dữ liệu...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sản phẩm bán chạy và Đơn hàng gần nhất */}
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card shadow" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <h5 className="card-title mb-4">Sản phẩm bán chạy nhất</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th className="text-end">Đã bán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.topProducts || []).length > 0 ? (
                        (stats.topProducts || []).map((product, index) => (
                          <tr key={index}>
                            <td>{product.productName}</td>
                            <td>{Number(product.price).toLocaleString()} đ</td>
                            <td className="text-end">
                              <span className="badge bg-success">{product.totalSold}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">Chưa có dữ liệu</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card shadow" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <h5 className="card-title mb-4">Đơn hàng gần nhất</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.recentOrders || []).length > 0 ? (
                        (stats.recentOrders || []).map((order, index) => (
                          <tr key={index}>
                            <td>#{order.orderId}</td>
                            <td>{order.customerName}</td>
                            <td>{Number(order.totalPrice).toLocaleString()} đ</td>
                            <td>
                              <span className={`badge ${
                                order.status === 'Thành công' ? 'bg-success' :
                                order.status === 'Đang giao' ? 'bg-info' :
                                order.status === 'Đã hủy' ? 'bg-danger' :
                                'bg-warning'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">Chưa có đơn hàng</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;