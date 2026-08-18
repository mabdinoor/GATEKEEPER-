const asyncHandler = require("../core/asyncHandler");
const blacklistService = require("../services/blacklistService");

const check = asyncHandler(async (req, res) => {
  const result = await blacklistService.check(req.officer.company_id, req.query);
  res.json(result);
});

const list = asyncHandler(async (req, res) => {
  const blacklist = await blacklistService.list(req.officer.company_id);
  res.json({ blacklist });
});

const create = asyncHandler(async (req, res) => {
  const entry = await blacklistService.create(req.officer.company_id, req.officer.id, req.body);
  res.status(201).json({ entry });
});

const remove = asyncHandler(async (req, res) => {
  const result = await blacklistService.remove(req.officer.company_id, req.params.id);
  res.json(result);
});

module.exports = { check, list, create, remove };
