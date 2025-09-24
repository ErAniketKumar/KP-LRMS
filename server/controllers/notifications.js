const Notification = require("../models/Notification");

// GET /api/notifications
// List current user's notifications (paginated)
exports.listNotifications = async (req, res) => {
	try {
		const page = parseInt(req.query.page || 1, 10);
		const limit = parseInt(req.query.limit || 20, 10);
		const skip = (page - 1) * limit;

		const [items, total, unread] = await Promise.all([
			Notification.find({ recipient: req.user._id })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit),
			Notification.countDocuments({ recipient: req.user._id }),
			Notification.countDocuments({ recipient: req.user._id, isRead: false }),
		]);

		res.status(200).json({
			success: true,
			data: items,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
			unread,
		});
	} catch (err) {
		console.error("List notifications error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch notifications" });
	}
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
	try {
		const count = await Notification.countDocuments({
			recipient: req.user._id,
			isRead: false,
		});
		res.status(200).json({ success: true, count });
	} catch (err) {
		console.error("Unread count error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch unread count" });
	}
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
	try {
		const updated = await Notification.findOneAndUpdate(
			{ _id: req.params.id, recipient: req.user._id },
			{ $set: { isRead: true, readAt: new Date() } },
			{ new: true }
		);
		if (!updated) {
			return res
				.status(404)
				.json({ success: false, message: "Notification not found" });
		}
		res.status(200).json({ success: true, data: updated });
	} catch (err) {
		console.error("Mark notification read error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to update notification" });
	}
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
	try {
		const result = await Notification.updateMany(
			{ recipient: req.user._id, isRead: false },
			{ $set: { isRead: true, readAt: new Date() } }
		);
		res
			.status(200)
			.json({ success: true, modifiedCount: result.modifiedCount });
	} catch (err) {
		console.error("Mark all notifications read error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to mark all as read" });
	}
};

// Helper to create notifications to org members (except creator)
exports.notifyOrgPublicResource = async ({
	creator,
	organization,
	resourceType,
	resourceId,
	title,
}) => {
	try {
		const User = require("../models/User");
		const users = await User.find({
			organization,
			_id: { $ne: creator._id || creator },
		}).select("_id");
		if (!users.length) return;

		const docs = users.map((u) => ({
			recipient: u._id,
			organization,
			createdBy: creator._id || creator,
			resourceType,
			resourceId,
			title: `${resourceType} created in your org`,
			message: `${title} was published as public by a team member`,
		}));

		await Notification.insertMany(docs, { ordered: false });
	} catch (err) {
		console.error("Notify org public resource error:", err.message);
	}
};
