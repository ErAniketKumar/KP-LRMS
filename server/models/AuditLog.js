const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
	{
		// User Information
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false, // Allow null for unknown users (failed login attempts)
		},
		userEmail: {
			type: String,
			required: true,
		},

		// Action Information
		action: {
			type: String,
			required: true,
			enum: [
				"CREATE",
				"READ",
				"UPDATE",
				"DELETE",
				"LOGIN",
				"LOGOUT",
				"REGISTER",
				"VERIFY_EMAIL",
				"PASSWORD_RESET",
				"APPROVE",
				"REJECT",
				"SHARE",
				"DOWNLOAD",
				"EXPORT",
				"UPLOAD",
			],
		},

		// Resource Information
		resourceType: {
			type: String,
			required: true,
			enum: [
				"User",
				"Link",
				"Credential",
				"Document",
				"Todo",
				"ShortUrl",
				"Organization",
				"System",
			],
		},
		resourceId: {
			type: mongoose.Schema.Types.ObjectId,
		},
		resourceTitle: String,

		// Details
		description: {
			type: String,
			required: true,
		},
		details: {
			type: mongoose.Schema.Types.Mixed, // Store additional context as needed
		},

		// Request Information
		ipAddress: String,
		userAgent: String,
		endpoint: String,
		method: String,

		// Status and Results
		status: {
			type: String,
			enum: ["SUCCESS", "FAILURE", "WARNING"],
			default: "SUCCESS",
		},
		errorMessage: String,

		// Metadata
		sessionId: String,
		organizaton: String,
		project: String,

		// Response Information
		responseTime: Number, // in milliseconds
		dataSize: Number, // in bytes
	},
	{
		timestamps: true,
		// Keep audit logs forever by default
		expires: null,
	}
);

// Indexes for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ ipAddress: 1 });
auditLogSchema.index({ status: 1 });

// Static method to log an action
auditLogSchema.statics.logAction = function (options) {
	const {
		user,
		action,
		resourceType,
		resourceId = null,
		resourceTitle = "",
		description,
		details = {},
		req = null,
		status = "SUCCESS",
		errorMessage = null,
		responseTime = null,
	} = options;

	const logEntry = {
		user: user._id || (typeof user === "string" ? null : user),
		userEmail: user.email || user?.email || "system",
		action,
		resourceType,
		resourceId,
		resourceTitle,
		description,
		details,
		status,
		errorMessage,
		responseTime,
		organizaton: user?.organization || "",
		sessionId: req?.sessionID || "",
	};

	// Extract request information if available
	if (req) {
		logEntry.ipAddress = req.ip || req.connection.remoteAddress;
		logEntry.userAgent = req.get("User-Agent");
		logEntry.endpoint = req.originalUrl;
		logEntry.method = req.method;
	}

	return this.create(logEntry);
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function (userId, limit = 50) {
	return this.find({ user: userId })
		.sort({ createdAt: -1 })
		.limit(limit)
		.select("-details -userAgent");
};

// Static method to get resource history
auditLogSchema.statics.getResourceHistory = function (
	resourceType,
	resourceId,
	limit = 20
) {
	return this.find({ resourceType, resourceId })
		.populate("user", "fullName email")
		.sort({ createdAt: -1 })
		.limit(limit);
};

// Static method to get security alerts
auditLogSchema.statics.getSecurityAlerts = function (hours = 24) {
	const since = new Date(Date.now() - hours * 60 * 60 * 1000);

	return this.find({
		createdAt: { $gte: since },
		$or: [
			{ status: "FAILURE" },
			{ action: { $in: ["PASSWORD_RESET", "LOGIN"] }, status: "FAILURE" },
		],
	})
		.populate("user", "fullName email")
		.sort({ createdAt: -1 });
};

// Static method for analytics
auditLogSchema.statics.getAnalytics = function (startDate, endDate) {
	return this.aggregate([
		{
			$match: {
				createdAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: {
					action: "$action",
					resourceType: "$resourceType",
					date: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$createdAt",
						},
					},
				},
				count: { $sum: 1 },
				uniqueUsers: { $addToSet: "$user" },
			},
		},
		{
			$project: {
				_id: 1,
				count: 1,
				uniqueUserCount: { $size: "$uniqueUsers" },
			},
		},
		{
			$sort: { "_id.date": -1, count: -1 },
		},
	]);
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
