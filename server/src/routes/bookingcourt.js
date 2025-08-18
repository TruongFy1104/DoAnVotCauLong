const express = require("express");
const { getAllBranches,getCourtsByBranch,getAllTimeSlots } = require("../app/controller/BookingController");
const router = express.Router();

router.get("/branches", getAllBranches);
router.get("/courts", getCourtsByBranch);
router.get("/timeslots", getAllTimeSlots);

module.exports = router;
