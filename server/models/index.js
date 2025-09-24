// Import all models
const User = require("./User");
const Link = require("./Link");
const Credential = require("./Credential");
const Document = require("./Document");
const Todo = require("./Todo");
const AuditLog = require("./AuditLog");
const ShortUrl = require("./ShortUrl");
const Organization = require("./Organization");

// Export all models
module.exports = {
	User,
	Link,
	Credential,
	Document,
	Todo,
	AuditLog,
	ShortUrl,
	Organization,
};

// Also export individual models for easy importing
module.exports.User = User;
module.exports.Link = Link;
module.exports.Credential = Credential;
module.exports.Document = Document;
module.exports.Todo = Todo;
module.exports.AuditLog = AuditLog;
module.exports.ShortUrl = ShortUrl;
