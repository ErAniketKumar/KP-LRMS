const mongoose = require("mongoose");
const shortid = require("shortid");

const shortUrlSchema = new mongoose.Schema(
	{
		// Original URL
		originalUrl: {
			type: String,
			required: [true, "Original URL is required"],
		},

		// Short URL components
		shortCode: {
			type: String,
			required: true,
			minlength: [6, "Short code must be at least 6 characters"],
			maxlength: [10, "Short code cannot exceed 10 characters"],
		},

		// Custom domain (optional)
		customDomain: {
			type: String,
			default: process.env.FRONTEND_URL
				? process.env.FRONTEND_URL.replace(/^https?:\/\//, "")
				: "kp-ani-lrms.vercel.app",
		},

		// Metadata
		title: {
			type: String,
			maxlength: [200, "Title cannot exceed 200 characters"],
		},
		description: {
			type: String,
			maxlength: [500, "Description cannot exceed 500 characters"],
		},

		// Creator Information
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		// Settings
		isPublic: {
			type: Boolean,
			default: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},

		// Analytics
		clickCount: {
			type: Number,
			default: 0,
		},
		uniqueClicks: {
			type: Number,
			default: 0,
		},
		clicks: [
			{
				timestamp: {
					type: Date,
					default: Date.now,
				},
				ipAddress: String,
				userAgent: String,
				referer: String,
				country: String,
				city: String,
				device: String,
				browser: String,
				os: String,
			},
		],

		// Expiration
		expirationDate: Date,
		maxClicks: Number,

		// QR Code
		qrCodeUrl: String,

		// Password Protection
		isPasswordProtected: {
			type: Boolean,
			default: false,
		},
		password: String,

		// Tags and Categories
		tags: [
			{
				type: String,
				trim: true,
				lowercase: true,
			},
		],
		category: {
			type: String,
			enum: [
				"Bug Report",
				"Documentation",
				"Resource",
				"Credential",
				"Download",
				"Social",
				"Marketing",
				"Internal",
				"External",
				"Other",
			],
			default: "Other",
		},

		// Related Resources
		relatedResource: {
			resourceType: {
				type: String,
				enum: ["Link", "Document", "Credential"],
			},
			resourceId: {
				type: mongoose.Schema.Types.ObjectId,
				refPath: "relatedResource.resourceType",
			},
		},

		// UTM Parameters for tracking
		utmSource: String,
		utmMedium: String,
		utmCampaign: String,
		utmTerm: String,
		utmContent: String,
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes
shortUrlSchema.index({ shortCode: 1 }, { unique: true });
shortUrlSchema.index({ createdBy: 1 });
shortUrlSchema.index({ originalUrl: 1 });
shortUrlSchema.index({ isActive: 1 });
shortUrlSchema.index({ createdAt: -1 });
shortUrlSchema.index({ clickCount: -1 });

// Virtual for full short URL
shortUrlSchema.virtual("shortUrl").get(function () {
	const domain = process.env.FRONTEND_URL
		? process.env.FRONTEND_URL.replace(/^https?:\/\//, "")
		: this.customDomain && this.customDomain !== "rlms.short"
		? this.customDomain
		: "kp-ani-lrms.vercel.app";
	return `https://${domain}/s/${this.shortCode}`;
});

// Virtual to check if URL is expired
shortUrlSchema.virtual("isExpired").get(function () {
	if (!this.expirationDate) return false;
	return new Date() > this.expirationDate;
});

// Virtual to check if max clicks reached
shortUrlSchema.virtual("isMaxClicksReached").get(function () {
	if (!this.maxClicks) return false;
	return this.clickCount >= this.maxClicks;
});

// Virtual to check if URL is accessible
shortUrlSchema.virtual("isAccessible").get(function () {
	return this.isActive && !this.isExpired && !this.isMaxClicksReached;
});

// Pre-save middleware
shortUrlSchema.pre("save", function (next) {
	// Ensure original URL has protocol
	if (this.isModified("originalUrl") && !this.originalUrl.startsWith("http")) {
		this.originalUrl = "https://" + this.originalUrl;
	}

	// Generate custom short code if not provided
	if (this.isNew && !this.shortCode) {
		this.shortCode = shortid.generate().substring(0, 8);
	}

	next();
});

// Method to record a click
shortUrlSchema.methods.recordClick = function (clickData = {}) {
	const click = {
		timestamp: new Date(),
		ipAddress: clickData.ipAddress || "",
		userAgent: clickData.userAgent || "",
		referer: clickData.referer || "",
		country: clickData.country || "",
		city: clickData.city || "",
		device: clickData.device || "",
		browser: clickData.browser || "",
		os: clickData.os || "",
	};

	this.clicks.push(click);
	this.clickCount += 1;

	// Count unique clicks (simple implementation based on IP)
	const uniqueIPs = [...new Set(this.clicks.map((click) => click.ipAddress))];
	this.uniqueClicks = uniqueIPs.length;

	return this.save();
};

// Method to generate QR code URL
shortUrlSchema.methods.generateQRCode = function () {
	const qr = require("qrcode");

	return new Promise((resolve, reject) => {
		qr.toDataURL(this.shortUrl, (err, url) => {
			if (err) return reject(err);

			this.qrCodeUrl = url;
			this.save()
				.then(() => resolve(url))
				.catch(reject);
		});
	});
};

// Static method to find popular URLs
shortUrlSchema.statics.findPopular = function (limit = 10) {
	return this.find({ isActive: true })
		.sort({ clickCount: -1 })
		.limit(limit)
		.populate("createdBy", "fullName");
};

// Static method to get analytics
shortUrlSchema.statics.getAnalytics = function (userId = null, days = 30) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const matchStage = {
		createdAt: { $gte: startDate },
	};

	if (userId) {
		matchStage.createdBy = mongoose.Types.ObjectId(userId);
	}

	return this.aggregate([
		{ $match: matchStage },
		{ $unwind: "$clicks" },
		{
			$group: {
				_id: {
					$dateToString: {
						format: "%Y-%m-%d",
						date: "$clicks.timestamp",
					},
				},
				totalClicks: { $sum: 1 },
				uniqueUrls: { $addToSet: "$_id" },
			},
		},
		{
			$project: {
				date: "$_id",
				totalClicks: 1,
				uniqueUrlCount: { $size: "$uniqueUrls" },
			},
		},
		{ $sort: { date: 1 } },
	]);
};

// Static method to clean expired URLs
shortUrlSchema.statics.cleanExpired = function () {
	return this.updateMany(
		{
			$or: [
				{ expirationDate: { $lt: new Date() } },
				{ $expr: { $gte: ["$clickCount", "$maxClicks"] } },
			],
		},
		{ $set: { isActive: false } }
	);
};

module.exports = mongoose.model("ShortUrl", shortUrlSchema);
