const mongoose = require("mongoose");
const crypto = require("crypto");

// Ensure the encryption key is 32 bytes for aes-256-cbc
const ENCRYPTION_KEY = crypto
	.createHash("sha256")
	.update(String(process.env.CREDENTIAL_ENCRYPTION_KEY))
	.digest("base64")
	.substr(0, 32);
const ALGORITHM = "aes-256-cbc";

const credentialSchema = new mongoose.Schema(
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
			trim: true,
		},
		description: {
			type: String,
			maxlength: [1000, "Description cannot exceed 1000 characters"],
		},

		// Credentials
		username: {
			type: String,
			required: [true, "Username is required"],
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
		},
		password2: {
			type: String,
			// For cases where there might be a secondary password
		},

		// Categorization
		category: {
			type: String,
			default: "Other",
			maxlength: [50, "Category cannot exceed 50 characters"],
		},
		project: {
			type: String,
			default: "General",
			maxlength: [50, "Project cannot exceed 50 characters"],
		},
		environment: {
			type: String,
			enum: ["development", "testing", "staging", "production", "other"],
			default: "other",
		},

		// Security and Access
		accessLevel: {
			type: String,
			enum: ["read-only", "read-write", "admin", "root"],
			default: "read-only",
		},
		isEncrypted: {
			type: Boolean,
			default: true,
		},

		// Status and Visibility
		status: {
			type: String,
			enum: ["active", "expired", "suspended", "pending_approval"],
			default: "active",
		},
		visibility: {
			type: String,
			enum: ["public", "organization", "team", "private"],
			default: "private",
		},
		organization: {
			type: String,
		},
		isShared: {
			type: Boolean,
			default: false,
		},
		sharedWith: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				sharedAt: {
					type: Date,
					default: Date.now,
				},
				permissions: {
					type: String,
					enum: ["view", "copy"],
					default: "view",
				},
			},
		],

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
		lastUsed: Date,

		// Expiration and Rotation
		expirationDate: Date,
		passwordLastChanged: {
			type: Date,
			default: Date.now,
		},
		rotationInterval: {
			type: Number, // in days
			default: 90,
		},

		// Additional Information
		notes: String,
		additionalInfo: {
			server: String,
			port: Number,
			database: String,
			schema: String,
		},

		// Security Questions (if applicable)
		securityQuestions: [
			{
				question: String,
				answer: String, // This should also be encrypted
			},
		],
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: function (doc, ret) {
				// Don't return actual passwords in JSON
				delete ret.password;
				delete ret.password2;
				delete ret.securityQuestions;
				return ret;
			},
		},
		toObject: { virtuals: true },
	}
);

// Indexes
credentialSchema.index({ addedBy: 1 });
credentialSchema.index({ project: 1 });
credentialSchema.index({ category: 1 });
credentialSchema.index({ status: 1 });
credentialSchema.index({ environment: 1 });
credentialSchema.index({ createdAt: -1 });
credentialSchema.index({ title: "text", description: "text" });
credentialSchema.index({ visibility: 1, status: 1 });
credentialSchema.index({ organization: 1 });

// Virtual to check if credentials need rotation
credentialSchema.virtual("needsRotation").get(function () {
	if (!this.rotationInterval) return false;
	const daysSinceLastChange =
		(Date.now() - this.passwordLastChanged) / (1000 * 60 * 60 * 24);
	return daysSinceLastChange >= this.rotationInterval;
});

// Virtual to check if credentials are expired
credentialSchema.virtual("isExpired").get(function () {
	if (!this.expirationDate) return false;
	return new Date() > this.expirationDate;
});

// Pre-save middleware to encrypt passwords
credentialSchema.pre("save", function (next) {
	if (this.isModified("password") && this.password) {
		this.password = encrypt(this.password);
	}
	if (this.isModified("password2") && this.password2) {
		this.password2 = encrypt(this.password2);
	}

	// Encrypt security question answers
	if (this.isModified("securityQuestions") && this.securityQuestions) {
		this.securityQuestions = this.securityQuestions.map((sq) => ({
			...sq,
			answer: encrypt(sq.answer),
		}));
	}

	next();
});

// Method to decrypt password (for authorized access)
credentialSchema.methods.getDecryptedPassword = function () {
	return decrypt(this.password);
};

credentialSchema.methods.getDecryptedPassword2 = function () {
	return this.password2 ? decrypt(this.password2) : null;
};

// Method to update last used timestamp
credentialSchema.methods.markAsUsed = function () {
	this.lastUsed = new Date();
	return this.save();
};

// Method to share credential with user
credentialSchema.methods.shareWith = function (userId, permissions = "view") {
	const existingShare = this.sharedWith.find(
		(share) => share.user.toString() === userId.toString()
	);

	if (!existingShare) {
		this.sharedWith.push({
			user: userId,
			permissions,
			sharedAt: new Date(),
		});
	} else {
		existingShare.permissions = permissions;
		existingShare.sharedAt = new Date();
	}

	return this.save();
};

// Static method to find expiring credentials
credentialSchema.statics.findExpiring = function (days = 7) {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + days);

	return this.find({
		expirationDate: { $lte: futureDate, $gte: new Date() },
		status: "active",
	});
};

// Encryption helper functions
function encrypt(text) {
	if (!text) return text;
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
	if (!text) return text;
	const textParts = text.split(":");
	const iv = Buffer.from(textParts.shift(), "hex");
	const encryptedText = textParts.join(":");
	const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
	let decrypted = decipher.update(encryptedText, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

module.exports = mongoose.model("Credential", credentialSchema);
