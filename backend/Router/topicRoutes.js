// routes/topicRoutes.js
const express = require("express");
const router = express.Router();
const { addTopic, getAllTopics } = require("../controllers/topicController");

// Admin Routes
router.post("/admin/topics", addTopic);     // ← More clear

// Public Route
router.get("/topics", getAllTopics);        // Anyone can see topics

module.exports = router;