import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AccountManagement = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/login'
    throw new Error("Token không tồn tại. Hãy đăng nhập lại.");
  }
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("http://localhost:3000/privatesite/accountmanagement",{
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Thêm header Authorization
          },
        });
        const data = await response.json();
        setAccounts(data); 
      } catch (error) {
        console.error("Error", error);
      }
    };

    fetchAccounts();
  }, []); 

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-lg-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-600 mb-4">Danh sách tài khoản</h5>
              <div className="table-responsive">
                <table className="table text-nowrap mb-0 align-middle">
                  <thead className="text-dark fs-4">
                    <tr>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Id</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Username</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Email</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Nhóm tài khoản</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Mã khách hàng</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Lệnh</h6>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(accounts) && accounts.map((acc) => (
                    <tr key={acc.AccountId}>
                      <td className="border-bottom-0 text-center">
                        <h6 className="fw-600 mb-0">{acc.AccountId}</h6>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <h6 className="fw-600 mb-1">{acc.Username}</h6>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <p className="mb-0 fw-normal">{acc.Email}</p>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <p className="mb-0 fw-normal">{acc.IdGroup == 1 ? 'Quản trị' : 'Người dùng'}</p>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <p className="mb-0 fw-normal">{acc.CustomerId}</p>
                      </td>
                      <td className="border-bottom-0">
                      <div className="d-flex gap-3 justify-content-center">
                        <Link  to={`/privatesite/accountmanagement/${acc.AccountId}`}
                          state={{ account: acc }} className="btn btn-primary btn-sm">
                          Chi tiết
                        </Link>
                        <button className="btn btn-danger btn-sm" >Xóa</button>
                      </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
