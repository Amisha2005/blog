const mongoose = require("mongoose");
require("dotenv").config();

const getDbUri = () => {
  // Highest priority: explicit URI (works for both local/prod when you want full control)
  if (process.env.MONGODB_URI) {
    return { uri: process.env.MONGODB_URI, source: "MONGODB_URI" };
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && process.env.MONGODB_URI_LIVE) {
    return { uri: process.env.MONGODB_URI_LIVE, source: "MONGODB_URI_LIVE" };
  }

  if (!isProduction && process.env.MONGODB_URI_LOCAL) {
    return { uri: process.env.MONGODB_URI_LOCAL, source: "MONGODB_URI_LOCAL" };
  }

  // Safe fallback when NODE_ENV is not set as expected
  if (process.env.MONGODB_URI_LOCAL) {
    return { uri: process.env.MONGODB_URI_LOCAL, source: "MONGODB_URI_LOCAL" };
  }

  if (process.env.MONGODB_URI_LIVE) {
    return { uri: process.env.MONGODB_URI_LIVE, source: "MONGODB_URI_LIVE" };
  }

  throw new Error(
    "Missing MongoDB URI. Set MONGODB_URI, or set MONGODB_URI_LOCAL/MONGODB_URI_LIVE in .env"
  );
};

const connectdb = async () => {
  try {
    const { uri, source } = getDbUri();
    console.log(`Connecting to MongoDB using ${source} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
    await mongoose.connect(uri);
    console.log("connected successfully");
  } catch (error) {
    console.error("database not found", error.message);
    process.exit(0);
  }
};

module.exports = connectdb;
