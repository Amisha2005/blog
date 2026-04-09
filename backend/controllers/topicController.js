// controllers/topicController.js
const InterviewTopic = require("../model/interview");

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
    res.status(200).json({
      success: true,
      topics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching topics",
    });
  }
};

module.exports = { addTopic, getAllTopics };