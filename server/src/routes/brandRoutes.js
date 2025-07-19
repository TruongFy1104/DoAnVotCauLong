const express = require("express");
const { getAllBrands, addBrand, deleteBrand, editBrand } = require("../app/controller/BrandController");
const authorize = require("../Common/Authorize");

const router = express.Router();

router.get("/", getAllBrands);

module.exports = router;
