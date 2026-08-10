const mongoose = require("mongoose");
require("dotenv").config();

// const mongoose = require("mongoose");

async function connectdb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.log(err);
  }
}

module.exports = connectdb;