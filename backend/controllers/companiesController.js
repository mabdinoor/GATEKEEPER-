const asyncHandler = require("../core/asyncHandler");
const companyAuthService = require("../services/companyAuthService");
const officerService = require("../services/officerService");

const listCompanies = asyncHandler(async (req, res) => {
  const companies = await companyAuthService.listPublicCompanies();
  res.json({ companies });
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, tos_accepted } = req.body;
  const result = await companyAuthService.signup({ name, email, password, tosAccepted: tos_accepted });
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await companyAuthService.login(req.body);
  res.json(result);
});

const verify = asyncHandler(async (req, res) => {
  const result = await companyAuthService.verifyEmail(req.query.token);
  res.json(result);
});

const resendVerification = asyncHandler(async (req, res) => {
  const result = await companyAuthService.resendVerification(req.body.email);
  res.json(result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await companyAuthService.forgotPassword(req.body.email);
  res.json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await companyAuthService.resetPassword(req.body);
  res.json(result);
});

const register = asyncHandler(async (req, res) => {
  const { industry, address, logo_url, contact_person } = req.body;
  const result = await companyAuthService.completeProfile(req.company.id, {
    industry, address, logoUrl: logo_url, contactPerson: contact_person,
  });
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  const result = await companyAuthService.getMe(req.company.id);
  res.json(result);
});

const listOfficers = asyncHandler(async (req, res) => {
  const officers = await officerService.list(req.company.id);
  res.json({ officers });
});

const createOfficer = asyncHandler(async (req, res) => {
  const { badge_id, name, pin } = req.body;
  const officer = await officerService.create(req.company.id, { badgeId: badge_id, name, pin });
  res.status(201).json({ officer });
});

const deleteOfficer = asyncHandler(async (req, res) => {
  const result = await officerService.remove(req.company.id, req.params.id);
  res.json(result);
});

module.exports = {
  listCompanies, signup, login, verify, resendVerification,
  forgotPassword, resetPassword, register, me,
  listOfficers, createOfficer, deleteOfficer,
};
