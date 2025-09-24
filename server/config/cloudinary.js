const { v2: cloudinary } = require("cloudinary");

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file buffer to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName, mimeType) => {
	try {
		return new Promise((resolve, reject) => {
			const uploadOptions = {
				public_id: `documents/${Date.now()}_${fileName}`,
				use_filename: true,
				unique_filename: false,
				overwrite: false,
				type: "upload",
				access_mode: "public", // ensure public access
			};

			// Explicitly set resource_type based on file type
			if (mimeType?.startsWith("image/")) {
				uploadOptions.resource_type = "image";
			} else if (mimeType?.startsWith("video/")) {
				uploadOptions.resource_type = "video";
			} else {
				// For PDFs and all other documents, use raw
				uploadOptions.resource_type = "raw";
			}

			cloudinary.uploader
				.upload_stream(uploadOptions, (error, result) => {
					if (error) {
						reject(error);
					} else {
						// Use Cloudinary's returned secure_url for all file types
						const fileUrl = result.secure_url;

						resolve({
							url: fileUrl,
							publicId: result.public_id,
							resourceType: result.resource_type,
							format: result.format,
							bytes: result.bytes,
						});
					}
				})
				.end(fileBuffer);
		});
	} catch (error) {
		throw new Error(`Cloudinary upload failed: ${error.message}`);
	}
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
	try {
		const result = await cloudinary.uploader.destroy(publicId, {
			resource_type: resourceType,
		});
		return result;
	} catch (error) {
		throw new Error(`Cloudinary delete failed: ${error.message}`);
	}
};

// Generate a delivery URL for a Cloudinary asset
const getDeliveryUrl = (publicId, options = {}) => {
	// Use public URLs for all file types - let Cloudinary auto-determine resource type
	return cloudinary.url(publicId, {
		resource_type: "auto",
		secure: true,
		sign_url: false, // All files are public, no signing needed
		type: "upload", // Use upload type for all files
		...options,
	});
};

// Get file content directly from Cloudinary using public URL
const getFileContentFromCloudinary = async (
	publicId,
	resourceType = "auto"
) => {
	try {
		// Generate a simple public URL - use auto resource type
		const publicUrl = cloudinary.url(publicId, {
			resource_type: resourceType,
			secure: true,
			sign_url: false,
			type: "upload",
		});

		return publicUrl;
	} catch (error) {
		console.error("Error generating public URL:", error);
		throw new Error(`Failed to generate public URL: ${error.message}`);
	}
};

module.exports = {
	cloudinary,
	uploadToCloudinary,
	deleteFromCloudinary,
	getDeliveryUrl,
	getFileContentFromCloudinary,
};
