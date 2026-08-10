const express = require("express");
const router = express.Router();

const {
  addRole,
  getRolesByCompany,
} = require("../controllers/roleController");

const {authMiddleware} = require("../middleware/auth-middleware");
const {adminMiddleware} = require("../middleware/auth-middleware");

// Admin only
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  addRole
);

// Candidate/Admin
router.get("/:companyId", getRolesByCompany);

module.exports = router;