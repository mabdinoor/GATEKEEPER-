const asyncHandler = require("../core/asyncHandler");
const officerService = require("../services/officerService");

const login = asyncHandler(async (req, res) => {
  const { badge_id, password, company_id } = req.body;
  const result = await officerService.login({ badgeId: badge_id, password, companyId: company_id });
  res.json(result);
});

const me = (req, res) => {
  res.json({ officer: req.officer });
};

module.exports = { login, me };
