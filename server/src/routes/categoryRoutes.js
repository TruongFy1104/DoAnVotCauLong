const express = require("express");
const { getAllCategories, addCategory, editCategory } = require("../app/controller/CategoryController");
const authorize = require("../Common/Authorize");

const router = express.Router();

router.get("/", getAllCategories);


module.exports = router;
