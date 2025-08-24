import React, { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const RevenuePage = () => {
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [yearlyOrders, setYearlyOrders] = useState(0);
  const [revenueMonthly, setRevenueMonthly] = useState(0);
  const [revenueYear, setRevenueYear] = useState(0);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const response = await fetch("http://localhost:3000/privatesite/revenue");
      const data = await response.json();
      setMonthlyOrders(data.CountOrdersMonthly);
      setYearlyOrders(data.CountOrdersYear);
      setRevenueMonthly(data.RevenueMonthly);
      setRevenueYear(data.RevenueYear);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    }
  };

  // Chart data
  const barData = {
    labels: ["Tháng này", "Năm nay"],
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: [revenueMonthly, revenueYear],
        backgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  const doughnutData = {
    labels: ["Đơn hàng tháng", "Đơn hàng năm"],
    datasets: [
      {
        label: "Số đơn hàng",
        data: [monthlyOrders, yearlyOrders],
        backgroundColor: ["#FFCE56", "#4BC0C0"],
      },
    ],
  };

  return (
    <div className="content-wrapper">
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6" style={{ marginTop: "40px" }}>
              <h4>Thống kê doanh thu</h4>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <Bar data={barData} />
              </div>
              <div style={{ maxWidth: 400, margin: "40px auto" }}>
                <Doughnut data={doughnutData} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RevenuePage;
