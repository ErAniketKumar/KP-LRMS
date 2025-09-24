const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
	getSystemStats,
	getUsageAnalytics,
	listUsers,
	updateUserRole,
	updateUserStatus,
	deleteUser,
} = require("../controllers/admin");

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize("admin"));

// System administration
router.get("/system-stats", getSystemStats);

// Usage analytics
router.get("/analytics", getUsageAnalytics);

// User management
router.get("/users", listUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

module.exports = router;
