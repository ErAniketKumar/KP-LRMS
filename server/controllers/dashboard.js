const Link = require("../models/Link");
const Document = require("../models/Document");
const Credential = require("../models/Credential");
const Todo = require("../models/Todo");

// @desc    Get dashboard stats (counts visible to the user)
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
	try {
		const userId = req.user._id;
		const userOrg = req.user.organization;
		const isAdmin = req.user.role === "admin";

		// Admin: system-wide counts; Non-admin: visibility-aware counts
		const linkQuery = isAdmin
			? {}
			: {
					$or: [
						{ addedBy: userId },
						{ status: "active", visibility: "public" },
						{
							status: "active",
							visibility: "organization",
							organization: userOrg,
						},
						{
							status: "active",
							visibility: { $exists: false },
							isPublic: true,
						},
					],
			  };

		const documentQuery = isAdmin
			? {}
			: {
					$or: [
						{ addedBy: userId },
						{ status: "active", visibility: "public" },
						{
							status: "active",
							visibility: "organization",
							organization: userOrg,
						},
					],
			  };

		const credentialQuery = isAdmin
			? {}
			: {
					$or: [
						{ addedBy: userId },
						{ status: "active", visibility: "public" },
						{
							status: "active",
							visibility: "organization",
							organization: userOrg,
						},
					],
			  };

		const [
			totalLinks,
			totalDocuments,
			totalTodos,
			totalCredentials,
			activeTodos,
		] = await Promise.all([
			Link.countDocuments(linkQuery),
			Document.countDocuments(documentQuery),
			isAdmin
				? Todo.countDocuments({})
				: Todo.countDocuments({ createdBy: userId }),
			Credential.countDocuments(credentialQuery),
			isAdmin
				? Todo.countDocuments({ status: { $ne: "completed" } })
				: Todo.countDocuments({
						createdBy: userId,
						status: { $ne: "completed" },
				  }),
		]);

		res.status(200).json({
			success: true,
			data: {
				totalLinks,
				totalDocuments,
				totalTodos,
				totalCredentials,
				activeTodos,
				// Growth placeholders (no historical data in this project yet)
				linksGrowth: 0,
				documentsGrowth: 0,
				credentialsGrowth: 0,
				todosChange: 0,
			},
		});
	} catch (error) {
		console.error("Dashboard stats error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch dashboard stats" });
	}
};

// @desc    Get recent activity (basic aggregation from latest user resources)
// @route   GET /api/dashboard/activity
// @access  Private
const getActivity = async (req, res) => {
	try {
		const userId = req.user._id;
		const userOrg = req.user.organization;
		const isAdmin = req.user.role === "admin";

		const [links, documents, todos] = await Promise.all([
			(isAdmin
				? Link.find({})
				: Link.find({
						$or: [
							{ addedBy: userId },
							{ status: "active", visibility: "public" },
							{
								status: "active",
								visibility: "organization",
								organization: userOrg,
							},
							{
								status: "active",
								visibility: { $exists: false },
								isPublic: true,
							},
						],
				  })
			)
				.sort({ createdAt: -1 })
				.limit(5)
				.populate("addedBy", "fullName"),
			(isAdmin ? Document.find({}) : Document.find({ addedBy: userId }))
				.sort({ createdAt: -1 })
				.limit(5)
				.populate("addedBy", "fullName"),
			(isAdmin ? Todo.find({}) : Todo.find({ createdBy: userId }))
				.sort({ updatedAt: -1 })
				.limit(5)
				.populate("createdBy", "fullName"),
		]);

		const activity = [];

		links.forEach((l) =>
			activity.push({
				id: `link-${l._id}`,
				type: "link",
				action: "added",
				resource: l.title,
				user: l.addedBy?.fullName || "Unknown",
				createdAt: l.createdAt,
			})
		);
		documents.forEach((d) =>
			activity.push({
				id: `doc-${d._id}`,
				type: "document",
				action: "uploaded",
				resource: d.title,
				user: d.addedBy?.fullName || "Unknown",
				createdAt: d.createdAt,
			})
		);
		todos.forEach((t) =>
			activity.push({
				id: `todo-${t._id}`,
				type: "task",
				action: t.status === "completed" ? "completed" : "created",
				resource: t.title,
				user: t.createdBy?.fullName || "Unknown",
				createdAt: t.updatedAt || t.createdAt,
			})
		);

		// Sort newest first and limit
		activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		res.status(200).json({ success: true, data: activity.slice(0, 10) });
	} catch (error) {
		console.error("Dashboard activity error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch recent activity" });
	}
};

module.exports = { getStats, getActivity };
