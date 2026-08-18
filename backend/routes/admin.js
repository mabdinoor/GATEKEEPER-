const router = require("express").Router();
const { adminAuthMiddleware } = require("../middleware");
const controller = require("../controllers/adminController");

router.post("/login", controller.login);

router.get("/stats", adminAuthMiddleware, controller.stats);
router.get("/companies", adminAuthMiddleware, controller.listCompanies);
router.get("/companies/:id", adminAuthMiddleware, controller.getCompany);
router.patch("/companies/:id/plan", adminAuthMiddleware, controller.changePlan);
router.delete("/companies/:id", adminAuthMiddleware, controller.deleteCompany);

module.exports = router;
