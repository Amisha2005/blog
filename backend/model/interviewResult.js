const mongoose = require("mongoose");

const interviewResultSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      default: "Medium",
      trim: true,
    },
    candidateName: {
      type: String,
      default: "Candidate",
      trim: true,
    },
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    presenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    finalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("InterviewResult", interviewResultSchema);
