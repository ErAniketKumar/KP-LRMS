const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
	{
		// Basic Information
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			maxlength: [200, "Title cannot exceed 200 characters"],
		},
		url: {
			type: String,
			required: [true, "URL is required"],
			/*
			validate: {
				validator: function (v) {
					return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
						v
					);
				},
				message: "Please provide a valid URL",
			},
			*/
		},
		description: {
			type: String,
			maxlength: [1000, "Description cannot exceed 1000 characters"],
		},

		// Categorization
		category: {
			type: String,
			required: false,
			default: "Other",
			maxlength: [50, "Category cannot exceed 50 characters"],
		},
		project: {
			type: String,
			required: false,
			default: "General",
			maxlength: [50, "Project cannot exceed 50 characters"],
		},
		tags: [
			{
				type: String,
				trim: true,
				lowercase: true,
			},
		],

		// Status and Visibility
		status: {
			type: String,
			enum: ["active", "archived", "pending_approval"],
			default: "active",
		},
		// Legacy flag retained for backward compatibility
		isPublic: {
			type: Boolean,
			default: true,
		},
		visibility: {
			type: String,
			enum: ["public", "organization", "team", "private"],
			default: "public",
		},
		organization: {
			type: String,
		},

		// Metadata
		addedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		approvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},

		// Link Properties
		isYouTubeLink: {
			type: Boolean,
			default: false,
		},
		youtubeVideoId: String,

		// Expiration
		expirationDate: Date,
		isExpired: {
			type: Boolean,
			default: false,
		},

		// Analytics
		clickCount: {
			type: Number,
			default: 0,
		},
		lastClicked: Date,

		// Additional Properties
		priority: {
			type: String,
			enum: ["high", "medium", "low"],
			default: "medium",
		},
		notes: String,
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes
linkSchema.index({ addedBy: 1 });
linkSchema.index({ project: 1 });
linkSchema.index({ category: 1 });
linkSchema.index({ status: 1 });
linkSchema.index({ tags: 1 });
linkSchema.index({ createdAt: -1 });
linkSchema.index({ title: "text", description: "text" });

// Virtual to check if link is expired
linkSchema.virtual("expired").get(function () {
	if (!this.expirationDate) return false;
	return new Date() > this.expirationDate;
});

// Pre-save middleware to detect YouTube links
linkSchema.pre("save", function (next) {
	// Ensure visibility/organization defaults
	if (!this.visibility) {
		this.visibility = this.isPublic ? "public" : "private";
	}

	if (this.isModified("url")) {
		const youtubeRegex =
			/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
		const match = this.url.match(youtubeRegex);

		if (match) {
			this.isYouTubeLink = true;
			this.youtubeVideoId = match[1];
			if (this.category === "Other") {
				this.category = "YouTube Video";
			}
		} else {
			this.isYouTubeLink = false;
			this.youtubeVideoId = undefined;
		}
	}

	// Check expiration
	if (this.expirationDate && new Date() > this.expirationDate) {
		this.isExpired = true;
		this.status = "archived";
	}

	next();
});

// Method to increment click count
linkSchema.methods.incrementClick = function () {
	this.clickCount += 1;
	this.lastClicked = new Date();
	return this.save();
};

// Static method to find popular links
linkSchema.statics.findPopular = function (limit = 10) {
	return this.find({ status: "active" })
		.sort({ clickCount: -1 })
		.limit(limit)
		.populate("addedBy", "fullName");
};

// Static method to find recent links
linkSchema.statics.findRecent = function (limit = 10) {
	return this.find({ status: "active" })
		.sort({ createdAt: -1 })
		.limit(limit)
		.populate("addedBy", "fullName");
};

module.exports = mongoose.model("Link", linkSchema);
