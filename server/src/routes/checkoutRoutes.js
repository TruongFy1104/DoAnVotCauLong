const express = require("express");
const { checkout, getCustomerData,createMoMoPaymentUrl,createVNPayPaymentUrl } = require("../app/controller/CheckoutController");
const router = express.Router();

router.post("/", checkout);
router.get("/getcustomer", getCustomerData);
router.post("/create-momo-payment-url", createMoMoPaymentUrl);
router.post("/create-vnpay-payment-url", createVNPayPaymentUrl);

module.exports = router;
