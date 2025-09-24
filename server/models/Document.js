const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
	{
		// Basic Information
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			maxlength: [200, "Title cannot exceed 200 characters"],
		},
		description: {
			type: String,
			maxlength: [1000, "Description cannot exceed 1000 characters"],
		},

		// File Information (supports multiple files)
		files: [
			{
				fileName: {
					type: String,
					required: true,
				},
				originalName: String,
				fileSize: {
					type: Number,
					required: true,
				},
				mimeType: {
					type: String,
					required: true,
				},
				fileExtension: String,
				fileUrl: {
					type: String,
					required: true,
				},
				cloudinaryPublicId: String,
				thumbnailUrl: String,
				uploadedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		// Legacy single file support (for backward compatibility)
		fileName: {
			type: String,
		},
		originalName: String,
		fileSize: {
			type: Number,
		},
		mimeType: {
			type: String,
		},
		fileExtension: String,

		// Storage Information
		storageType: {
			type: String,
			enum: ["cloudinary", "local", "google_drive", "s3"],
			default: "cloudinary",
		},
		fileUrl: {
			type: String,
		},
		cloudinaryPublicId: String, // For Cloudinary storage
		thumbnailUrl: String, // For image/video previews

		// Document type to differentiate between single and multiple file documents
		documentType: {
			type: String,
			enum: ["single", "multiple"],
			default: "single",
		},
		// Total size of all files (for multiple file documents)
		totalFileSize: {
			type: Number,
			default: 0,
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
		tags: [
			{
				type: String,
				trim: true,
				lowercase: true,
			},
		],

		// Version Control
		version: {
			type: String,
			default: "1.0",
		},
		parentDocument: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Document",
		},
		versions: [
			{
				version: String,
				fileUrl: String,
				uploadedAt: Date,
				uploadedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				changeLog: String,
			},
		],

		// Access Control
		visibility: {
			type: String,
			enum: ["public", "organization", "team", "private"],
			default: "public",
		},
		organization: {
			type: String,
		},
		accessList: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				permission: {
					type: String,
					enum: ["view", "download", "edit"],
					default: "view",
				},
			},
		],

		// Status
		status: {
			type: String,
			enum: ["active", "archived", "pending_approval", "rejected"],
			default: "active",
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

		// Analytics
		downloadCount: {
			type: Number,
			default: 0,
		},
		viewCount: {
			type: Number,
			default: 0,
		},
		lastAccessed: Date,

		// Document Properties
		isEncrypted: {
			type: Boolean,
			default: false,
		},
		encryptionKey: String, // Store encrypted

		// OCR and Search
		extractedText: String, // For searchable content
		isOCRProcessed: {
			type: Boolean,
			default: false,
		},

		// Expiration
		expirationDate: Date,

		// Additional Properties
		priority: {
			type: String,
			enum: ["high", "medium", "low"],
			default: "medium",
		},
		notes: String,

		// External Links
		externalLinks: [
			{
				title: String,
				url: String,
				description: String,
			},
		],
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes
documentSchema.index({ addedBy: 1 });
documentSchema.index({ project: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({
	title: "text",
	description: "text",
	extractedText: "text",
});
documentSchema.index({ mimeType: 1 });
documentSchema.index({ fileSize: 1 });

// Virtual to get file size in human readable format
documentSchema.virtual("fileSizeFormatted").get(function () {
	const bytes = this.fileSize;
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Virtual to check if document is expired
documentSchema.virtual("isExpired").get(function () {
	if (!this.expirationDate) return false;
	return new Date() > this.expirationDate;
});

// Virtual to check if document is an image
documentSchema.virtual("isImage").get(function () {
	return this.mimeType && this.mimeType.startsWith("image/");
});

// Virtual to check if document is a video
documentSchema.virtual("isVideo").get(function () {
	return this.mimeType && this.mimeType.startsWith("video/");
});

// Virtual to check if document is a PDF
documentSchema.virtual("isPDF").get(function () {
	return this.mimeType === "application/pdf";
});

// Pre-save middleware
documentSchema.pre("save", function (next) {
	// Set file extension from originalName or fileName
	if (this.originalName && !this.fileExtension) {
		this.fileExtension = this.originalName.split(".").pop().toLowerCase();
	}

	// Auto-categorize based on file type
	if (this.isModified("mimeType") && this.category === "Other") {
		if (this.mimeType.startsWith("image/")) {
			this.category = "Image";
		} else if (this.mimeType.startsWith("video/")) {
			this.category = "Video";
		} else if (this.mimeType === "application/pdf") {
			this.category = "Technical Documentation";
		} else if (
			this.mimeType.includes("spreadsheet") ||
			this.mimeType.includes("excel")
		) {
			this.category = "Spreadsheet";
		} else if (
			this.mimeType.includes("presentation") ||
			this.mimeType.includes("powerpoint")
		) {
			this.category = "Presentation";
		}
	}

	next();
});

// Method to increment download count
documentSchema.methods.incrementDownload = function () {
	this.downloadCount += 1;
	this.lastAccessed = new Date();
	return this.save();
};

// Method to increment view count
documentSchema.methods.incrementView = function () {
	this.viewCount += 1;
	this.lastAccessed = new Date();
	return this.save();
};

// Method to add new version
documentSchema.methods.addVersion = function (versionData) {
	this.versions.push({
		version: versionData.version,
		fileUrl: versionData.fileUrl,
		uploadedAt: new Date(),
		uploadedBy: versionData.uploadedBy,
		changeLog: versionData.changeLog,
	});

	this.version = versionData.version;
	this.fileUrl = versionData.fileUrl;

	return this.save();
};

// Method to grant access to user
documentSchema.methods.grantAccess = function (userId, permission = "view") {
	const existingAccess = this.accessList.find(
		(access) => access.user.toString() === userId.toString()
	);

	if (!existingAccess) {
		this.accessList.push({
			user: userId,
			permission,
		});
	} else {
		existingAccess.permission = permission;
	}

	return this.save();
};

// Static method to find popular documents
documentSchema.statics.findPopular = function (limit = 10) {
	return this.find({ status: "active" })
		.sort({ downloadCount: -1, viewCount: -1 })
		.limit(limit)
		.populate("addedBy", "fullName");
};

// Static method to find recent documents
documentSchema.statics.findRecent = function (limit = 10) {
	return this.find({ status: "active" })
		.sort({ createdAt: -1 })
		.limit(limit)
		.populate("addedBy", "fullName");
};

// Static method to find expiring documents
documentSchema.statics.findExpiring = function (days = 7) {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + days);

	return this.find({
		expirationDate: { $lte: futureDate, $gte: new Date() },
		status: "active",
	});
};

module.exports = mongoose.model("Document", documentSchema);
