const { validationResult } = require("express-validator");
const Organization = require("../models/Organization");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// @desc    Get all organizations
// @route   GET /api/organizations
// @access  Public (for registration) / Private (for admin management)
const getOrganizations = async (req, res) => {
	try {
		// For public access (registration), only return active organizations with basic info
		if (!req.user) {
			const organizations = await Organization.getActive().select(
				"name domain isActive"
			);
			return res.status(200).json({
				success: true,
				data: organizations,
			});
		}

		// For authenticated users (especially admins), return full details
		const organizations = await Organization.find()
			.populate("createdBy", "fullName email")
			.populate("updatedBy", "fullName email")
			.sort({ createdAt: -1 });

		// Add user count for each organization
		const organizationsWithCounts = await Promise.all(
			organizations.map(async (org) => {
				const userCount = await org.getUserCount();
				const orgObject = org.toObject();
				return {
					...orgObject,
					userCount,
				};
			})
		);

		console.log(
			"Returning organizations with counts:",
			organizationsWithCounts.length
		);

		res.status(200).json({
			success: true,
			count: organizations.length,
			data: organizationsWithCounts,
		});
	} catch (error) {
		console.error("Get organizations error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching organizations",
		});
	}
};

// @desc    Get single organization
// @route   GET /api/organizations/:id
// @access  Private (Admin only)
const getOrganization = async (req, res) => {
	try {
		const organization = await Organization.findById(req.params.id)
			.populate("createdBy", "fullName email")
			.populate("updatedBy", "fullName email");

		if (!organization) {
			return res.status(404).json({
				success: false,
				message: "Organization not found",
			});
		}

		const userCount = await organization.getUserCount();

		res.status(200).json({
			success: true,
			data: {
				...organization.toObject(),
				userCount,
			},
		});
	} catch (error) {
		console.error("Get organization error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching organization",
		});
	}
};

// @desc    Create new organization
// @route   POST /api/organizations
// @access  Private (Admin only)
const createOrganization = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		let { name, domain, contactInfo, isActive } = req.body;

		// Normalize domain: extract domain from email or clean domain string
		if (domain) {
			domain = domain.toLowerCase().trim();
			// If it looks like an email, extract just the domain part
			if (domain.includes("@")) {
				domain = domain.split("@").pop();
			}
			// Remove any remaining @ symbols
			domain = domain.replace(/^@+/, "");
		}

		// Check if domain already exists
		const existingOrg = await Organization.findOne({ domain });
		if (existingOrg) {
			return res.status(400).json({
				success: false,
				message: `Domain ${domain} is already registered`,
			});
		}

		const organization = await Organization.create({
			name,
			domain,
			contactInfo,
			isActive: isActive !== undefined ? isActive : true, // Use provided value or default to true
			createdBy: req.user._id,
			updatedBy: req.user._id,
		});

		await organization.populate("createdBy", "fullName email");

		// Log the creation
		await AuditLog.logAction({
			user: req.user,
			action: "CREATE",
			resourceType: "Organization",
			resourceId: organization._id,
			resourceTitle: organization.name,
			description: `Created organization: ${organization.name} (${organization.domain})`,
			req,
			status: "SUCCESS",
		});

		res.status(201).json({
			success: true,
			data: organization,
			message: "Organization created successfully",
		});
	} catch (error) {
		console.error("Create organization error:", error);

		// Handle duplicate key error
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Domain already exists",
			});
		}

		res.status(500).json({
			success: false,
			message: "Server error while creating organization",
		});
	}
};

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private (Admin only)
const updateOrganization = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { id } = req.params;

		// Validate ObjectId format
		if (!id || id === "undefined" || !id.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				success: false,
				message: "Invalid organization ID format",
			});
		}

		let { name, domain, contactInfo, isActive } = req.body;

		// Normalize domain: extract domain from email or clean domain string
		if (domain) {
			domain = domain.toLowerCase().trim();
			// If it looks like an email, extract just the domain part
			if (domain.includes("@")) {
				domain = domain.split("@").pop();
			}
			// Remove any remaining @ symbols
			domain = domain.replace(/^@+/, "");
		}

		let organization = await Organization.findById(id);
		if (!organization) {
			return res.status(404).json({
				success: false,
				message: "Organization not found",
			});
		}

		// Check if domain is being changed and if it conflicts with another organization
		if (domain && domain !== organization.domain) {
			const existingOrg = await Organization.findOne({
				domain,
				_id: { $ne: req.params.id },
			});
			if (existingOrg) {
				return res.status(400).json({
					success: false,
					message: `Domain ${domain} is already registered`,
				});
			}
		}

		// Store old values for logging
		const oldValues = {
			name: organization.name,
			domain: organization.domain,
			contactInfo: organization.contactInfo,
			isActive: organization.isActive,
		};

		// Update organization
		organization = await Organization.findByIdAndUpdate(
			req.params.id,
			{
				name: name || organization.name,
				domain: domain || organization.domain,
				contactInfo:
					contactInfo !== undefined ? contactInfo : organization.contactInfo,
				isActive: isActive !== undefined ? isActive : organization.isActive,
				updatedBy: req.user._id,
			},
			{ new: true, runValidators: true }
		).populate("updatedBy", "fullName email");

		// Log the update
		await AuditLog.logAction({
			user: req.user,
			action: "UPDATE",
			resourceType: "Organization",
			resourceId: organization._id,
			resourceTitle: organization.name,
			description: `Updated organization: ${organization.name}`,
			details: { oldValues, newValues: req.body },
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			data: organization,
			message: "Organization updated successfully",
		});
	} catch (error) {
		console.error("Update organization error:", error);

		// Handle duplicate key error
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Domain already exists",
			});
		}

		res.status(500).json({
			success: false,
			message: "Server error while updating organization",
		});
	}
};

