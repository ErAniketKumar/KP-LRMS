const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (userId) => {
	return jwt.sign(
		{ id: userId },
		process.env.JWT_SECRET || "fallback_secret_key",
		{
			expiresIn: process.env.JWT_EXPIRE || "7d",
		}
	);
};

// Generate refresh token
const generateRefreshToken = (userId) => {
	return jwt.sign(
		{ id: userId, type: "refresh" },
		process.env.JWT_REFRESH_SECRET ||
			process.env.JWT_SECRET ||
			"fallback_refresh_secret",
		{
			expiresIn: "30d",
		}
	);
};

// Verify token
const verifyToken = (token) => {
	try {
		return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
	} catch (error) {
		throw new Error("Invalid token");
	}
};

// Verify refresh token
const verifyRefreshToken = (token) => {
	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_REFRESH_SECRET ||
				process.env.JWT_SECRET ||
				"fallback_refresh_secret"
		);

		if (decoded.type !== "refresh") {
			throw new Error("Invalid refresh token");
		}

		return decoded;
	} catch (error) {
		throw new Error("Invalid refresh token");
	}
};

// Extract token from header
const extractTokenFromHeader = (authHeader) => {
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	return authHeader.split(" ")[1];
};

// Generate token with custom payload
const generateCustomToken = (payload, expiresIn = "1h") => {
	return jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret_key", {
		expiresIn,
	});
};

// Decode token without verification (useful for expired tokens)
const decodeToken = (token) => {
	try {
		return jwt.decode(token);
	} catch (error) {
		return null;
	}
};

// Check if token is expired
const isTokenExpired = (token) => {
	try {
		const decoded = jwt.decode(token);
		if (!decoded || !decoded.exp) {
			return true;
		}

		const currentTime = Math.floor(Date.now() / 1000);
		return decoded.exp < currentTime;
	} catch (error) {
		return true;
	}
};

// Get token expiration time
const getTokenExpiration = (token) => {
	try {
		const decoded = jwt.decode(token);
		if (!decoded || !decoded.exp) {
			return null;
		}

		return new Date(decoded.exp * 1000);
	} catch (error) {
		return null;
	}
};

// Generate API key (for service-to-service communication)
const generateApiKey = (serviceId, permissions = []) => {
	return jwt.sign(
		{
			serviceId,
			permissions,
			type: "api_key",
		},
		process.env.JWT_SECRET || "fallback_secret_key",
		{
			expiresIn: "1y",
		}
	);
};

// Verify API key
const verifyApiKey = (token) => {
	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "fallback_secret_key"
		);

		if (decoded.type !== "api_key") {
			throw new Error("Invalid API key");
		}

		return decoded;
	} catch (error) {
		throw new Error("Invalid API key");
	}
};

// Create token with specific claims
const createTokenWithClaims = (userId, claims = {}) => {
	const payload = {
		id: userId,
		...claims,
		iat: Math.floor(Date.now() / 1000),
	};

	return jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret_key", {
		expiresIn: process.env.JWT_EXPIRE || "7d",
	});
};

// Send token response with cookie
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
	// Create token
	const token = generateToken(user._id);
	const refreshToken = generateRefreshToken(user._id);

	const options = {
		expires: new Date(
			Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	};

	// Remove password from user object
	const userResponse = user.toObject();
	delete userResponse.password;
	delete userResponse.passwordResetToken;
	delete userResponse.passwordResetExpire;
	delete userResponse.emailVerificationToken;
	delete userResponse.emailVerificationExpire;

	res
		.status(statusCode)
		.cookie("token", token, options)
		.cookie("refreshToken", refreshToken, {
			...options,
			expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
		})
		.json({
			success: true,
			message,
			token,
			refreshToken,
			user: userResponse,
		});
};

// Clear token cookies
const clearTokenCookies = (res) => {
	res.cookie("token", "none", {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	res.cookie("refreshToken", "none", {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});
};

module.exports = {
	generateToken,
	generateRefreshToken,
	verifyToken,
	verifyRefreshToken,
	extractTokenFromHeader,
	generateCustomToken,
	decodeToken,
	isTokenExpired,
	getTokenExpiration,
	generateApiKey,
	verifyApiKey,
	createTokenWithClaims,
	sendTokenResponse,
	clearTokenCookies,
};
