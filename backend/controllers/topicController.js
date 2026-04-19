// controllers/topicController.js
const InterviewTopic = require("../model/interview");
const InterviewResult = require("../model/interviewResult");

const addTopic = async (req, res) => {
  try {
    const { topicName, description, image, date } = req.body;

    const newTopic = new InterviewTopic({
      topicName,
      description,
      image,
      date: date || Date.now(),
    });

    await newTopic.save();

    res.status(201).json({
      success: true,
      message: "Topic added successfully",
      topic: newTopic,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error adding topic",
    });
  }
};

const getAllTopics = async (req, res) => {
  try {
    const topics = await InterviewTopic.find().sort({ createdAt: -1 });

    const includeResultTopics =
      String(req.query.includeResultTopics || "").toLowerCase() === "true";

    if (!includeResultTopics) {
      return res.status(200).json({
        success: true,
        topics,
      });
    }

    const existingTopicNames = new Set(
      topics
        .map((topic) => String(topic.topicName || "").trim().toLowerCase())
        .filter(Boolean),
    );

    const resultTopicNames = await InterviewResult.distinct("topic", {
      topic: { $exists: true, $ne: null },
    });

    const inferredTopics = resultTopicNames
      .map((topicName) => String(topicName || "").trim())
      .filter((topicName) => topicName.length > 0)
      .filter((topicName) => !existingTopicNames.has(topicName.toLowerCase()))
      .map((topicName) => ({
        _id: `result-${topicName.toLowerCase().replace(/\s+/g, "-")}`,
        topicName,
        description: "Auto-discovered from interview results.",
        image: "",
        isDemoTopic: false,
        isInferredFromResults: true,
      }));

    const mergedTopics = [...topics, ...inferredTopics];

    res.status(200).json({
      success: true,
      topics: mergedTopics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching topics",
    });
  }
};

module.exports = { addTopic, getAllTopics };