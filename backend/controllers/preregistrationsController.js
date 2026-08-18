const asyncHandler = require("../core/asyncHandler");
const preregService = require("../services/preregistrationService");

const list = asyncHandler(async (req, res) => {
  const preregistrations = await preregService.list(req.officer.company_id);
  res.json({ preregistrations });
});

const create = asyncHandler(async (req, res) => {
  const prereg = await preregService.create(req.officer.company_id, req.officer.id, req.body);
  res.status(201).json({ prereg });
});

const cancel = asyncHandler(async (req, res) => {
  const result = await preregService.cancel(req.officer.company_id, req.params.id);
  res.json(result);
});

const today = asyncHandler(async (req, res) => {
  const preregistrations = await preregService.today(req.officer.company_id);
  res.json({ preregistrations });
});

module.exports = { list, create, cancel, today };
