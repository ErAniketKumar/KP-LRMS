const ShortUrl = require("../models/ShortUrl");
const QRCode = require("qrcode");
const UAParser = require("ua-parser-js");
const { validationResult } = require("express-validator");

// @desc    Get all short URLs for the authenticated user
// @route   GET /api/shorturl
// @access  Private
const getShortUrls = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const search = req.query.search || "";

		// Build filter
		let filter = { createdBy: req.user._id };

		if (search) {
			filter = {
				...filter,
				$or: [
					{ originalUrl: { $regex: search, $options: "i" } },
					{ title: { $regex: search, $options: "i" } },
					{ shortCode: { $regex: search, $options: "i" } },
				],
			};
		}

		// Calculate skip
		const skip = (page - 1) * limit;

		// Get short URLs with pagination
		const shortUrls = await ShortUrl.find(filter)
			.populate("createdBy", "fullName email")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		// Get total count
		const total = await ShortUrl.countDocuments(filter);

		res.status(200).json({
			success: true,
			data: shortUrls,
			pagination: {
				page,
				pages: Math.ceil(total / limit),
				total,
				limit,
			},
		});
	} catch (error) {
		console.error("Get short URLs error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching short URLs",
		});
	}
};

// @desc    Get a single short URL by ID
// @route   GET /api/shorturl/:id
// @access  Private
const getShortUrl = async (req, res) => {
	try {
		const shortUrl = await ShortUrl.findById(req.params.id).populate(
			"createdBy",
			"fullName email"
		);

		if (!shortUrl) {
			return res.status(404).json({
				success: false,
				message: "Short URL not found",
			});
		}

		// Check if user owns this URL or is admin
		if (
			shortUrl.createdBy._id.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to view this short URL",
			});
		}

		res.status(200).json({
			success: true,
			data: shortUrl,
		});
	} catch (error) {
		console.error("Get short URL error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching short URL",
		});
	}
};

// @desc    Create a new short URL
// @route   POST /api/shorturl
// @access  Private
const createShortUrl = async (req, res) => {
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

		const {
			originalUrl,
			title,
			description,
			customCode,
			expirationDate,
			maxClicks,
		} = req.body;

		// Validate and normalize original URL
		if (!originalUrl) {
			return res.status(400).json({
				success: false,
				message: "Original URL is required",
			});
		}

		// Add protocol if missing
		let normalizedUrl = originalUrl;
		if (!/^https?:\/\//i.test(normalizedUrl)) {
			normalizedUrl = `https://${normalizedUrl}`;
		}

		// Create short URL data
		const shortUrlData = {
			originalUrl: normalizedUrl,
			title,
			description,
			createdBy: req.user._id,
			expirationDate,
			maxClicks,
		};

		// If custom code is provided, use it
		if (customCode) {
			// Check if custom code already exists
			const existingUrl = await ShortUrl.findOne({ shortCode: customCode });
			if (existingUrl) {
				return res.status(400).json({
					success: false,
					message: "Custom short code already exists",
				});
			}
			shortUrlData.shortCode = customCode;
		}

		// Create the short URL
		const shortUrl = await ShortUrl.create(shortUrlData);

		// Generate QR code
		const shortUrlLink = `${req.protocol}://${req.get("host")}/s/${
			shortUrl.shortCode
		}`;
		const qrCodeDataURL = await QRCode.toDataURL(shortUrlLink);

		// Update the short URL with QR code
		shortUrl.qrCodeUrl = qrCodeDataURL;
		await shortUrl.save();

		// Populate creator info
		await shortUrl.populate("createdBy", "fullName email");

		res.status(201).json({
			success: true,
			data: shortUrl,
			shortUrl: shortUrlLink,
		});
	} catch (error) {
		console.error("Create short URL error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while creating short URL",
		});
	}
};

// @desc    Update a short URL
// @route   PUT /api/shorturl/:id
// @access  Private
const updateShortUrl = async (req, res) => {
	try {
		const shortUrl = await ShortUrl.findById(req.params.id);

		if (!shortUrl) {
			return res.status(404).json({
				success: false,
				message: "Short URL not found",
			});
		}

		// Check if user owns this URL or is admin
		if (
			shortUrl.createdBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this short URL",
			});
		}

		// Update allowed fields
		const allowedFields = [
			"title",
			"description",
			"isActive",
			"expirationDate",
			"maxClicks",
		];
		const updateData = {};

		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updateData[field] = req.body[field];
			}
		});

		const updatedShortUrl = await ShortUrl.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true, runValidators: true }
		).populate("createdBy", "fullName email");

		res.status(200).json({
			success: true,
			data: updatedShortUrl,
		});
	} catch (error) {
		console.error("Update short URL error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while updating short URL",
		});
	}
};

// @desc    Delete a short URL
// @route   DELETE /api/shorturl/:id
// @access  Private
const deleteShortUrl = async (req, res) => {
	try {
		const shortUrl = await ShortUrl.findById(req.params.id);

		if (!shortUrl) {
			return res.status(404).json({
				success: false,
				message: "Short URL not found",
			});
		}

		// Check if user owns this URL or is admin
		if (
			shortUrl.createdBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this short URL",
			});
		}

		await ShortUrl.findByIdAndDelete(req.params.id);

		res.status(200).json({
			success: true,
			message: "Short URL deleted successfully",
		});
	} catch (error) {
		console.error("Delete short URL error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while deleting short URL",
		});
	}
};

