const { validationResult } = require("express-validator");
const Link = require("../models/Link");
const AuditLog = require("../models/AuditLog");
const { notifyOrgPublicResource } = require("./notifications");

// @desc    Get all links
// @route   GET /api/links
// @access  Private
const getLinks = async (req, res) => {
	try {
		const {
			project,
			category,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;
		const page = parseInt(req.query.page || 1, 10);
		const limitParam = parseInt(req.query.limit || 0, 10);
		const isAdmin = req.user.role === "admin";
		// If limit not provided, default to 10 for non-admins, much higher for admins
		const limit = limitParam || (isAdmin ? 1000 : 10);

		// Build query
		const query = {};

		// Status filter (admin may specify, otherwise no status restriction)
		let statusFilter = null;
		if (typeof req.query.status !== "undefined") {
			statusFilter = req.query.status !== "all" ? req.query.status : null;
		}

		// Project filter
		if (project && project !== "all") {
			query.project = project;
		}

		// Category filter
		if (category && category !== "all") {
			query.category = category;
		}

		// Search filter
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ url: { $regex: search, $options: "i" } },
				{ tags: { $in: [new RegExp(search, "i")] } },
			];
		}

		// Role-based filtering with visibility
		if (isAdmin) {
			// Admin can see all links; apply status filter only if explicitly provided
			if (statusFilter) {
				query.status = statusFilter;
			}
		} else {
			// Non-admin users can see:
			// 1. Active public links
			// 2. Active organization links for their org
			// 3. ALL their own links (any status)
			query.$or = [
				{ status: "active", visibility: "public" },
				{
					status: "active",
					visibility: "organization",
					organization: req.user.organization,
				},
				// Legacy fallback
				{ status: "active", isPublic: true },
				{ addedBy: req.user._id },
			];
		}

		// Sort options
		const sortOptions = {};
		sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

		// Execute query with pagination
		const links = await Link.find(query)
			.populate("addedBy", "fullName email organization")
			.populate("approvedBy", "fullName")
			.sort(sortOptions)
			.skip((page - 1) * limit)
			.limit(limit);

		// Get total count for pagination
		const total = await Link.countDocuments(query);

		res.status(200).json({
			success: true,
			data: links,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get links error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch links",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Get single link
// @route   GET /api/links/:id
// @access  Private
const getLink = async (req, res) => {
	try {
		const link = await Link.findById(req.params.id)
			.populate("addedBy", "fullName email organization")
			.populate("approvedBy", "fullName");

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Check access permissions using visibility
		if (req.user.role !== "admin") {
			const isOwner = link.addedBy._id.toString() === req.user._id.toString();
			const isPublic = link.status === "active" && link.visibility === "public";
			const isOrg =
				link.status === "active" &&
				link.visibility === "organization" &&
				link.organization === req.user.organization;

			// Legacy fallback for old records without visibility
			const legacyPublic =
				link.status === "active" &&
				(link.visibility === undefined || link.visibility === null) &&
				link.isPublic === true;

			if (!isOwner && !isPublic && !isOrg && !legacyPublic) {
				return res.status(403).json({
					success: false,
					message: "Access denied",
				});
			}
		}

		res.status(200).json({
			success: true,
			data: link,
		});
	} catch (error) {
		console.error("Get link error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch link",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Create new link
// @route   POST /api/links
// @access  Private
const createLink = async (req, res) => {
	try {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const linkData = {
			...req.body,
			category: req.body.category || "Other",
			project: req.body.project || "General",
			addedBy: req.user._id,
			organization: req.user.organization,
		};

		// Map legacy accessLevel -> visibility when provided by client
		if (req.body.accessLevel && !req.body.visibility) {
			linkData.visibility = req.body.accessLevel;
			delete linkData.accessLevel;
		}

		// Set status based on user role and visibility
		if (req.user.role === "admin") {
			linkData.status = "active";
			linkData.approvedBy = req.user._id;
		} else {
			// For non-admins: if the link is marked public or organization, make it active immediately
			if (
				linkData.visibility === "public" ||
				linkData.visibility === "organization"
			) {
				linkData.status = "active";
				linkData.approvedBy = undefined;
			} else {
				linkData.status = "pending_approval";
			}
		}

		const link = await Link.create(linkData);

		// Populate the created link
		await link.populate("addedBy", "fullName email organization");

		// Log link creation
		await AuditLog.logAction({
			user: req.user,
			action: "CREATE",
			resourceType: "Link",
			resourceId: link._id,
			resourceTitle: link.title,
			description: "Link created",
			details: {
				url: link.url,
				category: link.category,
				project: link.project,
			},
			req,
			status: "SUCCESS",
		});

		// Send notifications if public visibility
		if (link.visibility === "public") {
			await notifyOrgPublicResource({
				creator: req.user,
				organization: req.user.organization,
				resourceType: "Link",
				resourceId: link._id,
				title: link.title || link.url,
			});
		}

		res.status(201).json({
			success: true,
			message:
				req.user.role === "admin"
					? "Link created and approved successfully"
					: "Link created and pending approval",
			data: link,
		});
	} catch (error) {
		console.error("Create link error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create link",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Update link
// @route   PUT /api/links/:id
// @access  Private
const updateLink = async (req, res) => {
	try {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const link = await Link.findById(req.params.id);

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Check permissions
		if (
			req.user.role !== "admin" &&
			link.addedBy.toString() !== req.user._id.toString()
		) {
			return res.status(403).json({
				success: false,
				message: "Access denied. You can only update your own links.",
			});
		}

		// Handle status transitions for non-admin updates
		if (req.user.role !== "admin") {
			const bodyKeys = Object.keys(req.body || {});
			const visibilityOnly = bodyKeys.every(
				(k) => k === "visibility" || k === "accessLevel"
			);

			// If only visibility is changed
			if (visibilityOnly) {
				// Map legacy again just in case
				const newVisibility = req.body.visibility || req.body.accessLevel;
				if (newVisibility === "public" || newVisibility === "organization") {
					// Make link active so others can see it
					req.body.status = "active";
					req.body.approvedBy = undefined;
				}
				// If switching to private/team, keep current status as-is
			} else if (link.status === "active") {
				// For any non-visibility changes on active links, require approval
				req.body.status = "pending_approval";
				req.body.approvedBy = undefined;
			}
		}

		// Map legacy accessLevel -> visibility when provided by client
		if (req.body.accessLevel && !req.body.visibility) {
			req.body.visibility = req.body.accessLevel;
			delete req.body.accessLevel;
		}

		const updatedLink = await Link.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		})
			.populate("addedBy", "fullName email organization")
			.populate("approvedBy", "fullName");

		// Log link update - temporarily disabled for debugging
		// await AuditLog.logAction({
		// 	user: req.user,
		// 	action: "UPDATE",
		// 	resourceType: "Link",
		// 	resourceId: updatedLink._id,
		// 	resourceTitle: updatedLink.title,
		// 	description: "Link updated",
		// 	details: req.body,
		// 	req,
		// 	status: "SUCCESS",
		// });

		res.status(200).json({
			success: true,
			message: "Link updated successfully",
			data: updatedLink,
		});
	} catch (error) {
		console.error("Update link error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to update link",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Delete link
// @route   DELETE /api/links/:id
// @access  Private
const deleteLink = async (req, res) => {
	try {
		const link = await Link.findById(req.params.id);

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Check permissions
		if (
			req.user.role !== "admin" &&
			link.addedBy.toString() !== req.user._id.toString()
		) {
			return res.status(403).json({
				success: false,
				message: "Access denied. You can only delete your own links.",
			});
		}

		await Link.findByIdAndDelete(req.params.id);

		// Log link deletion
		await AuditLog.logAction({
			user: req.user,
			action: "DELETE",
			resourceType: "Link",
			resourceId: link._id,
			resourceTitle: link.title,
			description: "Link deleted",
			details: { url: link.url },
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Link deleted successfully",
		});
	} catch (error) {
		console.error("Delete link error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete link",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Click/visit link
// @route   POST /api/links/:id/click
// @access  Private
const clickLink = async (req, res) => {
	try {
		const link = await Link.findById(req.params.id);

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Check if link is accessible
		if (link.status !== "active") {
			return res.status(403).json({
				success: false,
				message: "Link is not active",
			});
		}

		// Check expiration
		if (link.isExpired) {
			return res.status(410).json({
				success: false,
				message: "Link has expired",
			});
		}

		// Increment click count
		await link.incrementClick();

		// Log link access
		await AuditLog.logAction({
			user: req.user,
			action: "READ",
			resourceType: "Link",
			resourceId: link._id,
			resourceTitle: link.title,
			description: "Link accessed",
			details: { url: link.url },
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Link accessed successfully",
			data: {
				url: link.url,
				clickCount: link.clickCount,
				isYouTubeLink: link.isYouTubeLink,
				youtubeVideoId: link.youtubeVideoId,
			},
		});
	} catch (error) {
		console.error("Click link error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to access link",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Get popular links
// @route   GET /api/links/popular
// @access  Private
const getPopularLinks = async (req, res) => {
	try {
		const { limit = 10 } = req.query;

		const links = await Link.findPopular(parseInt(limit));

		res.status(200).json({
			success: true,
			data: links,
		});
	} catch (error) {
		console.error("Get popular links error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch popular links",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Get recent links
// @route   GET /api/links/recent
// @access  Private
const getRecentLinks = async (req, res) => {
	try {
		const { limit = 10 } = req.query;

		const links = await Link.findRecent(parseInt(limit));

		res.status(200).json({
			success: true,
			data: links,
		});
	} catch (error) {
		console.error("Get recent links error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch recent links",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Approve link (admin only)
// @route   PUT /api/links/:id/approve
// @access  Private (Admin)
const approveLink = async (req, res) => {
	try {
		const link = await Link.findById(req.params.id);

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		if (link.status !== "pending_approval") {
			return res.status(400).json({
				success: false,
				message: "Link is not pending approval",
			});
		}

		link.status = "active";
		link.approvedBy = req.user._id;
		await link.save();

		await link.populate("addedBy", "fullName email organization");
		await link.populate("approvedBy", "fullName");

		// Log approval
		await AuditLog.logAction({
			user: req.user,
			action: "APPROVE",
			resourceType: "Link",
			resourceId: link._id,
			resourceTitle: link.title,
			description: "Link approved",
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Link approved successfully",
			data: link,
		});
	} catch (error) {
		console.error("Approve link error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to approve link",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Archive link
// @route   PUT /api/links/:id/archive
// @access  Private
const archiveLink = async (req, res) => {
	try {
		const link = await Link.findById(req.params.id);

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Check permissions
		if (
			req.user.role !== "admin" &&
			link.addedBy.toString() !== req.user._id.toString()
		) {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		link.status = "archived";
		await link.save();

		// Log archival
		await AuditLog.logAction({
			user: req.user,
			action: "UPDATE",
			resourceType: "Link",
			resourceId: link._id,
			resourceTitle: link.title,
			description: "Link archived",
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Link archived successfully",
		});
	} catch (error) {
		console.error("Archive link error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to archive link",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Internal server error",
		});
	}
};

// @desc    Activate any existing links that are public/organization but not active (maintenance)
// @route   PUT /api/links/admin/activate-visible
// @access  Private (Admin)
const activateVisibleLinks = async (req, res) => {
	try {
		const result = await Link.updateMany(
			{
				status: { $ne: "active" },
				visibility: { $in: ["public", "organization"] },
			},
			{
				$set: { status: "active" },
				$unset: { approvedBy: "" },
			}
		);

		res.status(200).json({
			success: true,
			message: "Activated public/organization links",
			modifiedCount: result.modifiedCount,
		});
	} catch (error) {
		console.error("Activate visible links error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to activate visible links",
		});
	}
};

module.exports = {
	getLinks,
	getLink,
	createLink,
	updateLink,
	deleteLink,
	clickLink,
	getPopularLinks,
	getRecentLinks,
	approveLink,
	archiveLink,
	activateVisibleLinks,
};
