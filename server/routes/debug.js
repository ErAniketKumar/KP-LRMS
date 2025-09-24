const express = require("express");
const router = express.Router();

// Debug endpoint to check environment variables (REMOVE IN PRODUCTION)
router.get("/env-check", (req, res) => {
	res.json({
		NODE_ENV: process.env.NODE_ENV,
		CLIENT_URL: process.env.CLIENT_URL,
		hasMongoURI: !!process.env.MONGODB_URI,
		hasEmailUser: !!process.env.EMAIL_USER,
		// Don't expose sensitive values, just check if they exist
		timestamp: new Date().toISOString(),
	});
});

module.exports = router;