// @desc    Redirect short URL (public endpoint)
// @route   GET /s/:shortCode
// @access  Public
const redirectShortUrl = async (req, res) => {
	try {
		const { shortCode } = req.params;

		const shortUrl = await ShortUrl.findOne({
			shortCode,
			isActive: true,
		});

		if (!shortUrl) {
			return res.status(404).json({
				success: false,
				message: "Short URL not found or inactive",
			});
		}

		// Check expiration
		if (shortUrl.expirationDate && new Date() > shortUrl.expirationDate) {
			return res.status(410).json({
				success: false,
				message: "Short URL has expired",
			});
		}

		// Check max clicks
		if (shortUrl.maxClicks && shortUrl.clickCount >= shortUrl.maxClicks) {
			return res.status(410).json({
				success: false,
				message: "Short URL has reached maximum clicks",
			});
		}

		// Parse user agent
		const parser = new UAParser(req.headers["user-agent"]);
		const result = parser.getResult();

		// Get client IP
		const clientIP =
			req.ip ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			(req.connection.socket ? req.connection.socket.remoteAddress : null);

		// Create click record
		const clickData = {
			timestamp: new Date(),
			ipAddress: clientIP,
			userAgent: req.headers["user-agent"],
			referer: req.headers.referer || req.headers.referrer,
			device: result.device.model || result.device.type || "Unknown",
			browser: `${result.browser.name} ${result.browser.version}`.trim(),
			os: `${result.os.name} ${result.os.version}`.trim(),
		};

		// Add click to array
		shortUrl.clicks.push(clickData);
		shortUrl.clickCount += 1;

		// Count unique clicks (by IP)
		const uniqueIPs = new Set(shortUrl.clicks.map((click) => click.ipAddress));
		shortUrl.uniqueClicks = uniqueIPs.size;

		await shortUrl.save();

		// Redirect to original URL
		res.redirect(shortUrl.originalUrl);
	} catch (error) {
		console.error("Redirect short URL error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while redirecting",
		});
	}
};

// @desc    Get analytics for a short URL
// @route   GET /api/shorturl/:id/analytics
// @access  Private
const getShortUrlAnalytics = async (req, res) => {
	try {
		const shortUrl = await ShortUrl.findById(req.params.id).populate(
			"createdBy",
			"fullName email"
		);

		if (!shortUrl) {
			return res.status(404).json({
				success: false,
				message: "Short URL not found",
			});
		}

		// Check if user owns this URL or is admin
		if (
			shortUrl.createdBy._id.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to view analytics for this short URL",
			});
		}

		// Prepare analytics data
		const analytics = {
			totalClicks: shortUrl.clickCount,
			uniqueClicks: shortUrl.uniqueClicks,
			clicksToday: shortUrl.clicks.filter(
				(click) => click.timestamp >= new Date(new Date().setHours(0, 0, 0, 0))
			).length,
			clicksThisWeek: shortUrl.clicks.filter(
				(click) =>
					click.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
			).length,
			clicksThisMonth: shortUrl.clicks.filter(
				(click) =>
					click.timestamp >=
					new Date(new Date().getFullYear(), new Date().getMonth(), 1)
			).length,

			// Device breakdown
			devices: shortUrl.clicks.reduce((acc, click) => {
				const device = click.device || "Unknown";
				acc[device] = (acc[device] || 0) + 1;
				return acc;
			}, {}),

			// Browser breakdown
			browsers: shortUrl.clicks.reduce((acc, click) => {
				const browser = click.browser || "Unknown";
				acc[browser] = (acc[browser] || 0) + 1;
				return acc;
			}, {}),

			// OS breakdown
			operatingSystems: shortUrl.clicks.reduce((acc, click) => {
				const os = click.os || "Unknown";
				acc[os] = (acc[os] || 0) + 1;
				return acc;
			}, {}),

			// Recent clicks (last 10)
			recentClicks: shortUrl.clicks
				.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
				.slice(0, 10),

			// Daily clicks for the last 30 days
			dailyClicks: generateDailyClicksChart(shortUrl.clicks),
		};

		res.status(200).json({
			success: true,
			data: {
				shortUrl: {
					id: shortUrl._id,
					originalUrl: shortUrl.originalUrl,
					shortCode: shortUrl.shortCode,
					title: shortUrl.title,
					createdAt: shortUrl.createdAt,
				},
				analytics,
			},
		});
	} catch (error) {
		console.error("Get short URL analytics error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching analytics",
		});
	}
};

// Helper function to generate daily clicks chart data
const generateDailyClicksChart = (clicks) => {
	const last30Days = [];
	const today = new Date();

	for (let i = 29; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);
		const dateString = date.toISOString().split("T")[0];

		const clicksForDay = clicks.filter((click) => {
			const clickDate = new Date(click.timestamp).toISOString().split("T")[0];
			return clickDate === dateString;
		}).length;

		last30Days.push({
			date: dateString,
			clicks: clicksForDay,
		});
	}

	return last30Days;
};

module.exports = {
	getShortUrls,
	getShortUrl,
	createShortUrl,
	updateShortUrl,
	deleteShortUrl,
	redirectShortUrl,
	getShortUrlAnalytics,
};
