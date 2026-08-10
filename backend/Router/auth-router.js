const express = require("express");
const router = express.Router();
const {
  home,
  register,
  login,
  user,
  oauthLogin,
  updateProfile,
  uploadResume,
  getResume,
  deleteResume,
} = require("../controllers/auth-controllers");
const { signupSchema, loginSchema } = require("../validation/auth-validation");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/auth-middleware");
const upload = require("../middleware/upload-middleware");
// upload.single("resume")
router.route("/").get(home);
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/user").get(authMiddleware, user);
router.put(
  "/profile",
  (req, res, next) => {
    console.log("PROFILE ROUTE HIT");
    next();
  },
  authMiddleware,
  updateProfile,
); // router.route("/oauth").post(oauthLogin);
router.route("/oauth").post(oauthLogin);
router
  .route("/resume")
  .get(authMiddleware, getResume)
  .post(authMiddleware, upload.single("resume"), uploadResume)
  .delete(authMiddleware, deleteResume);

module.exports = router;
