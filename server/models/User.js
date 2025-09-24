const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
	{
		// Basic Information
		fullName: {
			type: String,
			required: [true, "Full name is required"],
			trim: true,
			maxlength: [100, "Full name cannot exceed 100 characters"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please provide a valid email",
			],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
			select: false,
		},

		// Organization Information
		organization: {
			type: String,
			required: [true, "Organization is required"],
			// Remove hardcoded enum - organization names are now dynamic from database
		},

		// Profile Information
		employeeId: {
			type: String,
			trim: true,
			maxlength: [20, "Employee ID cannot exceed 20 characters"],
		},
		contactDetails: {
			phone: {
				type: String,
				match: [/^\+?[\d\s-()]+$/, "Please provide a valid phone number"],
			},
			address: {
				type: String,
				maxlength: [200, "Address cannot exceed 200 characters"],
			},
		},
		linkedinProfile: {
			type: String,
			validate: {
				validator: function (v) {
					return (
						!v || /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(v)
					);
				},
				message: "Please provide a valid LinkedIn profile URL",
			},
		},
		bio: {
			type: String,
			maxlength: [500, "Bio cannot exceed 500 characters"],
		},
		profilePicture: {
			type: String,
			default: "",
		},

		// Account Status
		role: {
			type: String,
			enum: ["admin", "contributor", "viewer"],
			default: "contributor",
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},

		// Verification
		emailVerificationToken: String,
		emailVerificationExpire: Date,
		passwordResetToken: String,
		passwordResetExpire: Date,

		// Activity Tracking
		lastLogin: Date,
		loginCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes
userSchema.index({ organization: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });

// Virtual for full profile completeness
userSchema.virtual("profileCompleteness").get(function () {
	let score = 0;
	const fields = [
		"fullName",
		"email",
		"organization",
		"employeeId",
		"contactDetails.phone",
		"bio",
	];
	fields.forEach((field) => {
		if (this.get(field)) score += 1;
	});
	return Math.round((score / fields.length) * 100);
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
	const crypto = require("crypto");
	const resetToken = crypto.randomBytes(20).toString("hex");

	this.emailVerificationToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");

	this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

	return resetToken;
};

// Method to generate password reset token
userSchema.methods.getResetPasswordToken = function () {
	const crypto = require("crypto");
	const resetToken = crypto.randomBytes(20).toString("hex");

	this.passwordResetToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");

	this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

	return resetToken;
};

module.exports = mongoose.model("User", userSchema);
