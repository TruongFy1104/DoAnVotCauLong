import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLayout from "./Layout/UserLayout";
import Login from "./Pages/Login/Login";
import Register from "./Pages/Login/Register";
import AdminLayout from "./Layout/AdminLayout";
function App() {
  return (
     <BrowserRouter>
    <Routes>
      {/* Login */}
       <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* User Layout */}
      <Route path="/*" element={<UserLayout />} />
      {/* Admin Layout */}
      <Route path="/privatesite/*" element={<AdminLayout />} />
    </Routes>
  </BrowserRouter>
  );
}

export default App;
