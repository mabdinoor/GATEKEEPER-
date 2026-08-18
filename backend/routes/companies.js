const router = require("express").Router();
const { companyAuthMiddleware } = require("../middleware");
const controller = require("../controllers/companiesController");

router.get("/list", controller.listCompanies);
router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.get("/verify", controller.verify);
router.post("/resend-verification", controller.resendVerification);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

router.post("/register", companyAuthMiddleware, controller.register);
router.get("/me", companyAuthMiddleware, controller.me);

router.get("/officers", companyAuthMiddleware, controller.listOfficers);
router.post("/officers", companyAuthMiddleware, controller.createOfficer);
router.delete("/officers/:id", companyAuthMiddleware, controller.deleteOfficer);

module.exports = router;
