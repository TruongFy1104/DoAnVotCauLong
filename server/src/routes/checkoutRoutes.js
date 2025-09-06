const express = require("express");
const {
  checkout,
  getCustomerData,
  createMoMoPaymentUrl,
  createVNPayPaymentUrl,
  vnpayReturnHandler,
  vnpayIpnHandler,
  createVNPayPaymentUrlMobile,
  updatePaymentStatus,
} = require("../app/controller/CheckoutController");
const router = express.Router();

router.post("/", checkout);
router.get("/getcustomer", getCustomerData);
router.post("/create-momo-payment-url", createMoMoPaymentUrl);
router.post("/create-vnpay-payment-url", createVNPayPaymentUrl);
router.get("/vnpay_return", vnpayReturnHandler);
router.post("/vnpay_ipn", vnpayIpnHandler);

// API cho mobile
router.post("/mobile/create-vnpay-payment-url", createVNPayPaymentUrlMobile);
router.put("/mobile/update-payment-status/:orderId", updatePaymentStatus);

module.exports = router;
