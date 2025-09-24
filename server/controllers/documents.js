const { validationResult } = require("express-validator");
const Document = require("../models/Document");
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");
const { notifyOrgPublicResource } = require("./notifications");
const {
	uploadToCloudinary,
	deleteFromCloudinary,
	getDeliveryUrl,
} = require("../config/cloudinary");

// @desc    Get documents visible to the current user
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
	try {
		// Build visibility-aware query
		const query = {};
		if (req.user.role === "admin") {
			// Admin can see all
		} else {
			// Non-admin: public active, organization active, or own any status
			query.$or = [
				{ status: "active", visibility: "public" },
				{
					status: "active",
					visibility: "organization",
					organization: req.user.organization,
				},
				{ addedBy: req.user._id },
			];
		}

		const documents = await Document.find(query)
			.populate("addedBy", "fullName email")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: documents.length,
			data: documents,
		});
	} catch (error) {
		console.error("Get documents error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching documents",
		});
	}
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
const getDocument = async (req, res) => {
	try {
		const document = await Document.findById(req.params.id).populate(
			"addedBy",
			"fullName email"
		);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		// Check access permissions
		if (req.user.role !== "admin") {
			const isOwner =
				document.addedBy._id.toString() === req.user._id.toString();
			const isPublic =
				document.status === "active" && document.visibility === "public";
			const isOrg =
				document.status === "active" &&
				document.visibility === "organization" &&
				document.organization &&
				document.organization === req.user.organization;

			if (!isOwner && !isPublic && !isOrg) {
				return res.status(403).json({
					success: false,
					message: "Not authorized to access this document",
				});
			}
		}

		res.status(200).json({
			success: true,
			data: document,
		});
	} catch (error) {
		console.error("Get document error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching document",
		});
	}
};

// @desc    Upload new document
// @route   POST /api/documents
// @access  Private
const uploadDocument = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "No file uploaded",
			});
		}

		const { title, description, category, accessLevel } = req.body;
		const file = req.file;

		// Generate unique filename
		const fileExtension = path.extname(file.originalname);
		const fileName = path.parse(file.originalname).name; // Use name without extension
		const fileType = file.mimetype;
		const size = file.size;

		// Upload to Cloudinary
		console.log("Uploading file to Cloudinary:", fileName, "Type:", fileType);
		const cloudinaryResult = await uploadToCloudinary(
			file.buffer,
			fileName,
			fileType
		);
		console.log("Cloudinary upload successful:", cloudinaryResult.publicId);

		const document = await Document.create({
			title: title || fileName,
			description,
			fileName,
			originalName: file.originalname,
			mimeType: fileType,
			fileSize: size,
			fileExtension,
			category: category || "Other",
			project: req.body.project || "General",
			fileUrl: cloudinaryResult.url,
			cloudinaryPublicId: cloudinaryResult.publicId,
			storageType: "cloudinary",
			addedBy: req.user._id,
			organization: req.user.organization,
			// Map legacy accessLevel from client to visibility
			visibility: accessLevel || req.body.visibility || "public",
		});

		await document.populate("addedBy", "fullName email");

		// Don't return file data in response
		const responseData = document.toObject();
		responseData.fileData = undefined;
		responseData.url = document.fileUrl;

		// Notify org members if public
		if (document.visibility === "public") {
			await notifyOrgPublicResource({
				creator: req.user,
				organization: req.user.organization,
				resourceType: "Document",
				resourceId: document._id,
				title: document.title,
			});
		}

		res.status(201).json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		console.error("Upload document error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while uploading document",
		});
	}
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		let document = await Document.findById(req.params.id);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		// Check ownership
		if (
			document.addedBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this document",
			});
		}

		// Map accessLevel to visibility if provided
		if (req.body.accessLevel && !req.body.visibility) {
			req.body.visibility = req.body.accessLevel;
			delete req.body.accessLevel;
		}

		document = await Document.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).populate("addedBy", "fullName email");

		// Don't return file data
		const responseData = document.toObject();
		responseData.fileData = undefined;
		responseData.url = `/api/documents/${document._id}/download`;

		res.status(200).json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		console.error("Update document error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while updating document",
		});
	}
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
	try {
		const document = await Document.findById(req.params.id);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		// Check ownership
		if (
			document.addedBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this document",
			});
		}

		await document.deleteOne();

		res.status(200).json({
			success: true,
			message: "Document deleted successfully",
		});
	} catch (error) {
		console.error("Delete document error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while deleting document",
		});
	}
};

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
const downloadDocument = async (req, res) => {
	try {
		const document = await Document.findById(req.params.id);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		// For Cloudinary files, just redirect to the URL - no restrictions
		if (document.storageType === "cloudinary" && document.fileUrl) {
			return res.redirect(document.fileUrl);
		}

		// Fallback for legacy base64 files
		if (document.fileData) {
			try {
				const fileBuffer = Buffer.from(document.fileData, "base64");
				const encodedFilename = encodeURIComponent(document.fileName);
				const headers = {
					"Content-Type": document.mimeType || "application/octet-stream",
					"Content-Disposition": `attachment; filename="${document.fileName}"; filename*=UTF-8''${encodedFilename}`,
					"Content-Length": fileBuffer.length,
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
				};

				// Enhanced PDF handling
				if (
					document.mimeType === "application/pdf" ||
					document.fileName?.toLowerCase().endsWith(".pdf")
				) {
					headers["Content-Type"] = "application/pdf";
					headers["Accept-Ranges"] = "bytes";
					headers["Content-Transfer-Encoding"] = "binary";
				}

				res.set(headers);
				res.send(fileBuffer);
				return;
			} catch (error) {
				console.error("Error serving base64 file:", error);
				return res.status(500).json({
					success: false,
					message: "Error serving file",
				});
			}
		}

		// If no file data found
		return res.status(404).json({
			success: false,
			message: "File data not found - please re-upload the document",
		});
	} catch (error) {
		console.error("Download document error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while downloading document",
		});
	}
};

