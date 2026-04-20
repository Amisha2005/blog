// // controllers/adminController.js
// const User = require("../model/usermodels");   // Try this first (your current name)

// const getAdminStats = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();

//     const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//     const newUsersThisMonth = await User.countDocuments({
//       createdAt: { $gte: thirtyDaysAgo }
//     });

//     res.status(200).json({
//       success: true,
//       totalUsers,
//       newUsersThisMonth,
//     });
//   } catch (error) {
//     console.error("Error in getAdminStats:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching stats",
//     });
//   }
// };

// module.exports = { getAdminStats };

// controllers/adminController.js
// controllers/adminController.js
const User = require("../model/usermodels");
const InterviewResult = require("../model/interviewResult");

const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // Count users that have createdAt field
    const usersWithCreatedAt = await User.countDocuments({ createdAt: { $exists: true } });

    // If no users have createdAt, count all users as "new this month" for now
    let newUsersThisMonth = 0;

    if (usersWithCreatedAt === 0) {
      newUsersThisMonth = totalUsers;   // ← Temporary fallback
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth }
      });
    }

    // Count admins
    const totalAdmins = await User.countDocuments({ isAdmin: true });

    console.log("Total Users:", totalUsers);
    console.log("Users with createdAt:", usersWithCreatedAt);
    console.log("New Users This Month:", newUsersThisMonth);

    res.status(200).json({
      success: true,
      totalUsers,
      newUsersThisMonth,
      totalAdmins,
      usersWithCreatedAt,
    });
  } catch (error) {
    console.error("Error in getAdminStats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteLeaderboardRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Missing record id" });
    }

    const deleted = await InterviewResult.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Leaderboard record not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Leaderboard record deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting leaderboard record:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAdminStats, deleteLeaderboardRecord };
