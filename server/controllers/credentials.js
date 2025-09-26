const { validationResult } = require("express-validator");
const Credential = require("../models/Credential");
const crypto = require("crypto");
const { notifyOrgPublicResource } = require("./notifications");

// Use the same encryption setup as the model
const ENCRYPTION_KEY = crypto
	.createHash("sha256")
	.update(String(process.env.CREDENTIAL_ENCRYPTION_KEY))
	.digest("base64")
	.substr(0, 32);
const ALGORITHM = "aes-256-cbc";

const decrypt = (text) => {
	if (!text) return text;
	const textParts = text.split(":");
	const iv = Buffer.from(textParts.shift(), "hex");
	const encryptedText = textParts.join(":");
	const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
	let decrypted = decipher.update(encryptedText, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
};

// @desc    Get credentials visible to the current user
// @route   GET /api/credentials
// @access  Private
const getCredentials = async (req, res) => {
	try {
		const {
			category,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
			includePasswords,
		} = req.query;
		const page = parseInt(req.query.page || 1, 10);
		const limitParam = parseInt(req.query.limit || 0, 10);
		const isAdmin = req.user.role === "admin";
		// If limit not provided, default to 10 for non-admins, much higher for admins
		const limit = limitParam || (isAdmin ? 1000 : 10);

		// Build visibility-aware query
		const query = {};
		if (req.user.role === "admin") {
			// Admin can see all
		} else {
			query.$or = [
				{ addedBy: req.user._id }, // own
				{ status: "active", visibility: "public" },
				{
					status: "active",
					visibility: "organization",
					organization: req.user.organization,
				},
			];
		}

		// Category filter
		if (category && category !== "all") {
			query.category = category;
		}

		// Search filter
		if (search) {
			query.$or = query.$or || [];
			const searchConditions = [
				{ title: { $regex: search, $options: "i" } },
				{ username: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
				{ url: { $regex: search, $options: "i" } },
				{ notes: { $regex: search, $options: "i" } },
			];

			if (query.$or.length > 0) {
				// If there are existing visibility conditions, combine them with search
				query.$and = [{ $or: query.$or }, { $or: searchConditions }];
				delete query.$or;
			} else {
				query.$or = searchConditions;
			}
		}

		// Build sort object
		const sort = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;

		// Execute query with pagination
		const total = await Credential.countDocuments(query);
		const credentials = await Credential.find(query)
			.populate("addedBy", "fullName email")
			.sort(sort)
			.limit(limit)
			.skip((page - 1) * limit);

		// Process credentials based on password inclusion request
		const processedCredentials = credentials.map((cred) => {
			// Get raw document data to access encrypted passwords
			const rawCred = cred._doc;
			const credObj = { ...rawCred };

			if (includePasswords === "true") {
				// Decrypt passwords for display
				try {
					credObj.password = rawCred.password ? decrypt(rawCred.password) : "";
					credObj.password2 = rawCred.password2
						? decrypt(rawCred.password2)
						: "";
				} catch (decryptError) {
					console.error("Decryption error:", decryptError);
					credObj.password = "[Decryption Error]";
					credObj.password2 = "[Decryption Error]";
				}
			} else {
				// Remove passwords for list view security
				delete credObj.password;
				delete credObj.password2;
			}

			// Add populated fields
			credObj.addedBy = cred.addedBy;

			return credObj;
		});

		// Calculate pagination info
		const pages = Math.ceil(total / limit);

		res.status(200).json({
			success: true,
			count: processedCredentials.length,
			pagination: {
				page,
				limit,
				total,
				pages,
			},
			data: processedCredentials,
		});
	} catch (error) {
		console.error("Get credentials error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching credentials",
		});
	}
};

// @desc    Get single credential (visibility aware)
// @route   GET /api/credentials/:id
// @access  Private
const getCredential = async (req, res) => {
	try {
		const credential = await Credential.findById(req.params.id).populate(
			"addedBy",
			"fullName email"
		);

		if (!credential) {
			return res.status(404).json({
				success: false,
				message: "Credential not found",
			});
		}

		// Check access permissions
		if (req.user.role !== "admin") {
			const isOwner =
				credential.addedBy._id.toString() === req.user._id.toString();
			const isPublic =
				credential.status === "active" && credential.visibility === "public";
			const isOrg =
				credential.status === "active" &&
				credential.visibility === "organization" &&
				credential.organization === req.user.organization;

			if (!isOwner && !isPublic && !isOrg) {
				return res.status(403).json({
					success: false,
					message: "Not authorized to access this credential",
				});
			}
		}

		// Decrypt password for individual view
		const credentialData = credential.toObject();
		try {
			credentialData.password = decrypt(credential.password);
		} catch (decryptError) {
			console.error("Decryption error:", decryptError);
			credentialData.password = "[Decryption Error]";
		}

		res.status(200).json({
			success: true,
			data: credentialData,
		});
	} catch (error) {
		console.error("Get credential error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching credential",
		});
	}
};

