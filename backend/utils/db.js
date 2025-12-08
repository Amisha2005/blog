const mongoose = require("mongoose");
require("dotenv").config();

// const dbURI = 'mongodb://127.0.0.1:27017/my_project_db';
const dbURI = process.env.MONGODB_URI;
const connectdb = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("connected successfully");
  } catch (error) {
    console.error("database not found");
    process.exit(0);
  }
};

module.exports = connectdb;
