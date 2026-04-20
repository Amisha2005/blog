// backend/routes/admin.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth-middleware");
const {
  getAdminStats,
  deleteLeaderboardRecord,
} = require("../controllers/adminController");

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

router.get("/stats", authMiddleware, requireAdmin, getAdminStats);
router.delete("/leaderboard/:id", authMiddleware, requireAdmin, deleteLeaderboardRecord);

module.exports = router;
