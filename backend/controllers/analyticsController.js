const asyncHandler = require("../core/asyncHandler");
const analyticsService = require("../services/analyticsService");

const report = asyncHandler(async (req, res) => {
  const result = await analyticsService.getReport(req.company.id, req.query.period);
  res.json(result);
});

const send = asyncHandler(async (req, res) => {
  const result = await analyticsService.sendReport(req.company.id, req.body.period);
  res.json(result);
});

module.exports = { report, send };
