const router = require("express").Router();
const { authMiddleware } = require("../middleware");
const controller = require("../controllers/preregistrationsController");

router.get("/", authMiddleware, controller.list);
router.post("/", authMiddleware, controller.create);
router.patch("/:id/cancel", authMiddleware, controller.cancel);
router.get("/today", authMiddleware, controller.today);

module.exports = router;
