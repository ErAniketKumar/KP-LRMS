const { validationResult } = require("express-validator");
const Todo = require("../models/Todo");

// @desc    Get all todos for user
// @route   GET /api/todos
// @access  Private
const getTodos = async (req, res) => {
	try {
		const todos = await Todo.find({ createdBy: req.user._id })
			.populate("createdBy", "fullName email")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: todos.length,
			data: todos,
		});
	} catch (error) {
		console.error("Get todos error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching todos",
		});
	}
};

// @desc    Get single todo
// @route   GET /api/todos/:id
// @access  Private
const getTodo = async (req, res) => {
	try {
		const todo = await Todo.findById(req.params.id).populate(
			"createdBy",
			"fullName email"
		);

		if (!todo) {
			return res.status(404).json({
				success: false,
				message: "Todo not found",
			});
		}

		// Check ownership
		if (
			todo.createdBy._id.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to access this todo",
			});
		}

		res.status(200).json({
			success: true,
			data: todo,
		});
	} catch (error) {
		console.error("Get todo error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching todo",
		});
	}
};

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
const createTodo = async (req, res) => {
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
			description,
			priority,
			status,
			dueDate,
			category,
			tags,
			assignedTo,
		} = req.body;

		const todo = await Todo.create({
			title,
			description,
			priority: priority || "medium",
			status: status || "to-do",
			dueDate,
			category: category || "General Task",
			tags,
			assignedTo: assignedTo || req.user._id,
			createdBy: req.user._id,
		});

		await todo.populate("createdBy", "fullName email");

		res.status(201).json({
			success: true,
			data: todo,
		});
	} catch (error) {
		console.error("Create todo error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while creating todo",
		});
	}
};

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		let todo = await Todo.findById(req.params.id);

		if (!todo) {
			return res.status(404).json({
				success: false,
				message: "Todo not found",
			});
		}

		// Check ownership
		if (
			todo.createdBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this todo",
			});
		}

		todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).populate("createdBy", "fullName email");

		res.status(200).json({
			success: true,
			data: todo,
		});
	} catch (error) {
		console.error("Update todo error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while updating todo",
		});
	}
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = async (req, res) => {
	try {
		const todo = await Todo.findById(req.params.id);

		if (!todo) {
			return res.status(404).json({
				success: false,
				message: "Todo not found",
			});
		}

		// Check ownership
		if (
			todo.createdBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this todo",
			});
		}

		await todo.deleteOne();

		res.status(200).json({
			success: true,
			message: "Todo deleted successfully",
		});
	} catch (error) {
		console.error("Delete todo error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while deleting todo",
		});
	}
};

// @desc    Complete/Uncomplete todo
// @route   PATCH /api/todos/:id/complete
// @access  Private
const completeTodo = async (req, res) => {
	try {
		let todo = await Todo.findById(req.params.id);

		if (!todo) {
			return res.status(404).json({
				success: false,
				message: "Todo not found",
			});
		}

		// Check ownership
		if (
			todo.createdBy.toString() !== req.user._id.toString() &&
			req.user.role !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this todo",
			});
		}

		// Toggle completion status
		const newStatus = todo.status === "completed" ? "pending" : "completed";
		const completedAt = newStatus === "completed" ? new Date() : null;

		todo = await Todo.findByIdAndUpdate(
			req.params.id,
			{
				status: newStatus,
				completedAt,
			},
			{
				new: true,
				runValidators: true,
			}
		).populate("createdBy", "fullName email");

		res.status(200).json({
			success: true,
			data: todo,
		});
	} catch (error) {
		console.error("Complete todo error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while updating todo",
		});
	}
};

// @desc    Get todo statistics
// @route   GET /api/todos/stats
// @access  Private
const getTodoStats = async (req, res) => {
	try {
		const todos = await Todo.find({ createdBy: req.user._id });

		const stats = {
			total: todos.length,
			completed: todos.filter((todo) => todo.status === "completed").length,
			pending: todos.filter((todo) => todo.status === "pending").length,
			inProgress: todos.filter((todo) => todo.status === "in-progress").length,
			overdue: todos.filter((todo) => {
				if (!todo.dueDate) return false;
				return (
					new Date(todo.dueDate) < new Date() && todo.status !== "completed"
				);
			}).length,
			byPriority: {
				high: todos.filter((todo) => todo.priority === "high").length,
				medium: todos.filter((todo) => todo.priority === "medium").length,
				low: todos.filter((todo) => todo.priority === "low").length,
			},
		};

		res.status(200).json({
			success: true,
			data: stats,
		});
	} catch (error) {
		console.error("Get todo stats error:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching todo statistics",
		});
	}
};

module.exports = {
	getTodos,
	getTodo,
	createTodo,
	updateTodo,
	deleteTodo,
	completeTodo,
	getTodoStats,
};
