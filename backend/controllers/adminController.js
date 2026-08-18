const asyncHandler = require("../core/asyncHandler");
const adminService = require("../services/adminService");

const login = asyncHandler(async (req, res) => {
  const result = await adminService.login(req.body);
  res.json(result);
});

const listCompanies = asyncHandler(async (req, res) => {
  const companies = await adminService.listCompanies();
  res.json({ companies });
});

const getCompany = asyncHandler(async (req, res) => {
  const result = await adminService.getCompanyDetail(req.params.id);
  res.json(result);
});

const changePlan = asyncHandler(async (req, res) => {
  const result = await adminService.changePlan(req.params.id, req.body.plan);
  res.json(result);
});

const deleteCompany = asyncHandler(async (req, res) => {
  const result = await adminService.deleteCompany(req.params.id);
  res.json(result);
});

const stats = asyncHandler(async (req, res) => {
  const result = await adminService.getPlatformStats();
  res.json(result);
});

module.exports = { login, listCompanies, getCompany, changePlan, deleteCompany, stats };
