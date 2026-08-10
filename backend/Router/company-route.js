const express = require("express");
const router = express.Router();

const {
  addCompany,
  getCompanies,
} = require("../controllers/company-controller");
const {adminMiddleware} = require("../middleware/auth-middleware");
const {authMiddleware} = require("../middleware/auth-middleware");

// Add Company
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  addCompany
);

// Get Companies
router.get("/", getCompanies);

module.exports = router;