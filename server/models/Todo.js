const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
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

		// Task Properties
		priority: {
			type: String,
			enum: ["high", "medium", "low"],
			default: "medium",
		},
		status: {
			type: String,
			enum: ["to-do", "in-progress", "completed", "cancelled"],
			default: "to-do",
		},
		category: {
			type: String,
			default: "General Task",
			maxlength: [50, "Category cannot exceed 50 characters"],
		},

		// Project and Organization
		project: {
			type: String,
			default: "General",
			maxlength: [50, "Project cannot exceed 50 characters"],
		},

		// Assignment and Ownership
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		// Time Management
		dueDate: Date,
		estimatedTime: {
			type: Number, // in minutes
			min: [1, "Estimated time must be at least 1 minute"],
		},
		actualTime: {
			type: Number, // in minutes
			default: 0,
		},
		startedAt: Date,
		completedAt: Date,

		// Reminders
		reminderDate: Date,
		reminderSent: {
			type: Boolean,
			default: false,
		},

		// Related Resources
		relatedResources: [
			{
				resourceType: {
					type: String,
					enum: ["link", "credential", "document", "user"],
				},
				resourceId: {
					type: mongoose.Schema.Types.ObjectId,
					refPath: "relatedResources.resourceType",
				},
				relationship: {
					type: String,
					enum: ["related_to", "depends_on", "blocks", "duplicate_of"],
					default: "related_to",
				},
			},
		],

		// Checklist
		checklist: [
			{
				item: {
					type: String,
					required: true,
				},
				completed: {
					type: Boolean,
					default: false,
				},
				completedAt: Date,
				completedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			},
		],

		// Comments and Updates
		comments: [
			{
				text: {
					type: String,
					required: true,
					maxlength: [500, "Comment cannot exceed 500 characters"],
				},
				author: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],

		// Labels and Tags
		labels: [
			{
				name: {
					type: String,
					required: true,
				},
				color: {
					type: String,
					default: "#gray",
				},
			},
		],
		tags: [
			{
				type: String,
				trim: true,
				lowercase: true,
			},
		],

		// File Attachments
		attachments: [
			{
				fileName: String,
				fileUrl: String,
				fileSize: Number,
				uploadedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				uploadedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],

		// Recurring Tasks
		isRecurring: {
			type: Boolean,
			default: false,
		},
		recurringPattern: {
			type: {
				type: String,
				enum: ["daily", "weekly", "monthly", "yearly"],
			},
			interval: {
				type: Number,
				min: 1,
			},
			endDate: Date,
		},
		parentTodo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Todo",
		},

		// Progress Tracking
		progressPercentage: {
			type: Number,
			min: 0,
			max: 100,
			default: 0,
		},

		// Notification Settings
		notifyAssignee: {
			type: Boolean,
			default: true,
		},
		notifyCreator: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes
todoSchema.index({ assignedTo: 1 });
todoSchema.index({ createdBy: 1 });
todoSchema.index({ project: 1 });
todoSchema.index({ status: 1 });
todoSchema.index({ priority: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ createdAt: -1 });
todoSchema.index({ title: "text", description: "text" });

// Virtual to check if task is overdue
todoSchema.virtual("isOverdue").get(function () {
	if (
		!this.dueDate ||
		this.status === "completed" ||
		this.status === "cancelled"
	) {
		return false;
	}
	return new Date() > this.dueDate;
});

// Virtual to calculate completion percentage based on checklist
todoSchema.virtual("checklistProgress").get(function () {
	if (!this.checklist || this.checklist.length === 0) return 0;

	const completedItems = this.checklist.filter((item) => item.completed).length;
	return Math.round((completedItems / this.checklist.length) * 100);
});

// Virtual to get time spent
todoSchema.virtual("timeSpent").get(function () {
	if (this.status === "completed" && this.completedAt && this.startedAt) {
		return Math.round((this.completedAt - this.startedAt) / (1000 * 60)); // in minutes
	}
	return this.actualTime;
});

// Pre-save middleware
todoSchema.pre("save", function (next) {
	// Auto-set started date when status changes to in-progress
	if (this.isModified("status")) {
		if (this.status === "in-progress" && !this.startedAt) {
			this.startedAt = new Date();
		}

		if (this.status === "completed" && !this.completedAt) {
			this.completedAt = new Date();
			this.progressPercentage = 100;

			// Calculate actual time if started
			if (this.startedAt) {
				this.actualTime = Math.round(
					(this.completedAt - this.startedAt) / (1000 * 60)
				);
			}
		}
	}

	// Update progress percentage based on checklist
	if (this.checklist && this.checklist.length > 0) {
		const completedItems = this.checklist.filter(
			(item) => item.completed
		).length;
		this.progressPercentage = Math.round(
			(completedItems / this.checklist.length) * 100
		);
	}

	next();
});

// Method to add comment
todoSchema.methods.addComment = function (text, authorId) {
	this.comments.push({
		text,
		author: authorId,
		createdAt: new Date(),
	});
	return this.save();
};

// Method to add checklist item
todoSchema.methods.addChecklistItem = function (item) {
	this.checklist.push({ item });
	return this.save();
};

// Method to complete checklist item
todoSchema.methods.completeChecklistItem = function (itemId, userId) {
	const item = this.checklist.id(itemId);
	if (item) {
		item.completed = true;
		item.completedAt = new Date();
		item.completedBy = userId;
	}
	return this.save();
};

// Method to update progress
todoSchema.methods.updateProgress = function (percentage) {
	this.progressPercentage = Math.max(0, Math.min(100, percentage));

	// Auto-complete if 100%
	if (this.progressPercentage === 100 && this.status !== "completed") {
		this.status = "completed";
		this.completedAt = new Date();
	}

	return this.save();
};

// Static method to find overdue tasks
todoSchema.statics.findOverdue = function (userId = null) {
	const query = {
		dueDate: { $lt: new Date() },
		status: { $in: ["to-do", "in-progress"] },
	};

	if (userId) {
		query.assignedTo = userId;
	}

	return this.find(query)
		.populate("assignedTo", "fullName email")
		.populate("createdBy", "fullName")
		.sort({ dueDate: 1 });
};

// Static method to find tasks due soon
todoSchema.statics.findDueSoon = function (days = 3, userId = null) {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + days);

	const query = {
		dueDate: { $lte: futureDate, $gte: new Date() },
		status: { $in: ["to-do", "in-progress"] },
	};

	if (userId) {
		query.assignedTo = userId;
	}

	return this.find(query)
		.populate("assignedTo", "fullName email")
		.populate("createdBy", "fullName")
		.sort({ dueDate: 1 });
};

// Static method to get task statistics
todoSchema.statics.getStatistics = function (userId = null) {
	const matchStage = userId
		? { assignedTo: mongoose.Types.ObjectId(userId) }
		: {};

	return this.aggregate([
		{ $match: matchStage },
		{
			$group: {
				_id: "$status",
				count: { $sum: 1 },
				avgProgress: { $avg: "$progressPercentage" },
			},
		},
	]);
};

module.exports = mongoose.model("Todo", todoSchema);