// @desc    Download individual file from multiple file document
// @route   GET /api/documents/:id/download/:fileIndex
// @access  Private
const downloadDocumentFile = async (req, res) => {
	try {
		const { id, fileIndex } = req.params;
		const document = await Document.findById(id);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		// Check if document has files array and the file index exists
		if (!document.files || !document.files[fileIndex]) {
			return res.status(404).json({
				success: false,
				message: "File not found",
			});
		}

		const file = document.files[fileIndex];

		// For Cloudinary files, redirect to the URL
		if (file.fileUrl) {
			return res.redirect(file.fileUrl);
		}

		// Fallback for older structure
		if (file.cloudinaryUrl) {
			return res.redirect(file.cloudinaryUrl);
		}

		// If no file URL found
		return res.status(404).json({
			success: false,
			message: "File URL not found",
		});
	} catch (error) {
		console.error("Download document file error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while downloading file",
		});
	}
};

// @desc    Preview document
// @route   GET /api/documents/:id/preview
// @access  Private
const previewDocument = async (req, res) => {
	try {
		const document = await Document.findById(req.params.id);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		// For Cloudinary files, just redirect to the URL - no restrictions
		if (document.storageType === "cloudinary" && document.fileUrl) {
			return res.redirect(document.fileUrl);
		}

		// Fallback for legacy base64 files
		if (document.fileData) {
			try {
				const fileBuffer = Buffer.from(document.fileData, "base64");
				const encodedFilename = encodeURIComponent(document.fileName);
				const headers = {
					"Content-Type": document.mimeType || "application/octet-stream",
					"Content-Disposition": `inline; filename="${document.fileName}"; filename*=UTF-8''${encodedFilename}`,
					"Content-Length": fileBuffer.length,
					"Cache-Control": "public, max-age=3600",
				};

				// Enhanced PDF handling for preview
				if (
					document.mimeType === "application/pdf" ||
					document.fileName?.toLowerCase().endsWith(".pdf")
				) {
					headers["Content-Type"] = "application/pdf";
					headers["Accept-Ranges"] = "bytes";
					headers["Content-Transfer-Encoding"] = "binary";
					headers["X-Content-Type-Options"] = "nosniff";
				}

				res.set(headers);
				res.send(fileBuffer);
				return;
			} catch (error) {
				console.error("Error serving base64 file for preview:", error);
				return res.status(500).json({
					success: false,
					message: "Error serving file",
				});
			}
		}

		// If no file data found
		return res.status(404).json({
			success: false,
			message: "File data not found - please re-upload the document",
		});
	} catch (error) {
		console.error("Preview document error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while previewing document",
		});
	}
};

// @desc    Upload multiple documents as a single document entry
// @route   POST /api/documents/multiple
// @access  Private
const uploadMultipleDocuments = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		if (!req.files || req.files.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No files uploaded",
			});
		}

		const { title, description, category, accessLevel } = req.body;
		const files = req.files;

		console.log(`Uploading ${files.length} files as a single document`);

		// Upload all files to Cloudinary and collect their data
		const uploadedFiles = [];
		let totalFileSize = 0;

		for (const file of files) {
			const fileExtension = path.extname(file.originalname);
			const fileName = path.parse(file.originalname).name;
			const fileType = file.mimetype;
			const size = file.size;
			totalFileSize += size;

			console.log("Uploading file to Cloudinary:", fileName, "Type:", fileType);
			const cloudinaryResult = await uploadToCloudinary(
				file.buffer,
				fileName,
				fileType
			);
			console.log("Cloudinary upload successful:", cloudinaryResult.publicId);

			uploadedFiles.push({
				fileName,
				originalName: file.originalname,
				mimeType: fileType,
				fileSize: size,
				fileExtension,
				fileUrl: cloudinaryResult.url,
				cloudinaryPublicId: cloudinaryResult.publicId,
				uploadedAt: new Date(),
			});
		}

		// Create a single document with multiple files
		const document = await Document.create({
			title: title || `Multiple Files (${files.length} files)`,
			description,
			category: category || "Other",
			project: req.body.project || "General",
			documentType: "multiple",
			files: uploadedFiles,
			totalFileSize,
			storageType: "cloudinary",
			addedBy: req.user._id,
			organization: req.user.organization,
			visibility: accessLevel || req.body.visibility || "public",
			// For backward compatibility, set the first file as primary
			fileName: uploadedFiles[0]?.fileName,
			originalName: uploadedFiles[0]?.originalName,
			mimeType: uploadedFiles[0]?.mimeType,
			fileSize: uploadedFiles[0]?.fileSize,
			fileExtension: uploadedFiles[0]?.fileExtension,
			fileUrl: uploadedFiles[0]?.fileUrl,
			cloudinaryPublicId: uploadedFiles[0]?.cloudinaryPublicId,
		});

		await document.populate("addedBy", "fullName email");

		// Don't return file data in response
		const responseData = document.toObject();
		responseData.fileData = undefined;
		responseData.url = document.fileUrl;

		// Notify org members if public
		if (document.visibility === "public") {
			await notifyOrgPublicResource({
				creator: req.user,
				organization: req.user.organization,
				resourceType: "Document",
				resourceId: document._id,
				title: document.title,
			});
		}

		res.status(201).json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		console.error("Upload multiple documents error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while uploading documents",
		});
	}
};

module.exports = {
	getDocuments,
	getDocument,
	uploadDocument,
	uploadMultipleDocuments,
	updateDocument,
	deleteDocument,
	downloadDocument,
	downloadDocumentFile,
	previewDocument,
};
