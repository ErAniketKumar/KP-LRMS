const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
	{
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		organization: {
			type: String,
			index: true,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		resourceType: {
			type: String,
			enum: ["Link", "Document", "Credential"],
			required: true,
			index: true,
		},
		resourceId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		title: {
			type: String,
			required: true,
			maxlength: 140,
		},
		message: {
			type: String,
			required: true,
			maxlength: 500,
		},
		isRead: {
			type: Boolean,
			default: false,
			index: true,
		},
		readAt: Date,
	},
	{ timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
