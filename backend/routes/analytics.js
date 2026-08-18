const router = require("express").Router();
const { companyAuthMiddleware } = require("../middleware");
const controller = require("../controllers/analyticsController");

// GET /api/analytics/report?period=weekly|monthly — preview data
router.get("/report", companyAuthMiddleware, controller.report);

// POST /api/analytics/send — email the report now
router.post("/send", companyAuthMiddleware, controller.send);

module.exports = router;
