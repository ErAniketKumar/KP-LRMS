const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const connectDB = require("./config/database");

console.log("=== Environment Variables Debug ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("PORT:", process.env.PORT);
console.log("====================================");

const app = express();

// CORS configuration - place BEFORE security/limiting to ensure preflight succeeds
app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			const allowedOrigins = [
				"http://localhost:5173",
				"http://localhost:5174",
				"https://kp-ani-lrms.vercel.app", // Frontend production URL
				"https://kplrms.vercel.app", // Old backend URL for testing
			];

			// Check if origin is in allowed origins or is a Vercel deployment
			if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		// Let cors package reflect requested headers by default; avoid being overly restrictive
		// allowedHeaders intentionally omitted to allow Access-Control-Request-Headers reflection
		optionsSuccessStatus: 200,
	})
);
// Explicitly handle preflight for all routes (Express 5 compatible)
app.options(/.*/, cors());

// Security middleware (after CORS so headers are included even on blocked requests)
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === "development" ? 1000 : 100, // higher limit for development
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
	// Don't rate limit CORS preflight
	skip: (req) => req.method === "OPTIONS",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/links", require("./routes/links"));
app.use("/api/credentials", require("./routes/credentials"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/todos", require("./routes/todos"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/search", require("./routes/search"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/organizations", require("./routes/organizations"));
app.use("/api/shorturl", require("./routes/shorturl"));

// Public short URL redirect route
app.use("/s", require("./routes/shorturl"));

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Server is running properly",
		timestamp: new Date().toISOString(),
	});
});

// Global error handler
app.use((err, req, res, next) => {
	console.error(err.stack);

	if (err.name === "ValidationError") {
		const errors = Object.values(err.errors).map((val) => val.message);
		return res.status(400).json({
			success: false,
			message: "Validation Error",
			errors,
		});
	}

	if (err.name === "CastError") {
		return res.status(400).json({
			success: false,
			message: "Invalid ID format",
		});
	}

	res.status(err.statusCode || 500).json({
		success: false,
		message: err.message || "Server Error",
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});

const PORT = process.env.PORT || 5000;

// Only listen when not in production (Vercel handles this)
if (process.env.NODE_ENV !== "production") {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
		console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
	});
}

module.exports = app;
