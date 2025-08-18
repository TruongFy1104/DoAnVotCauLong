const express = require("express");
const { checkout, getCustomerData } = require("../app/controller/CheckoutController");
const router = express.Router();

router.post("/", checkout);
router.get("/getcustomer", getCustomerData);

module.exports = router;
