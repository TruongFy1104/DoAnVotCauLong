const express = require("express");
const { 
  getAllProducts, 
  getProductDetails, 
  getProductSpecifications, 
  searchProducts, 
  getImagesByProductId
} = require("../app/controller/ProductController");
const router = express.Router();

router.get("/", getAllProducts);
router.get("/productdetails/:id", getProductDetails);
router.get("/search", searchProducts);
router.get("/:productId/specifications", getProductSpecifications);
router.get('/:productId/images', getImagesByProductId);

module.exports = router;
