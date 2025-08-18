import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "../Component/Header/Header";
import Footer from "../Component/Footer/Footer";
import HomePage from "../Pages/HomePage";
import AllProduct from "../Pages/AllProducts";
import UserProfile from "../Pages/UserProfile";
import ProductDetail from "../Pages/ProductDetail";
import AboutUs from "../Pages/User/AboutUs";
import Cart from "../Pages/Cart";
import Checkout from "../Pages/Checkout";
import OrderDetails from "../Pages/OrderDetail";
import BookingView from "../Pages/BookingView";
import BookingCheckout from "../Pages/BookingCheckout";
const UserLayout = () => {
  return (
    <div>
      <Header />
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomePage  />} />
          <Route path="/booking" element={<BookingView  />} />
          <Route path="/bookingcheckout" element={<BookingCheckout  />} />
          <Route path="/products/productdetails/:id" element={<ProductDetail />} />
          <Route path="/allproducts" element={<AllProduct />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/cart" element={<Cart />} /> 
          <Route path="/checkout" element={<Checkout />} /> 
          <Route path="/UserProfile" element={<UserProfile/>}></Route>
          <Route path="/order/:orderId" element={<OrderDetails />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default UserLayout;