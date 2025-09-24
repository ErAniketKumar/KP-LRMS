const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Organization name is required"],
			trim: true,
			maxLength: [100, "Organization name cannot exceed 100 characters"],
		},
		domain: {
			type: String,
			required: [true, "Domain is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [
				/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
				"Please provide a valid domain (e.g., company.com)",
			],
		},
		contactInfo: {
			type: String,
			trim: true,
			maxLength: [500, "Contact information cannot exceed 500 characters"],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		// Track who created/modified the organization
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for efficient querying (domain already has unique index from schema definition)
organizationSchema.index({ name: 1 });
organizationSchema.index({ isActive: 1 });

// Pre-save middleware to normalize domain
organizationSchema.pre("save", function (next) {
	if (this.domain) {
		// Normalize domain: remove @ symbol, lowercase, trim whitespace
		this.domain = this.domain
			.toLowerCase()
			.trim()
			.replace(/^@+/, ""); // Remove leading @ symbols
	}
	next();
});

// Instance method to get user count for this organization
organizationSchema.methods.getUserCount = function () {
	return mongoose.model("User").countDocuments({ organization: this.name });
};

// Static method to find by domain
organizationSchema.statics.findByDomain = function (domain) {
	return this.findOne({ domain: domain.toLowerCase(), isActive: true });
};

// Static method to get all active organizations
organizationSchema.statics.getActive = function () {
	return this.find({ isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.model("Organization", organizationSchema);
