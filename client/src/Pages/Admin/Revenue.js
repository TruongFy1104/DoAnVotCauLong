import React, { useState, useEffect } from "react";

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
      console.log(data)
      setMonthlyOrders(data.CountOrdersMonthly);
      setYearlyOrders(data.CountOrdersYear);
      setRevenueMonthly(data.RevenueMonthly);
      setRevenueYear(data.RevenueYear);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    }
  };
  return (
    <div className="content-wrapper">
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6" style={{ marginTop: "90px" }}>
              <h4>Doanh thu tháng {new Date().getMonth() + 1}</h4>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <div className="form-group row mb-3">
                <label className="col-sm-2 col-form-label">Số đơn hàng đã hoàn thành</label>
                <div className="col-sm-10">
                  <input
                    type="text"
                    className="form-control"
                    value={monthlyOrders}
                    disabled
                  />
                </div>
              </div>
              <div className="form-group row mb-3">
                <label className="col-sm-2 col-form-label">Tổng thu nhập</label>
                <div className="col-sm-10">
                  <input
                    type="text"
                    className="form-control"
                    value={revenueMonthly}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Yearly Revenue Section */}
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6" style={{ marginTop: "40px" }}>
              <h4>Tổng doanh thu năm {new Date().getFullYear()}</h4>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <div className="form-group row mb-3">
                <label className="col-sm-2 col-form-label">Số đơn hàng đã hoàn thành</label>
                <div className="col-sm-10">
                  <input
                    type="text"
                    className="form-control"
                    value={yearlyOrders}
                    disabled
                  />
                </div>
              </div>
              <div className="form-group row mb-3">
                <label className="col-sm-2 col-form-label">Tổng doanh thu</label>
                <div className="col-sm-10">
                  <input
                    type="text"
                    className="form-control"
                    value={revenueYear}
                    disabled
                  />
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
