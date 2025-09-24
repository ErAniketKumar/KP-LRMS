const express = require("express");
const { body } = require("express-validator");
const {
	getTodos,
	getTodo,
	createTodo,
	updateTodo,
	deleteTodo,
	completeTodo,
	getTodoStats,
} = require("../controllers/todos");
const { protect, authorize, auditLog } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
const todoValidation = [
	body("title")
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Title is required and must be between 1 and 200 characters"),
	body("description")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Description must be less than 1000 characters"),
	body("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("Priority must be low, medium, or high"),
	body("status")
		.optional()
		.isIn(["to-do", "in-progress", "completed", "cancelled"])
		.withMessage("Status must be to-do, in-progress, completed, or cancelled"),
	body("dueDate")
		.optional()
		.custom((value) => {
			if (value && !Date.parse(value)) {
				throw new Error("Due date must be a valid date");
			}
			return true;
		}),
];

// Routes
router.get("/stats", getTodoStats);

router.route("/").get(getTodos).post(todoValidation, createTodo);

router
	.route("/:id")
	.get(getTodo)
	.put(todoValidation, updateTodo)
	.delete(deleteTodo);

router.patch("/:id/complete", completeTodo);

module.exports = router;
