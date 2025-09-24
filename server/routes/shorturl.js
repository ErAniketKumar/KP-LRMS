const express = require("express");
const { body } = require("express-validator");
const {
	getShortUrls,
	getShortUrl,
	createShortUrl,
	updateShortUrl,
	deleteShortUrl,
	redirectShortUrl,
	getShortUrlAnalytics,
} = require("../controllers/shorturl");
const { protect, auditLog } = require("../middleware/auth");

const router = express.Router();

// Public route for redirection (no auth required)
router.get("/:shortCode", redirectShortUrl);

// Apply authentication to remaining routes
router.use(protect);

// Short URL CRUD routes
router
	.route("/")
	.get(getShortUrls)
	.post(
		[
			body("originalUrl")
				.notEmpty()
				.withMessage("Original URL is required")
				.isURL({ require_protocol: true })
				.withMessage("Please provide a valid URL with protocol (http/https)"),
			body("title")
				.optional()
				.isLength({ max: 200 })
				.withMessage("Title cannot exceed 200 characters"),
			body("description")
				.optional()
				.isLength({ max: 500 })
				.withMessage("Description cannot exceed 500 characters"),
			body("customCode")
				.optional()
				.isLength({ min: 3, max: 20 })
				.withMessage("Custom code must be between 3 and 20 characters")
				.matches(/^[a-zA-Z0-9_-]+$/)
				.withMessage(
					"Custom code can only contain letters, numbers, hyphens, and underscores"
				),
			body("expirationDate")
				.optional()
				.isISO8601()
				.withMessage("Expiration date must be a valid date"),
			body("maxClicks")
				.optional()
				.isInt({ min: 1 })
				.withMessage("Max clicks must be a positive integer"),
		],
		auditLog("CREATE", "ShortUrl"),
		createShortUrl
	);

router
	.route("/:id")
	.get(getShortUrl)
	.put(
		[
			body("title")
				.optional()
				.isLength({ max: 200 })
				.withMessage("Title cannot exceed 200 characters"),
			body("description")
				.optional()
				.isLength({ max: 500 })
				.withMessage("Description cannot exceed 500 characters"),
			body("expirationDate")
				.optional()
				.isISO8601()
				.withMessage("Expiration date must be a valid date"),
			body("maxClicks")
				.optional()
				.isInt({ min: 1 })
				.withMessage("Max clicks must be a positive integer"),
		],
		auditLog("UPDATE", "ShortUrl"),
		updateShortUrl
	)
	.delete(auditLog("DELETE", "ShortUrl"), deleteShortUrl);

// Analytics route
router.get("/:id/analytics", getShortUrlAnalytics);

module.exports = router;
