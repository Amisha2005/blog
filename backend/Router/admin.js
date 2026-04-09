// backend/routes/admin.js

const express = require("express");
const router = express.Router();
const { getAdminStats } = require("../controllers/adminController");

// Optional: Add admin authentication middleware here
// const { isAdmin } = require("../middleware/auth");

router.get("/stats", getAdminStats);     // This will be available at /api/admin/stats

module.exports = router;