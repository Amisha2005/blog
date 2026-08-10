const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
username: {
    type: String,
    required: true,
    trim: true,
},

email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
},

password: {
    type: String,
    required: true,
},
 role: {
    type: String,
    enum: ["candidate", "admin"],
    default: "candidate",
},
profileImage: {
    type: String,
    default: "",
},

college: {
    type: String,
    default: "",
    trim: true,
},

degree: {
    type: String,
    default: "",
    trim: true,
},

branch: {
    type: String,
    default: "",
    trim: true,
},
phone: {
    type: String,
    default: "",
    trim: true,
},

bio: {
    type: String,
    default: "",
    trim: true,
},

github: {
    type: String,
    default: "",
    trim: true,
},

linkedin: {
    type: String,
    default: "",
    trim: true,
},
resume: {
  url: {
    type: String,
    default: "",
  },
//   public_id: {
//     type: String,
//     default: "",
//   },
  uploadedAt: {
    type: Date,
    default: null,
  },
},
},
{
    timestamps: true,        // ✅ Correct place
  }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = async function () {
  try {
   return jwt.sign(
{
    userID: this._id.toString(),
    email: this.email,
    role: this.role,
},
process.env.JWT_SECRET_KEY,
{
    expiresIn: "30d",
}
);
  } catch (error) {
    console.log(error);
  }
}; //we can use in any controller
const User = mongoose.model("User", userSchema);


module.exports = User;