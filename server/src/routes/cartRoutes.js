const express = require("express");
const { addToCart, getCart, updateQuantity, removeFromCart } = require("../app/controller/CartController");

const router = express.Router();

router.get("/", getCart);
router.post("/add", addToCart);
router.post("/update", updateQuantity);
router.post("/remove", removeFromCart);

module.exports = router;


