const express = require("express");
const { body } = require("express-validator");
const {
	getLinks,
	getLink,
	createLink,
	updateLink,
	deleteLink,
	clickLink,
	getPopularLinks,
	getRecentLinks,
	approveLink,
	archiveLink,
	activateVisibleLinks,
} = require("../controllers/links");
const { protect, authorize, auditLog } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const linkValidation = [
	body("title")
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Title is required and must be between 1 and 200 characters"),

	body("url").trim().isLength({ min: 1 }).withMessage("URL is required"),

	body("description")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Description cannot exceed 1000 characters"),

	body("category")
		.optional()
		.trim()
		.isLength({ max: 50 })
		.withMessage("Category cannot exceed 50 characters"),

	body("project")
		.optional()
		.trim()
		.isLength({ max: 50 })
		.withMessage("Project cannot exceed 50 characters"),

	body("tags").optional().isArray().withMessage("Tags must be an array"),

	body("tags.*")
		.optional()
		.trim()
		.isLength({ min: 1, max: 50 })
		.withMessage("Each tag must be between 1 and 50 characters"),

	body("priority")
		.optional()
		.isIn(["high", "medium", "low"])
		.withMessage("Priority must be high, medium, or low"),

	body("expirationDate")
		.optional()
		.isISO8601()
		.withMessage("Expiration date must be a valid date"),

	body("isPublic")
		.optional()
		.isBoolean()
		.withMessage("isPublic must be a boolean"),

	body("notes")
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage("Notes cannot exceed 500 characters"),
];

// Apply authentication to all routes
router.use(protect);

// Special routes first (before :id routes)
router.get("/popular", getPopularLinks);
router.get("/recent", getRecentLinks);

// Main CRUD routes
router
	.route("/")
	.get(getLinks)
	// .get(auditLog("READ", "Link"), getLinks)
	.post(linkValidation, auditLog("CREATE", "Link"), createLink);

router
	.route("/:id")
	.get(getLink)
	.put(linkValidation, updateLink)
	.delete(deleteLink);

// Action routes
router.post("/:id/click", auditLog("READ", "Link"), clickLink);

// Admin-only routes
router.put(
	"/:id/approve",
	authorize("admin"),
	auditLog("APPROVE", "Link"),
	approveLink
);

router.put("/:id/archive", auditLog("UPDATE", "Link"), archiveLink);

// Admin maintenance route to normalize visibility statuses
router.put(
	"/admin/activate-visible",
	authorize("admin"),
	auditLog("UPDATE", "Link"),
	activateVisibleLinks
);

module.exports = router;
