const router = require("express").Router();
const { authMiddleware } = require("../middleware");
const controller = require("../controllers/blacklistController");

// IMPORTANT: /check must be defined BEFORE /:id or Express treats "check" as an id param
router.get("/check", authMiddleware, controller.check);
router.get("/", authMiddleware, controller.list);
router.post("/", authMiddleware, controller.create);
router.delete("/:id", authMiddleware, controller.remove);

module.exports = router;
