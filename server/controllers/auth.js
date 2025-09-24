const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Organization = require("../models/Organization");
const AuditLog = require("../models/AuditLog");
const {
	sendVerificationEmail,
	sendPasswordResetEmail,
	sendWelcomeEmail,
} = require("../utils/email");
const {
	generateToken,
	sendTokenResponse,
	clearTokenCookies,
} = require("../utils/jwt");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
	try {
		console.log("=== Register endpoint called ===");
		console.log("Request body:", JSON.stringify(req.body, null, 2));

		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log("Validation errors:", errors.array());
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const {
			fullName,
			email,
			password,
			organization,
			employeeId,
			contactDetails,
			linkedinProfile,
			bio,
		} = req.body;

		// Check if user already exists
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists with this email",
			});
		}

		// Validate organization and email domain
		console.log("=== Registration Validation ===");
		console.log("Email:", email);
		console.log("Organization:", organization);

		const organizationDoc = await Organization.findOne({
			name: organization,
			isActive: true,
		});

		console.log(
			"Found organization:",
			organizationDoc ? organizationDoc.name : "None"
		);
		console.log(
			"Organization domain:",
			organizationDoc ? organizationDoc.domain : "N/A"
		);

		if (!organizationDoc) {
			return res.status(400).json({
				success: false,
				message: "Invalid organization selected",
			});
		}

		// Extract domain from email and validate against organization domain
		const emailDomain = email.split("@")[1];
		console.log("Email domain:", emailDomain);
		console.log("Organization domain:", organizationDoc.domain);
		console.log(
			"Domains match:",
			emailDomain?.toLowerCase() === organizationDoc.domain.toLowerCase()
		);

		if (
			!emailDomain ||
			emailDomain.toLowerCase() !== organizationDoc.domain.toLowerCase()
		) {
			console.log("Domain validation failed");
			return res.status(400).json({
				success: false,
				message: `Email domain must be ${organizationDoc.domain} for ${organization}`,
				expectedDomain: organizationDoc.domain,
				providedDomain: emailDomain,
			});
		}

		console.log("Domain validation passed");

		// Create user
		const user = await User.create({
			fullName,
			email: email.toLowerCase(),
			password,
			organization,
			employeeId,
			contactDetails,
			linkedinProfile,
			bio,
			isVerified: false,
		});

		// Generate email verification token
		const verificationToken = user.getEmailVerificationToken();
		await user.save({ validateBeforeSave: false });

		try {
			// Send verification email
			await sendVerificationEmail(user.email, verificationToken, user.fullName);

			// Log registration attempt
			await AuditLog.logAction({
				user: user,
				action: "REGISTER",
				resourceType: "User",
				resourceId: user._id,
				resourceTitle: user.fullName,
				description: `User registered with organization: ${organization}`,
				req,
				status: "SUCCESS",
			});

			res.status(201).json({
				success: true,
				message:
					"Registration successful. Please check your email to verify your account.",
				data: {
					email: user.email,
					organization: user.organization,
					verificationSent: true,
				},
			});
		} catch (emailError) {
			console.error("Email sending failed:", emailError);

			// If email fails, still allow registration but notify user
			res.status(201).json({
				success: true,
				message:
					"Registration successful, but verification email could not be sent. Please contact administrator.",
				data: {
					email: user.email,
					organization: user.organization,
					verificationSent: false,
				},
			});
		}
	} catch (error) {
		console.error("Registration error:", error);

		res.status(500).json({
			success: false,
			message: "Registration failed",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
	try {
		const { token } = req.params;

		// Hash the token to match stored version
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		const user = await User.findOne({
			emailVerificationToken: hashedToken,
			emailVerificationExpire: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired verification token",
			});
		}

		// Verify the user
		user.isVerified = true;
		user.emailVerificationToken = undefined;
		user.emailVerificationExpire = undefined;
		await user.save();

		// Send welcome email
		try {
			await sendWelcomeEmail(user.email, user.fullName, user.organization);
		} catch (emailError) {
			console.error("Welcome email failed:", emailError);
		}

		// Log email verification
		await AuditLog.logAction({
			user: user,
			action: "VERIFY_EMAIL",
			resourceType: "User",
			resourceId: user._id,
			resourceTitle: user.fullName,
			description: "Email verified successfully",
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Email verified successfully. You can now login.",
			data: {
				email: user.email,
				verified: true,
			},
		});
	} catch (error) {
		console.error("Email verification error:", error);

		res.status(500).json({
			success: false,
			message: "Email verification failed",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
	try {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { email, password } = req.body;

		// Find user and include password for comparison
		const user = await User.findOne({ email: email.toLowerCase() }).select(
			"+password"
		);

		if (!user) {
			await AuditLog.logAction({
				user: null, // No valid user found
				userEmail: email, // Store the attempted email
				action: "LOGIN",
				resourceType: "User",
				description: "Failed login attempt - user not found",
				req,
				status: "FAILURE",
				errorMessage: "Invalid credentials",
			});

			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// Check password
		const isPasswordValid = await user.matchPassword(password);
		if (!isPasswordValid) {
			await AuditLog.logAction({
				user: user,
				action: "LOGIN",
				resourceType: "User",
				resourceId: user._id,
				resourceTitle: user.fullName,
				description: "Failed login attempt - invalid password",
				req,
				status: "FAILURE",
				errorMessage: "Invalid credentials",
			});

			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// Check if email is verified
		if (!user.isVerified) {
			return res.status(401).json({
				success: false,
				message: "Please verify your email before logging in",
				requiresVerification: true,
			});
		}

		// Check if account is active
		if (!user.isActive) {
			return res.status(401).json({
				success: false,
				message:
					"Your account has been deactivated. Please contact administrator.",
			});
		}

		// Update last login
		user.lastLogin = new Date();
		user.loginCount += 1;
		await user.save();

		// Log successful login
		await AuditLog.logAction({
			user: user,
			action: "LOGIN",
			resourceType: "User",
			resourceId: user._id,
			resourceTitle: user.fullName,
			description: "Successful login",
			req,
			status: "SUCCESS",
		});

		// Send token response
		sendTokenResponse(user, 200, res, "Login successful");
	} catch (error) {
		console.error("Login error:", error);

		res.status(500).json({
			success: false,
			message: "Login failed",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
	try {
		// Log logout action only if user exists
		if (req.user) {
			await AuditLog.logAction({
				user: req.user,
				action: "LOGOUT",
				resourceType: "User",
				resourceId: req.user._id,
				resourceTitle: req.user.fullName,
				description: "User logged out",
				req,
				status: "SUCCESS",
			});
		}

		// Clear cookies regardless of user state
		clearTokenCookies(res);

		res.status(200).json({
			success: true,
			message: "Logged out successfully",
		});
	} catch (error) {
		console.error("Logout error:", error);

		// Still clear cookies even if logging fails
		clearTokenCookies(res);

		res.status(200).json({
			success: true,
			message: "Logged out successfully",
		});
	}
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Get user error:", error);

		res.status(500).json({
			success: false,
			message: "Failed to get user data",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email: email.toLowerCase() });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "No user found with this email address",
			});
		}

		// Generate reset token
		const resetToken = user.getResetPasswordToken();
		await user.save({ validateBeforeSave: false });

		try {
			// Send password reset email
			await sendPasswordResetEmail(user.email, resetToken, user.fullName);

			// Log password reset request
			await AuditLog.logAction({
				user: user,
				action: "PASSWORD_RESET",
				resourceType: "User",
				resourceId: user._id,
				resourceTitle: user.fullName,
				description: "Password reset requested",
				req,
				status: "SUCCESS",
			});

			res.status(200).json({
				success: true,
				message: "Password reset email sent successfully",
			});
		} catch (emailError) {
			console.error("Password reset email failed:", emailError);

			// Clear reset token if email fails
			user.passwordResetToken = undefined;
			user.passwordResetExpire = undefined;
			await user.save({ validateBeforeSave: false });

			res.status(500).json({
				success: false,
				message: "Email could not be sent",
			});
		}
	} catch (error) {
		console.error("Forgot password error:", error);

		res.status(500).json({
			success: false,
			message: "Password reset request failed",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		// Hash the token to match stored version
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		const user = await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetExpire: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired reset token",
			});
		}

		// Set new password
		user.password = password;
		user.passwordResetToken = undefined;
		user.passwordResetExpire = undefined;
		await user.save();

		// Log password reset completion
		await AuditLog.logAction({
			user: user,
			action: "PASSWORD_RESET",
			resourceType: "User",
			resourceId: user._id,
			resourceTitle: user.fullName,
			description: "Password reset completed successfully",
			req,
			status: "SUCCESS",
		});

		// Send token response (auto-login after password reset)
		sendTokenResponse(user, 200, res, "Password reset successful");
	} catch (error) {
		console.error("Reset password error:", error);

		res.status(500).json({
			success: false,
			message: "Password reset failed",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
	try {
		const { fullName, employeeId, contactDetails, linkedinProfile, bio } =
			req.body;

		const fieldsToUpdate = {};

		if (fullName) fieldsToUpdate.fullName = fullName;
		if (employeeId) fieldsToUpdate.employeeId = employeeId;
		if (contactDetails) fieldsToUpdate.contactDetails = contactDetails;
		if (linkedinProfile) fieldsToUpdate.linkedinProfile = linkedinProfile;
		if (bio) fieldsToUpdate.bio = bio;

		const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
			new: true,
			runValidators: true,
		});

		// Log profile update
		await AuditLog.logAction({
			user: req.user,
			action: "UPDATE",
			resourceType: "User",
			resourceId: user._id,
			resourceTitle: user.fullName,
			description: "Profile updated",
			details: { updatedFields: Object.keys(fieldsToUpdate) },
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: user,
		});
	} catch (error) {
		console.error("Update profile error:", error);

		res.status(500).json({
			success: false,
			message: "Profile update failed",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		// Get user with password
		const user = await User.findById(req.user._id).select("+password");

		// Check current password
		const isCurrentPasswordValid = await user.matchPassword(currentPassword);
		if (!isCurrentPasswordValid) {
			return res.status(400).json({
				success: false,
				message: "Current password is incorrect",
			});
		}

		// Update password
		user.password = newPassword;
		await user.save();

		// Log password change
		await AuditLog.logAction({
			user: req.user,
			action: "UPDATE",
			resourceType: "User",
			resourceId: user._id,
			resourceTitle: user.fullName,
			description: "Password changed successfully",
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error("Change password error:", error);

		res.status(500).json({
			success: false,
			message: "Password change failed",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email: email.toLowerCase() });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "No user found with this email address",
			});
		}

		if (user.isVerified) {
			return res.status(400).json({
				success: false,
				message: "Email is already verified",
			});
		}

		// Generate new verification token
		const verificationToken = user.getEmailVerificationToken();
		await user.save({ validateBeforeSave: false });

		try {
			// Send verification email
			await sendVerificationEmail(user.email, verificationToken, user.fullName);

			res.status(200).json({
				success: true,
				message: "Verification email sent successfully",
			});
		} catch (emailError) {
			console.error("Resend verification email failed:", emailError);

			res.status(500).json({
				success: false,
				message: "Email could not be sent",
			});
		}
	} catch (error) {
		console.error("Resend verification error:", error);

		res.status(500).json({
			success: false,
			message: "Failed to resend verification email",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

module.exports = {
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
};
