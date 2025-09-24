const express = require("express");
const { protect } = require("../middleware/auth");
const {
	listNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
} = require("../controllers/notifications");

const router = express.Router();

router.use(protect);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

module.exports = router;
