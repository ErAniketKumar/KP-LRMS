const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Middleware to protect routes
const protect = async (req, res, next) => {
	let token;

	try {
		console.log("=== Auth Middleware Debug ===");
		console.log("Method:", req.method);
		console.log("URL:", req.url);
		console.log(
			"Headers:",
			req.headers.authorization ? "Bearer token present" : "No auth header"
		);

		// Check for token in header
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		}
		// Also check for token in query params (for file downloads/previews)
		else if (req.query.token) {
			token = req.query.token;
		}

		if (!token) {
			console.log("No token found in request");
			return res.status(401).json({
				success: false,
				message: "Access denied. No token provided.",
			});
		}

		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log("Token decoded successfully, user ID:", decoded.id);

		// Get user from database
		const user = await User.findById(decoded.id).select("-password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Token invalid. User not found.",
			});
		}

		if (!user.isVerified) {
			return res.status(401).json({
				success: false,
				message: "Email not verified. Please verify your email.",
			});
		}

		if (!user.isActive) {
			return res.status(401).json({
				success: false,
				message: "Account deactivated. Please contact administrator.",
			});
		}

		// Add user to request
		req.user = user;
		next();
	} catch (error) {
		console.error("Auth middleware error:", error);

		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({
				success: false,
				message: "Invalid token",
			});
		}

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				message: "Token expired",
			});
		}

		res.status(500).json({
			success: false,
			message: "Server error in authentication",
		});
	}
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
	return (req, res, next) => {
		console.log("=== Authorization Debug ===");
		console.log("Required roles:", roles);
		console.log("User exists:", !!req.user);
		console.log("User role:", req.user ? req.user.role : "No user");
		console.log("User email:", req.user ? req.user.email : "No user");

		if (!req.user) {
			console.log("Authorization failed: User not authenticated");
			return res.status(401).json({
				success: false,
				message: "User not authenticated",
			});
		}

		if (!roles.includes(req.user.role)) {
			console.log("Authorization failed: Role not allowed");
			return res.status(403).json({
				success: false,
				message: `Role ${req.user.role} is not authorized to access this resource`,
			});
		}

		console.log("Authorization successful");
		next();
	};
};

// Middleware to check resource ownership
const checkOwnership = (Model, paramName = "id") => {
	return async (req, res, next) => {
		try {
			const resourceId = req.params[paramName];
			const resource = await Model.findById(resourceId);

			if (!resource) {
				return res.status(404).json({
					success: false,
					message: "Resource not found",
				});
			}

			// Admin can access everything
			if (req.user.role === "admin") {
				req.resource = resource;
				return next();
			}

			// Check if user owns the resource
			if (
				resource.addedBy &&
				resource.addedBy.toString() !== req.user._id.toString()
			) {
				return res.status(403).json({
					success: false,
					message: "Access denied. You can only access your own resources.",
				});
			}

			req.resource = resource;
			next();
		} catch (error) {
			console.error("Ownership check error:", error);
			res.status(500).json({
				success: false,
				message: "Server error in ownership check",
			});
		}
	};
};

// Middleware to validate organization domain dynamically
const validateDomain = async (req, res, next) => {
	const { email, organization } = req.body;

	if (!email || !organization) {
		return next();
	}

	try {
		console.log("=== validateDomain middleware ===");
		console.log("Email:", email);
		console.log("Organization:", organization);

		const emailDomain = email.split("@")[1]?.toLowerCase();
		console.log("Email domain:", emailDomain);

		// Find organization in database
		const Organization = require("../models/Organization");
		const orgDoc = await Organization.findOne({
			name: organization,
			isActive: true,
		});

		if (!orgDoc) {
			console.log("Organization not found in database");
			return res.status(400).json({
				success: false,
				message: `Organization ${organization} not found`,
			});
		}

		console.log("Found organization domain:", orgDoc.domain);

		// Check if email domain matches organization domain
		if (emailDomain !== orgDoc.domain.toLowerCase()) {
			console.log("Domain mismatch");
			return res.status(400).json({
				success: false,
				message: `Email domain ${emailDomain} is not valid for organization ${organization}. Expected: ${orgDoc.domain}`,
			});
		}

		console.log("Domain validation passed");
		next();
	} catch (error) {
		console.error("Error in validateDomain middleware:", error);
		return res.status(500).json({
			success: false,
			message: "Server error in domain validation",
		});
	}
};

// Middleware to log activities
const auditLog = (action, resourceType, getResourceInfo = null) => {
	return async (req, res, next) => {
		const originalSend = res.send;
		const startTime = Date.now();

		res.send = function (data) {
			// Calculate response time
			const responseTime = Date.now() - startTime;

			// Determine status
			const status = res.statusCode < 400 ? "SUCCESS" : "FAILURE";

			// Get resource information
			let resourceId = null;
			let resourceTitle = "";
			let description = action;

			if (getResourceInfo && typeof getResourceInfo === "function") {
				try {
					const resourceInfo = getResourceInfo(req, res);
					resourceId = resourceInfo.resourceId;
					resourceTitle = resourceInfo.resourceTitle;
					description = resourceInfo.description || action;
				} catch (error) {
					console.error("Error getting resource info for audit:", error);
				}
			} else if (req.resource) {
				resourceId = req.resource._id;
				resourceTitle = req.resource.title || req.resource.fullName || "";
			}

			// Log the action
			if (req.user) {
				AuditLog.logAction({
					user: req.user,
					action,
					resourceType,
					resourceId,
					resourceTitle,
					description,
					details: {
						method: req.method,
						url: req.originalUrl,
						params: req.params,
						query: req.query,
						body: sanitizeBody(req.body),
					},
					req,
					status,
					responseTime,
				}).catch((error) => {
					console.error("Error logging audit action:", error);
				});
			}

			originalSend.call(this, data);
		};

		next();
	};
};

// Helper function to sanitize request body for logging
const sanitizeBody = (body) => {
	const sanitized = { ...body };

	// Remove sensitive fields
	delete sanitized.password;
	delete sanitized.password2;
	delete sanitized.confirmPassword;
	delete sanitized.currentPassword;
	delete sanitized.newPassword;

	return sanitized;
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
	let token;

	try {
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];

			if (token) {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				const user = await User.findById(decoded.id).select("-password");

				if (user && user.isVerified && user.isActive) {
					req.user = user;
				}
			}
		}
	} catch (error) {
		// Silently fail for optional auth
		console.log("Optional auth failed:", error.message);
	}

	next();
};

module.exports = {
	protect,
	authorize,
	checkOwnership,
	validateDomain,
	auditLog,
	optionalAuth,
};
