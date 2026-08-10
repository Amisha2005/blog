const Company = require("../model/companyModel");

// Add Company
const addCompany = async (req, res) => {
  try {
    const { name, logo, description } = req.body;

    const existingCompany = await Company.findOne({ name });

    if (existingCompany) {
      return res.status(400).json({
        message: "Company already exists",
      });
    }

    const company = await Company.create({
      name,
      logo,
      description,
    });

    res.status(201).json({
      message: "Company added successfully",
      company,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true }).sort({
      name: 1,
    });

    res.status(200).json(companies);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
module.exports = {
  addCompany,
  getCompanies,
};