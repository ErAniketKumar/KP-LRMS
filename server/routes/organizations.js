const express = require("express");
const { body } = require("express-validator");
const {
	getOrganizations,
	getOrganization,
	createOrganization,
	updateOrganization,
	deleteOrganization,
	validateDomain,
} = require("../controllers/organizations");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes (for registration)
router.get("/", getOrganizations);
router.get("/public", getOrganizations); // Alias for cleaner frontend code
router.get("/validate-domain/:domain", validateDomain);
router.post("/validate-domain", validateDomain); // Keep existing POST method

// Apply authentication middleware to all routes below
router.use(protect);

// Admin-only routes
router.use(authorize("admin"));

// Admin endpoint for full organization details
router.get("/admin", getOrganizations);

router
	.route("/:id")
	.get(getOrganization)
	.put(
		[
			body("name")
				.optional()
				.trim()
				.isLength({ min: 1, max: 100 })
				.withMessage("Organization name must be 1-100 characters"),
			body("domain")
				.optional()
				.trim()
				.isLength({ min: 4, max: 253 })
				.matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/)
				.withMessage("Please provide a valid domain (e.g., company.com)")
				.normalizeEmail({ gmail_remove_dots: false }),
			body("contactInfo")
				.optional()
				.trim()
				.isLength({ max: 500 })
				.withMessage("Contact info cannot exceed 500 characters"),
			body("isActive")
				.optional()
				.isBoolean()
				.withMessage("isActive must be a boolean"),
		],
		updateOrganization
	)
	.delete(deleteOrganization);

router.post(
	"/",
	[
		body("name")
			.trim()
			.notEmpty()
			.withMessage("Organization name is required")
			.isLength({ min: 1, max: 100 })
			.withMessage("Organization name must be 1-100 characters"),
		body("domain")
			.trim()
			.notEmpty()
			.withMessage("Domain is required")
			.isLength({ min: 4, max: 253 })
			.withMessage("Domain must be 4-253 characters")
			.matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/)
			.withMessage("Please provide a valid domain (e.g., company.com)")
			.normalizeEmail({ gmail_remove_dots: false }),
		body("contactInfo")
			.optional()
			.trim()
			.isLength({ max: 500 })
			.withMessage("Contact info cannot exceed 500 characters"),
	],
	createOrganization
);

module.exports = router;
