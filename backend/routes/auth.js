const router = require("express").Router();
const { authMiddleware } = require("../middleware");
const controller = require("../controllers/authController");

// POST /api/auth/login — officer login (scoped to company)
router.post("/login", controller.login);

// GET /api/auth/me
router.get("/me", authMiddleware, controller.me);

module.exports = router;
