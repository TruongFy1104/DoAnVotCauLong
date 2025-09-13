const express = require("express");
const { getAllAccounts, getProfileAdmin, updateProfileAdmin, changePassword,changeGroupAccount,deleteAccount } = require("../app/controller/AccountController");
const { getAllProducts, addProduct, deleteProduct, updateProduct,getProductById } = require("../app/controller/ProductController");
const { getAllBrands, addBrand, deleteBrand, editBrand } = require("../app/controller/BrandController");
const {getAllOrder,deleteOrder,getOrderById,changeStatusOrder} = require("../app/controller/OrderController")
const {getRevenue} = require("../app/controller/RevenueController");
const {getAllBranches,addBranch,deleteBranch,editBranch } = require("../app/controller/BranchesController");
const {getAllSlotTimes,createSlotTime,deleteSlotTime,editSlotTime} = require("../app/controller/SlotTimeController");
const {getAllCategories,addCategory,deleteCategory,editCategory } = require('../app/controller/CategoryController');
const {getAllCourts,createCourt,deleteCourt,editCourt} = require("../app/controller/CourtController");
const {approveBooking,cancelBooking,getAllBookings,deleteBooking} = require("../app/controller/BookingController");

const authorize = require("../Common/Authorize");
const router = express.Router();

// Thông tin
router.get("/accountmanagement", authorize(["Quản trị"]), getAllAccounts);
router.get("/profile", authorize(["Quản trị"]), getProfileAdmin);
router.put("/updateprofile", authorize(["Quản trị"]), updateProfileAdmin);
router.put("/profile/changepassword", authorize(["Quản trị"]), changePassword);
router.put("/accountmanagement/changegroupaccount/:id", authorize(["Quản trị"]), changeGroupAccount);
router.delete("/accountmanagement/:id", authorize(["Quản trị"]), deleteAccount);

// Sản phẩm
router.get("/products",authorize(["Quản trị"]),getAllProducts);
router.post("/addproduct",authorize(["Quản trị"]), addProduct);
router.get("/productById/:id",authorize(["Quản trị"]), getProductById);
router.put("/addproduct/:id", authorize(["Quản trị"]), updateProduct);
router.delete("/products/:id", authorize(["Quản trị"]), deleteProduct);

// Thương hiệu
router.get("/brands", getAllBrands);
router.post("/brands", authorize(["Quản trị"]), addBrand);
router.delete("/brands/:id", authorize(["Quản trị"]), deleteBrand);
router.put("/editbrand/:id", authorize(["Quản trị"]), editBrand);

// Đơn hàng
router.get("/orders", authorize(["Quản trị", "Nhân viên"]), getAllOrder);
router.put("/orders/changestatus/:id", authorize(["Quản trị", "Nhân viên"]), changeStatusOrder);
router.get("/orders/:id", authorize(["Quản trị", "Nhân viên"]), getOrderById);
router.delete("/orders/delete/:id", authorize(["Quản trị", "Nhân viên"]), deleteOrder);

// Doanh thu
router.get("/revenue", getRevenue);

// Danh mục (category)
router.get("/categories", getAllCategories);
router.post("/categories", authorize(["Quản trị"]), addCategory);
router.delete("/categories/:id", authorize(["Quản trị"]), deleteCategory);
router.put("/editcategory/:id", authorize(["Quản trị"]), editCategory);

//Chi nhánh (branches)
router.get("/branches", getAllBranches);
router.post("/branches", authorize(["Quản trị"]), addBranch);
router.delete("/branches/:id", authorize(["Quản trị"]), deleteBranch);
router.put("/editbranch/:id", authorize(["Quản trị"]), editBranch);
//TimeSLot
router.get("/slot-times", getAllSlotTimes);
router.post("/slot-times", authorize(["Quản trị"]), createSlotTime);
router.delete("/slot-times/:id", authorize(["Quản trị"]), deleteSlotTime);
router.put("/edit-slot-times/:id",  editSlotTime);
//Court
router.get("/courts", getAllCourts);
router.post("/courts", authorize(["Quản trị"]), createCourt);
router.delete("/courts/:id", authorize(["Quản trị"]), deleteCourt);
router.put("/edit-courts/:id", editCourt);
//Booking
router.get("/all-bookings", authorize(["Quản trị", "Nhân viên"]), getAllBookings);
router.put("/approve-booking/:id", authorize(["Quản trị", "Nhân viên"]), approveBooking);
router.put("/cancel-booking/:id", authorize(["Quản trị", "Nhân viên"]), cancelBooking);
router.delete("/delete-booking/:id", authorize(["Quản trị", "Nhân viên"]), deleteBooking);

// Route thay đổi
module.exports = router;
