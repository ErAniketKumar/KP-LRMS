const express = require("express");
const { body } = require("express-validator");
const {
	register,
	verifyEmail,
	login,
	logout,
	getMe,
	forgotPassword,
	resetPassword,
	updateProfile,
	changePassword,
	resendVerification,
} = require("../controllers/auth");
const {
	protect,
	validateDomain,
	auditLog,
	optionalAuth,
} = require("../middleware/auth");
const Organization = require("../models/Organization");

const router = express.Router();

// Validation rules
const registerValidation = [
	body("fullName")
		.trim()
		.isLength({ min: 2, max: 100 })
		.withMessage("Full name must be between 2 and 100 characters"),

	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),

	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long")
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage(
			"Password must contain at least one uppercase letter, one lowercase letter, and one number"
		),

	body("organization")
		.trim()
		.notEmpty()
		.withMessage("Organization is required")
		.custom(async (value) => {
			// Check if organization exists in database
			const organization = await Organization.findOne({
				name: value,
				isActive: true,
			});

			if (!organization) {
				throw new Error("Please select a valid active organization");
			}

			return true;
		}),

	body("employeeId")
		.optional()
		.trim()
		.isLength({ max: 20 })
		.withMessage("Employee ID cannot exceed 20 characters"),

	body("contactDetails.phone")
		.optional()
		.matches(/^\+?[\d\s-()]+$/)
		.withMessage("Please provide a valid phone number"),

	body("linkedinProfile")
		.optional()
		.matches(/^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/)
		.withMessage("Please provide a valid LinkedIn profile URL"),

	body("bio")
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage("Bio cannot exceed 500 characters"),
];

const loginValidation = [
	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),

	body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
];

const resetPasswordValidation = [
	body("password")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long")
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage(
			"Password must contain at least one uppercase letter, one lowercase letter, and one number"
		),
];

const updateProfileValidation = [
	body("fullName")
		.optional()
		.trim()
		.isLength({ min: 2, max: 100 })
		.withMessage("Full name must be between 2 and 100 characters"),

	body("employeeId")
		.optional()
		.trim()
		.isLength({ max: 20 })
		.withMessage("Employee ID cannot exceed 20 characters"),

	body("contactDetails.phone")
		.optional()
		.matches(/^\+?[\d\s-()]+$/)
		.withMessage("Please provide a valid phone number"),

	body("linkedinProfile")
		.optional()
		.matches(/^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/)
		.withMessage("Please provide a valid LinkedIn profile URL"),

	body("bio")
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage("Bio cannot exceed 500 characters"),
];

const changePasswordValidation = [
	body("currentPassword")
		.notEmpty()
		.withMessage("Current password is required"),

	body("newPassword")
		.isLength({ min: 6 })
		.withMessage("New password must be at least 6 characters long")
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage(
			"New password must contain at least one uppercase letter, one lowercase letter, and one number"
		)
		.custom((value, { req }) => {
			if (value === req.body.currentPassword) {
				throw new Error("New password must be different from current password");
			}
			return true;
		}),
];

const resendVerificationValidation = [
	body("email")
		.isEmail()
		.normalizeEmail()
		.withMessage("Please provide a valid email address"),
];

// Public routes
router.post(
	"/register",
	registerValidation,
	validateDomain,
	auditLog("REGISTER", "User"),
	register
);

router.get(
	"/verify-email/:token",
	auditLog("VERIFY_EMAIL", "User"),
	verifyEmail
);

router.post("/login", loginValidation, auditLog("LOGIN", "User"), login);

router.post(
	"/forgot-password",
	forgotPasswordValidation,
	auditLog("PASSWORD_RESET", "User"),
	forgotPassword
);

router.put(
	"/reset-password/:token",
	resetPasswordValidation,
	auditLog("PASSWORD_RESET", "User"),
	resetPassword
);

router.post(
	"/resend-verification",
	resendVerificationValidation,
	resendVerification
);

// Logout route (no auth required since token might be invalid)
router.post("/logout", optionalAuth, auditLog("LOGOUT", "User"), logout);

// Protected routes
router.use(protect); // All routes below this are protected

router.get("/me", auditLog("READ", "User"), getMe);

router.put(
	"/profile",
	updateProfileValidation,
	auditLog("UPDATE", "User"),
	updateProfile
);

router.put(
	"/change-password",
	changePasswordValidation,
	auditLog("UPDATE", "User"),
	changePassword
);

module.exports = router;
