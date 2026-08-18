const asyncHandler = require("../core/asyncHandler");
const visitorService = require("../services/visitorService");

const search = asyncHandler(async (req, res) => {
  const { search, type, status, date } = req.query;
  const visitors = await visitorService.search(req.officer.company_id, { search, type, status, date });
  res.json({ visitors });
});

const checkIn = asyncHandler(async (req, res) => {
  const visitor = await visitorService.checkIn(req.officer.company_id, req.officer.id, req.body);
  res.status(201).json({ visitor });
});

const checkOut = asyncHandler(async (req, res) => {
  const visitor = await visitorService.checkOut(req.officer.company_id, req.params.id);
  res.json({ visitor });
});

const stats = asyncHandler(async (req, res) => {
  const result = await visitorService.getStats(req.officer.company_id);
  res.json(result);
});

module.exports = { search, checkIn, checkOut, stats };
