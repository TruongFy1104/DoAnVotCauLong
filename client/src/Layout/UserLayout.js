import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "../Component/Header/Header";
import Footer from "../Component/Footer/Footer";
import HomePage from "../Pages/HomePage";
import {SlidebarFeatures,SlidebarGallery} from "../Component/Slidebar/Slidebar";  
import Slidebar from "../Component/Slidebar/Slidebar";
import UserProfile from "../Pages/UserProfile";
import ProductDetail from "../Pages/ProductDetail";
import Cart from "../Pages/Cart";
import Checkout from "../Pages/Checkout";


const UserLayout = () => {
  return (
    <div>
      <Header />
      {/* <Slidebar />
      <SlidebarFeatures />
      <SlidebarGallery /> */}
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomePage  />} />
          <Route path="/products/productdetails/:id" element={<ProductDetail />} />
          {/* <Route path="/AllItem" element={<AllProducts />} /> */}
          {/* <Route path="/AboutUs" element={<AboutUs />} /> */}
          <Route path="/cart" element={<Cart />} /> 
          <Route path="/checkout" element={<Checkout />} /> 
          <Route path="/UserProfile" element={<UserProfile/>}></Route>
          {/* <Route path="/order/:orderId" element={<OrderDetails />} /> */}
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default UserLayout;