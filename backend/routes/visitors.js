const router = require("express").Router();
const { authMiddleware } = require("../middleware");
const controller = require("../controllers/visitorsController");

router.use(authMiddleware);

router.get("/", controller.search);
router.post("/", controller.checkIn);
router.patch("/:id/checkout", controller.checkOut);
router.get("/stats", controller.stats);

module.exports = router;