// @desc    Delete organization
// @route   DELETE /api/organizations/:id
// @access  Private (Admin only)
const deleteOrganization = async (req, res) => {
	try {
		const { id } = req.params;

		// Validate ObjectId format
		if (!id || id === "undefined" || !id.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				success: false,
				message: "Invalid organization ID format",
			});
		}

		const organization = await Organization.findById(id);
		if (!organization) {
			return res.status(404).json({
				success: false,
				message: "Organization not found",
			});
		}

		// Check if organization has users
		const userCount = await organization.getUserCount();
		if (userCount > 0) {
			return res.status(400).json({
				success: false,
				message: `Cannot delete organization. ${userCount} users are still associated with this organization.`,
			});
		}

		await organization.deleteOne();

		// Log the deletion
		await AuditLog.logAction({
			user: req.user,
			action: "DELETE",
			resourceType: "Organization",
			resourceId: organization._id,
			resourceTitle: organization.name,
			description: `Deleted organization: ${organization.name} (${organization.domain})`,
			req,
			status: "SUCCESS",
		});

		res.status(200).json({
			success: true,
			message: "Organization deleted successfully",
		});
	} catch (error) {
		console.error("Delete organization error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while deleting organization",
		});
	}
};

// @desc    Validate domain for email
// @route   GET /api/organizations/validate-domain/:domain
// @route   POST /api/organizations/validate-domain
// @access  Public
const validateDomain = async (req, res) => {
	try {
		console.log("=== validateDomain called ===");
		console.log("Method:", req.method);
		console.log("Params:", req.params);
		console.log("Body:", req.body);

		let emailDomain;
		let organizationName;

		// Handle GET request with domain parameter
		if (req.method === "GET" && req.params.domain) {
			emailDomain = req.params.domain.toLowerCase();
			console.log("Looking for domain:", emailDomain);

			// Find organization by domain
			const organization = await Organization.findOne({
				domain: emailDomain,
				isActive: true,
			});

			console.log(
				"Found organization:",
				organization ? organization.name : "None"
			);

			if (!organization) {
				console.log("Domain not found, returning 404");
				return res.status(404).json({
					success: false,
					message: `Domain ${emailDomain} is not registered with any organization`,
				});
			}

			console.log("Domain found, returning success");
			return res.status(200).json({
				success: true,
				message: `Domain ${emailDomain} is valid`,
				organization: {
					_id: organization._id,
					name: organization.name,
					domain: organization.domain,
				},
			});
		}

		// Handle POST request with email and organization name (existing logic)
		const { email, organizationName: reqOrgName } = req.body;
		organizationName = reqOrgName;

		if (!email || !organizationName) {
			return res.status(400).json({
				success: false,
				message: "Email and organization name are required",
			});
		}

		// Extract domain from email
		emailDomain = email.split("@")[1];
		if (!emailDomain) {
			return res.status(400).json({
				success: false,
				message: "Invalid email format",
			});
		}

		// Find organization by name
		const organization = await Organization.findOne({
			name: organizationName,
			isActive: true,
		});

		if (!organization) {
			return res.status(404).json({
				success: false,
				message: "Organization not found",
			});
		}

		// Check if email domain matches organization domain
		const isValid =
			emailDomain.toLowerCase() === organization.domain.toLowerCase();

		res.status(200).json({
			success: true,
			isValid,
			expectedDomain: organization.domain,
			providedDomain: emailDomain,
			message: isValid
				? "Email domain matches organization"
				: `Email domain should be ${organization.domain}`,
		});
	} catch (error) {
		console.error("Validate domain error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while validating domain",
		});
	}
};

module.exports = {
	getOrganizations,
	getOrganization,
	createOrganization,
	updateOrganization,
	deleteOrganization,
	validateDomain,
};
