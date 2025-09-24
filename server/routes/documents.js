const express = require("express");
const multer = require("multer");
const { body } = require("express-validator");
const {
	getDocuments,
	getDocument,
	uploadDocument,
	uploadMultipleDocuments,
	updateDocument,
	deleteDocument,
	downloadDocument,
	downloadDocumentFile,
	previewDocument,
} = require("../controllers/documents");
const { protect, authorize, auditLog } = require("../middleware/auth");

const router = express.Router();

// Public routes (no authentication required)
router.get("/:id/download/:fileIndex", downloadDocumentFile);
router.get("/:id/download", downloadDocument);
router.get("/:id/preview", previewDocument);

// Apply authentication to remaining routes
router.use(protect);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		// Allow most common file types
		const allowedTypes =
			/jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx|xls|ppt|pptx|zip|rar|json|xml|html|css|js|md|rtf|odt|ods|odp/;
		const extname = allowedTypes.test(file.originalname.toLowerCase());
		const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

		if (mimetype || extname) {
			return cb(null, true);
		} else {
			cb(new Error("Invalid file type"));
		}
	},
});

// Validation rules
const documentValidation = [
	body("title")
		.optional()
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Title must be between 1 and 200 characters"),
	body("description")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Description must be less than 1000 characters"),
];

// Routes
router
	.route("/")
	.get(getDocuments)
	.post(upload.single("file"), documentValidation, uploadDocument);

// Multiple file upload route
router
	.route("/multiple")
	.post(upload.array("files", 10), documentValidation, uploadMultipleDocuments);

router
	.route("/:id")
	.get(getDocument)
	.put(documentValidation, updateDocument)
	.delete(deleteDocument);

module.exports = router;
