import React from "react";

import HeaderAdmin from "../../Component/AdminComponent/HeaderAdmin";
import SidebarAdmin from "../../Component/AdminComponent/SidebarAdmin";
import AddProductForm from "./AddItem";
import "bootstrap/dist/css/bootstrap.min.css"
import "../Admin/admincss/Style.css"
const AddProducts = () => (
  

    <div
    className="page-wrapper"
    id="main-wrapper"
    data-layout="vertical"
    data-navbarbg="skin6"
    data-sidebartype="full"
    data-sidebar-position="fixed"
    data-header-position="fixed"
  >
    <SidebarAdmin/>
    <div className="body-wrapper">
        <HeaderAdmin/>
    </div>
        <div className="body-wrapper">
        <div className="container-fluid">
    {/*  Row 1 */}
    <div className="row"></div>
    <AddProductForm/>
  </div>
    </div>
  </div>
  
      
  
);
export default AddProducts;
