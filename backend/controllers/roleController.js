const Role = require("../model/roleModel");

// Add Role
const addRole = async (req, res) => {
  try {
    const { company, title, difficulty, description } = req.body;

    const existingRole = await Role.findOne({
      company,
      title,
    });

    if (existingRole) {
      return res.status(400).json({
        message: "Role already exists for this company.",
      });
    }

    const role = await Role.create({
      company,
      title,
      difficulty,
      description,
    });

    res.status(201).json({
      message: "Role added successfully.",
      role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const getRolesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const roles = await Role.find({
      company: companyId,
    }).populate("company", "name logo");

    res.status(200).json(roles);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  addRole,
  getRolesByCompany,
};