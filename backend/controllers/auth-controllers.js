const User = require("../model/usermodels");
const bcrypt = require("bcryptjs");
const { loginSchema } = require("../validation/auth-validation");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const home = async (req, res) => {
  try {
    res.status(200).send("welcome to server.js");
  } catch (error) {
    res.status(400).send({ mes: "page not found" });
  }
};

const register = async (req, res, next) => {
   console.log("REGISTER ROUTE HIT");
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
      role: "candidate",
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

const updateProfile = async (req, res) => {
  try {
const {
username,
phone,
college,
degree,
branch,
bio,
github,
linkedin,
profileImage,
}=req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.userID,
      {
       username,
phone,
college,
degree,
branch,
bio,
github,
linkedin,
profileImage
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// const uploadResume = async (req, res) => {
//   try {
//     console.log("===== UPLOAD START =====");
//     console.log("req.file:", req.file);
//     console.log("req.body:", req.body);
//     console.log("req.userID:", req.userID);
//     if (!req.file) {
//       return res.status(400).json({
//         message: "Please upload a PDF resume.",
//       });
//     }

//     // Find user
//     const existingUser = await User.findById(req.userID);

//     if (!existingUser) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // Delete old resume if it exists
//     if (existingUser.resume?.public_id) {
//       await cloudinary.uploader.destroy(existingUser.resume.public_id, {
//         resource_type: "raw",
//       });
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.userID,
//       {
//         resume: {
//           url: req.file.path,
//           public_id: req.file.filename,
//           uploadedAt: new Date(),
//         },
//       },
//       {
//         new: true,
//       }
//     ).select("-password");

//     res.status(200).json({
//       message: "Resume uploaded successfully.",
//       resume: updatedUser.resume,
//     });
//   } catch (error)  {
//   console.error("Resume Upload Error:");
//   console.error(error);
//   console.error(error.stack);

//   res.status(500).json({
//     message: error.message,
//   });
//   }
// };

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file.",
      });
    }

    const existingUser = await User.findById(req.userID);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Delete previous resume
    if (existingUser.resume?.public_id) {
      await cloudinary.uploader.destroy(existingUser.resume.public_id, {
        resource_type: "raw",
      });
    }
console.log("req.file =", req.file);
console.log("Buffer exists =", !!req.file.buffer);
console.log("Size =", req.file.size);
console.log("Mime =", req.file.mimetype);
   const uploadResult = await new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "NovaTechAI/Resumes",
      // resource_type: "raw",
    },
    (error, result) => {
      console.log("Cloudinary callback");

      if (error) {
        console.dir(error, { depth: null });
        return reject(error);
      }

      console.log(result);
      resolve(result);
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

    const updatedUser = await User.findByIdAndUpdate(
      req.userID,
      {
        resume: {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          uploadedAt: new Date(),
        },
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Resume uploaded successfully.",
      resume: updatedUser.resume,
    });
} catch (error) {
  console.error("========== CLOUDINARY ERROR ==========");
  console.error(error);

  if (error.response) {
    console.error(error.response);
  }

  console.error(error.message);

  res.status(500).json({
    message: error.message,
  });
}
};

const oauthLogin = async (req, res) => {
  try {
    const { email, username, provider } = req.body;

    let user = await User.findOne({ email });

    // If user doesn't exist → create
    if (!user) {
     user = await User.create({
    username,
    email,
    password: "oauth_user",
    provider,
    role: "candidate",
});
    }

    res.status(200).json({
      message: "OAuth login successful",
      token: await user.generateToken(),
      userId: user._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ message: "OAuth login failed" });
  }
};  
const getResume = async (req, res) => {
  try {
    const user = await User.findById(req.userID).select("resume");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      resume: user.resume,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.userID);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // No resume uploaded
    if (!user.resume?.public_id) {
      return res.status(400).json({
        message: "No resume found.",
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.resume.public_id, {
      resource_type: "raw",
    });

    // Remove from MongoDB
    user.resume = {
      url: "",
      public_id: "",
      uploadedAt: null,
    };

    await user.save();

    res.status(200).json({
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Resume Error:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
module.exports = { home, register, login, user ,oauthLogin,updateProfile,uploadResume,getResume,deleteResume};
