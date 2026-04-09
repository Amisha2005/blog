const bcrypt = require("bcryptjs");
const User = require("../model/usermodels");

const seedUsers = [
  {
    username: "admin_one",
    email: "admin1@nova.local",
    password: "Admin@123",
    isAdmin: true,
  },
  {
    username: "admin_two",
    email: "admin2@nova.local",
    password: "Admin@123",
    isAdmin: true,
  },
  {
    username: "admin_three",
    email: "admin3@nova.local",
    password: "Admin@123",
    isAdmin: true,
  },
  {
    username: "user_one",
    email: "user1@nova.local",
    password: "User@123",
    isAdmin: false,
  },
  {
    username: "user_two",
    email: "user2@nova.local",
    password: "User@123",
    isAdmin: false,
  },
  {
    username: "user_three",
    email: "user3@nova.local",
    password: "User@123",
    isAdmin: false,
  },
];

const getSelectedDbUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && process.env.MONGODB_URI_LIVE) {
    return process.env.MONGODB_URI_LIVE;
  }

  if (!isProduction && process.env.MONGODB_URI_LOCAL) {
    return process.env.MONGODB_URI_LOCAL;
  }

  return process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI_LIVE || "";
};

const isLocalMongoUri = (uri) => {
  if (!uri) return false;
  const normalized = String(uri).toLowerCase();
  return (
    normalized.includes("127.0.0.1") ||
    normalized.includes("localhost") ||
    normalized.includes("mongodb://mongo")
  );
};

const seedLocalUsersIfNeeded = async () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log("[seed] Skipped user seeding in production mode.");
    return;
  }

  const selectedUri = getSelectedDbUri();
  if (!isLocalMongoUri(selectedUri)) {
    console.log("[seed] Skipped user seeding because selected DB URI is not local.");
    return;
  }

  const seededEmails = seedUsers.map((user) => user.email);
  const existingSeededCount = await User.countDocuments({
    email: { $in: seededEmails },
  });

  if (existingSeededCount === seedUsers.length) {
    console.log("[seed] Seed users already exist. Skipping.");
    return;
  }

  const saltRound = 10;
  const usersToUpsert = await Promise.all(
    seedUsers.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, saltRound),
    }))
  );

  await User.bulkWrite(
    usersToUpsert.map((user) => ({
      updateOne: {
        filter: { email: user.email },
        update: {
          $set: {
            username: user.username,
            password: user.password,
            isAdmin: user.isAdmin,
          },
          $setOnInsert: { email: user.email },
        },
        upsert: true,
      },
    }))
  );

  console.log("[seed] Ensured 3 admins and 3 users are present in local database.");
};

module.exports = seedLocalUsersIfNeeded;