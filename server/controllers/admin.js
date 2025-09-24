const User = require("../models/User");
const Link = require("../models/Link");
const Document = require("../models/Document");
const Credential = require("../models/Credential");
const Todo = require("../models/Todo");
const AuditLog = require("../models/AuditLog");

// GET /api/admin/system-stats
// Admin only
const getSystemStats = async (req, res) => {
	try {
		const [
			totalUsers,
			activeUsers,
			unverifiedUsers,
			totalLinks,
			totalDocuments,
			totalCredentials,
			totalTodos,
			openTodos,
			docStorageBytes,
		] = await Promise.all([
			User.countDocuments({}),
			User.countDocuments({ isActive: true }),
			User.countDocuments({ isVerified: false }),
			Link.countDocuments({}),
			Document.countDocuments({}),
			Credential.countDocuments({}),
			Todo.countDocuments({}),
			Todo.countDocuments({ status: { $ne: "completed" } }),
			// Sum of fileSize for documents
			Document.aggregate([
				{ $group: { _id: null, total: { $sum: "$fileSize" } } },
			]).then((r) => r[0]?.total || 0),
		]);

		res.status(200).json({
			success: true,
			data: {
				users: {
					total: totalUsers,
					active: activeUsers,
					unverified: unverifiedUsers,
				},
				resources: {
					links: totalLinks,
					documents: totalDocuments,
					credentials: totalCredentials,
					todos: totalTodos,
					openTodos,
				},
				storage: { documentsBytes: docStorageBytes },
			},
		});
	} catch (error) {
		console.error("Admin system stats error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch system stats" });
	}
};

// GET /api/admin/analytics?days=30
// Admin only
const getUsageAnalytics = async (req, res) => {
	try {
		const days = Math.max(
			1,
			Math.min(365, parseInt(req.query.days || "30", 10))
		);
		const endDate = new Date();
		const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		const series = await AuditLog.getAnalytics(startDate, endDate);

		res.status(200).json({ success: true, data: series });
	} catch (error) {
		console.error("Admin analytics error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch analytics" });
	}
};

// GET /api/admin/users
// Admin only - list users with pagination and filters
const listUsers = async (req, res) => {
	try {
		const page = Math.max(1, parseInt(req.query.page || "1", 10));
		const limit = Math.min(
			100,
			Math.max(1, parseInt(req.query.limit || "20", 10))
		);
		const skip = (page - 1) * limit;
		const { q, role, status, org } = req.query;

		const filter = {};
		if (q) {
			filter.$or = [
				{ fullName: { $regex: q, $options: "i" } },
				{ email: { $regex: q, $options: "i" } },
			];
		}
		if (role) filter.role = role;
		if (status === "active") filter.isActive = true;
		if (status === "inactive") filter.isActive = false;
		if (status === "unverified") filter.isVerified = false;
		if (org) filter.organization = org;

		const [users, total] = await Promise.all([
			User.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.select(
					"fullName email organization role isActive isVerified lastLogin createdAt loginCount"
				),
			User.countDocuments(filter),
		]);

		res.status(200).json({
			success: true,
			data: users,
			pagination: { page, limit, total, pages: Math.ceil(total / limit) },
		});
	} catch (error) {
		console.error("Admin list users error:", error);
		res.status(500).json({ success: false, message: "Failed to fetch users" });
	}
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
	try {
		const { id } = req.params;
		const { role } = req.body;
		if (!role || !["admin", "contributor", "viewer"].includes(role)) {
			return res.status(400).json({ success: false, message: "Invalid role" });
		}
		const user = await User.findByIdAndUpdate(
			id,
			{ role },
			{ new: true, runValidators: true }
		).select(
			"fullName email organization role isActive isVerified lastLogin createdAt loginCount"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		res.status(200).json({ success: true, data: user });
	} catch (error) {
		console.error("Admin update role error:", error);
		res.status(500).json({ success: false, message: "Failed to update role" });
	}
};

// PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { isActive, isVerified } = req.body;
		const update = {};
		if (typeof isActive === "boolean") update.isActive = isActive;
		if (typeof isVerified === "boolean") update.isVerified = isVerified;
		if (Object.keys(update).length === 0) {
			return res
				.status(400)
				.json({ success: false, message: "No valid status provided" });
		}
		const user = await User.findByIdAndUpdate(id, update, { new: true }).select(
			"fullName email organization role isActive isVerified lastLogin createdAt loginCount"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		res.status(200).json({ success: true, data: user });
	} catch (error) {
		console.error("Admin update status error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to update status" });
	}
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findByIdAndDelete(id);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		res.status(200).json({ success: true, message: "User deleted" });
	} catch (error) {
		console.error("Admin delete user error:", error);
		res.status(500).json({ success: false, message: "Failed to delete user" });
	}
};

module.exports = {
	getSystemStats,
	getUsageAnalytics,
	listUsers,
	updateUserRole,
	updateUserStatus,
	deleteUser,
};
