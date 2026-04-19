const bcrypt = require("bcryptjs");
const User = require("../model/usermodels");
const InterviewTopic = require("../model/interview");
const InterviewResult = require("../model/interviewResult");

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

const seedTopics = [
  {
    topicName: "React",
    description: "Master React.js fundamentals, hooks, state management, and advanced patterns. Explore component design, performance optimization, and modern development practices.",
    image: "https://cdn.worldvectorlogo.com/logos/react-2.svg",
  },
  {
    topicName: "System Design",
    description: "Practice designing scalable systems, APIs, databases, caching strategies, and distributed architectures with real-world tradeoffs.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop",
  },
  {
    topicName: "JavaScript",
    description: "Deep dive into JavaScript ES6+, async programming, promises, closures, prototypes, and functional programming concepts.",
    image: "https://cdn.worldvectorlogo.com/logos/javascript-1.svg",
  },
  {
    topicName: "Python",
    description: "Practice Python fundamentals, OOP, data structures, scripting patterns, and interview-focused problem solving for real-world backend and automation use cases.",
    image: "https://cdn.worldvectorlogo.com/logos/python-5.svg",
  },
  {
    topicName: "Node.js",
    description: "Backend development with Node.js, Express.js, REST APIs, middleware, authentication, and server-side best practices.",
    image: "https://cdn.worldvectorlogo.com/logos/nodejs-icon.svg",
  },
  {
    topicName: "MongoDB",
    description: "NoSQL database design with MongoDB, document modeling, indexing, aggregation pipelines, and query optimization.",
    image: "https://cdn.worldvectorlogo.com/logos/mongodb-icon-1.svg",
  },
  {
    topicName: "TypeScript",
    description: "Type-safe JavaScript development, interfaces, generics, decorators, and TypeScript patterns for scalable applications.",
    image: "https://cdn.worldvectorlogo.com/logos/typescript.svg",
  },
  {
    topicName: "SQL",
    description: "Relational database design, complex queries, normalization, indexing, transactions, and SQL optimization techniques.",
    image: "https://cdn.worldvectorlogo.com/logos/sqlite.svg",
  },
];

const seedDemoTopicsIfNeeded = async () => {
  try {
    for (const topic of seedTopics) {
      await InterviewTopic.findOneAndUpdate(
        { topicName: topic.topicName },
        {
          $set: {
            topicName: topic.topicName,
            description: topic.description,
            image: topic.image,
            isDemoTopic: true,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log("[seed] Demo interview topics ensured in database.");
  } catch (error) {
    console.error("[seed] Error seeding demo topics:", error.message);
  }
};

const seedUsersIfNeeded = async () => {
  const shouldSeedOnStartup = process.env.SEED_ON_STARTUP !== "false";

  if (!shouldSeedOnStartup) {
    console.log("[seed] Skipped startup seeding because SEED_ON_STARTUP=false.");
    return;
  }

  // Ensure collections + indexes for all seeded models.
  await Promise.all([User.init(), InterviewTopic.init(), InterviewResult.init()]);

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

  // Seed demo interview topics
  await seedDemoTopicsIfNeeded();

  console.log("[seed] Ensured startup seed data for required users, topics, and initialized result collection.");
};

module.exports = seedUsersIfNeeded;