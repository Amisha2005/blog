// models/InterviewTopic.js
const mongoose = require("mongoose");

const interviewTopicSchema = new mongoose.Schema(
  {
    topicName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "", // URL of the image
    },
    isDemoTopic: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Optional: Add more fields later
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { 
    timestamps: true 
  }
);

const InterviewTopic = mongoose.model("InterviewTopic", interviewTopicSchema);

module.exports = InterviewTopic;