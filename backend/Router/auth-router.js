const express = require("express");
const router = express.Router();
const {
  home,
  register,
  login,
  user,
} = require("../controllers/auth-controllers");
const { signupSchema, loginSchema } = require("../validation/auth-validation");
const authMiddleware = require("../middleware/auth-middleware");


router.route("/").get(home);
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/user").get(authMiddleware, user);

module.exports = router;