// @desc    Create new credential
// @route   POST /api/credentials
// @access  Private
const createCredential = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const {
			title,
			username,
			email,
			password,
			password2,
			url,
			category,
			notes,
		} = req.body;

		const credential = await Credential.create({
			title,
			username,
			email,
			password, // Model will encrypt this automatically
			password2: password2 || "", // Model will encrypt this automatically if provided
			url,
			category: category || "Other",
			project: req.body.project || "General",
			notes,
			addedBy: req.user._id,
			organization: req.user.organization,
			visibility: req.body.visibility || req.body.accessLevel || "private",
		});

		await credential.populate("addedBy", "fullName email");

		// Don't return encrypted password
		const responseData = credential.toObject();
		responseData.password = undefined;

		// Notify org members if public
		if (credential.visibility === "public") {
			await notifyOrgPublicResource({
				creator: req.user,
				organization: req.user.organization,
				resourceType: "Credential",
				resourceId: credential._id,
				title: credential.title,
			});
		}

		res.status(201).json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		console.error("Create credential error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while creating credential",
		});
	}
};

// @desc    Update credential
// @route   PUT /api/credentials/:id
// @access  Private
const updateCredential = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		let credential = await Credential.findById(req.params.id);

		if (!credential) {
			return res.status(404).json({
				success: false,
				message: "Credential not found",
			});
		}

		// Check ownership
		if (
			credential.addedBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this credential",
			});
		}

		const updateData = { ...req.body };

		// Strip empty-string fields to avoid validation errors and unintended overwrites
		Object.keys(updateData).forEach((key) => {
			if (updateData[key] === "") {
				delete updateData[key];
			}
		});

		// Map accessLevel -> visibility if sent by older client
		if (updateData.accessLevel && !updateData.visibility) {
			updateData.visibility = updateData.accessLevel;
			delete updateData.accessLevel;
		}

		// Remove empty password fields so validators don't complain and we don't overwrite with empty
		if (
			Object.prototype.hasOwnProperty.call(updateData, "password") &&
			!updateData.password
		) {
			delete updateData.password;
		}
		if (
			Object.prototype.hasOwnProperty.call(updateData, "password2") &&
			!updateData.password2
		) {
			delete updateData.password2;
		}

		// Assign fields and save to trigger pre-save encryption if passwords present
		Object.keys(updateData).forEach((key) => {
			credential[key] = updateData[key];
		});

		await credential.save();
		await credential.populate("addedBy", "fullName email");

		// Don't return encrypted password
		const responseData = credential.toObject();
		responseData.password = undefined;
		responseData.password2 = undefined;

		res.status(200).json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		console.error("Update credential error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while updating credential",
		});
	}
};

// @desc    Delete credential
// @route   DELETE /api/credentials/:id
// @access  Private
const deleteCredential = async (req, res) => {
	try {
		const credential = await Credential.findById(req.params.id);

		if (!credential) {
			return res.status(404).json({
				success: false,
				message: "Credential not found",
			});
		}

		// Check ownership
		if (
			credential.addedBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this credential",
			});
		}

		await credential.deleteOne();

		res.status(200).json({
			success: true,
			message: "Credential deleted successfully",
		});
	} catch (error) {
		console.error("Delete credential error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while deleting credential",
		});
	}
};

module.exports = {
	getCredentials,
	getCredential,
	createCredential,
	updateCredential,
	deleteCredential,
};
