const User = require("../model/usermodels");
const bcrypt = require("bcryptjs");
const { loginSchema } = require("../validation/auth-validation");

const home = async (req, res) => {
  try {
    res.status(200).send("welcome to server.js");
  } catch (error) {
    res.status(400).send({ mes: "page not found" });
  }
};

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    console.log(req.body);
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "email already exist" });
    }
    // console.log(userExist);

    const saltRound = 10;
    const hash_password = await bcrypt.hash(password, saltRound);
    const userCreated = await User.create({
      username,
      email,
      password: hash_password,
    });
    res.status(201).json({
      msg: userCreated,
      token: await userCreated.generateToken(),
      userId: userCreated._id.toString(),
    });
  } catch (error) {
    // res.status(500).json("internal server error")
    next(error);
  }
};

const login = async (req, res) => {
  // console.log(req.body)
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      return res.status(400).json({
        message: firstIssue?.message || "Please enter a valid email and password.",
      });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = String(email).trim().toLowerCase();

    const userExist = await User.findOne({ email: normalizedEmail });
    if (!userExist) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // const user = await bcrypt.compare(password,userExist.password);
    const user = await userExist.comparePassword(password);
    // console.log(user)

    if (user) {
      res.status(200).json({
        message: "Login successful.",
        token: await userExist.generateToken(),
        userId: userExist._id.toString(),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Unable to log in right now. Please try again." });
  }
};

//to send user data
const user = async (req, res) => {
  try {
    const userData = req.user;
    console.log(userData);
    return res.status(200).json({ userData });
  } catch (error) {
    console.log(`error from the user route ${error}`);
  }
};

module.exports = { home, register, login, user };
