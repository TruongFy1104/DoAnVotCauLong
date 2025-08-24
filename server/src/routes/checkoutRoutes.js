const express = require("express");
const {
  checkout,
  getCustomerData,
  createMoMoPaymentUrl,
  createVNPayPaymentUrl,
  vnpayReturnHandler,
  vnpayIpnHandler,
} = require("../app/controller/CheckoutController");
const router = express.Router();

router.post("/", checkout);
router.get("/getcustomer", getCustomerData);
router.post("/create-momo-payment-url", createMoMoPaymentUrl);
router.post("/create-vnpay-payment-url", createVNPayPaymentUrl);
router.get("/vnpay_return", vnpayReturnHandler);
router.post("/vnpay_ipn", vnpayIpnHandler);
module.exports = router;
