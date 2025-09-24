const express = require("express");
const { body } = require("express-validator");
const {
	getCredentials,
	getCredential,
	createCredential,
	updateCredential,
	deleteCredential,
} = require("../controllers/credentials");
const { protect, authorize, auditLog } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
// Create: title required, password required
const credentialCreateValidation = [
	body("title")
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Title is required and must be between 1 and 200 characters"),
	body("username")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("Username must be less than 100 characters"),
	body("email")
		.optional({ checkFalsy: true })
		.isEmail()
		.withMessage("Please provide a valid email"),
	body("password").isLength({ min: 1 }).withMessage("Password is required"),
];

// Update: all fields optional; if provided, validate
const credentialUpdateValidation = [
	body("title")
		.optional()
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Title must be between 1 and 200 characters"),
	body("username")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("Username must be less than 100 characters"),
	body("email")
		.optional({ checkFalsy: true })
		.isEmail()
		.withMessage("Please provide a valid email"),
	// Password fields optional; if present, must be non-empty strings
	body("password")
		.optional({ checkFalsy: true })
		.isLength({ min: 1 })
		.withMessage("Password cannot be empty"),
	body("password2")
		.optional({ checkFalsy: true })
		.isLength({ min: 1 })
		.withMessage("Password2 cannot be empty"),
];

// Routes
router
	.route("/")
	.get(getCredentials)
	.post(credentialCreateValidation, createCredential);

router
	.route("/:id")
	.get(getCredential)
	.put(credentialUpdateValidation, updateCredential)
	.delete(deleteCredential);

module.exports = router;
