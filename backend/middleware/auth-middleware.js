const jwt = require("jsonwebtoken");
const User = require("../model/usermodels");
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ message: "unauthorized HTTP , token not provided" });
  }
  const jwtToken = token.split(" ")[1];
  // const jwtToken = token.replace("Bearer","").trim();
  // console.log("Decoded JWT:",decoded);
  try {
    // const isVerified = jwt.verify(jwtToken,process.env.JWT_SECRET_KEY);
    // console.log(isVerified)

    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    console.log("Decoded token:", decoded);

    // const userData = await User.findOne({email:isVerified.email}).

    // select({
    //     password:0,
    // });

    const userData = await User.findById(decoded.userID).select("-password");
    console.log("User found:", userData);
    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    console.log(userData);
    req.user = userData;
    req.token = jwtToken;
    req.userID = userData._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "unathorized invalid token" });
  }
};
module.exports = authMiddleware;
