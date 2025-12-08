const User = require("../model/usermodels");
const bcrypt = require("bcryptjs");

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
    const { email, password } = req.body;

    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.status(400).json({ message: "invalid credentiel" });
    }

    // const user = await bcrypt.compare(password,userExist.password);
    const user = await userExist.comparePassword(password);
    // console.log(user)

    if (user) {
      res.status(200).json({
        message: "login successful",
        token: await userExist.generateToken(),
        userId: userExist._id.toString(),
      });
      console.log(token);
    } else {
      res.status(401).json({ message: "invalid email or password" });
    }
  } catch (error) {
    res.status(500).json("internal server error");
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