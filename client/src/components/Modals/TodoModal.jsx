import React, { useState, useEffect } from "react";
import { X, CheckSquare, Calendar, Users, AlertCircle } from "lucide-react";
import { useResource } from "../../context/ResourceContext";

const TodoModal = ({ isOpen, onClose, todo = null }) => {
	const { createTodo, updateTodo } = useResource();
	const isEditing = !!todo;

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		priority: "medium",
		category: "",
		dueDate: "",
		assignedTo: "",
	});

	// Update form data when todo prop changes
	useEffect(() => {
		if (todo) {
			setFormData({
				title: todo.title || "",
				description: todo.description || "",
				priority: todo.priority || "medium",
				category: todo.category || "",
				dueDate: todo.dueDate
					? new Date(todo.dueDate).toISOString().split("T")[0]
					: "",
				assignedTo: todo.assignedTo?._id || "",
			});
		} else {
			setFormData({
				title: "",
				description: "",
				priority: "medium",
				category: "",
				dueDate: "",
				assignedTo: "",
			});
		}
	}, [todo]);

	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const todoData = {
				...formData,
				dueDate: formData.dueDate ? formData.dueDate : null,
			};

			if (isEditing && (todo?._id || todo?.id)) {
				await updateTodo(todo._id || todo.id, todoData);
			} else {
				await createTodo(todoData);
			}

			onClose();
			setFormData({
				title: "",
				description: "",
				priority: "medium",
				category: "",
				dueDate: "",
				assignedTo: "",
			});
		} catch (error) {
			console.error("Error saving todo:", error);
		} finally {
			setLoading(false);
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "high":
				return "text-red-600 bg-red-50 border-red-200";
			case "medium":
				return "text-yellow-600 bg-yellow-50 border-yellow-200";
			case "low":
				return "text-green-600 bg-green-50 border-green-200";
			default:
				return "text-gray-600 bg-gray-50 border-gray-200";
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
				<div
					className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
					onClick={onClose}
				></div>

				<div
					className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg relative z-10"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
							<CheckSquare className="h-5 w-5 mr-2 text-orange-500" />
							{isEditing ? "Edit Task" : "Create New Task"}
						</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Title *
							</label>
							<input
								type="text"
								name="title"
								value={formData.title}
								onChange={handleChange}
								required
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
								placeholder="Enter task title"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Description
							</label>
							<textarea
								name="description"
								value={formData.description}
								onChange={handleChange}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
								placeholder="Optional description"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Priority
								</label>
								<div className="relative">
									<AlertCircle className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
									<select
										name="priority"
										value={formData.priority}
										onChange={handleChange}
										className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Category
								</label>
								<select
									name="category"
									value={formData.category}
									onChange={handleChange}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
								>
									<option value="">Select category</option>
									<option value="development">Development</option>
									<option value="design">Design</option>
									<option value="testing">Testing</option>
									<option value="documentation">Documentation</option>
									<option value="meeting">Meeting</option>
									<option value="review">Review</option>
									<option value="other">Other</option>
								</select>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Due Date
							</label>
							<div className="relative">
								<Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
								<input
									type="date"
									name="dueDate"
									value={formData.dueDate}
									onChange={handleChange}
									className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
								/>
							</div>
						</div>

						{formData.priority && (
							<div className="flex items-center space-x-2">
								<span className="text-sm text-gray-600 dark:text-gray-400">
									Priority:
								</span>
								<span
									className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
										formData.priority
									)}`}
								>
									{formData.priority.charAt(0).toUpperCase() +
										formData.priority.slice(1)}
								</span>
							</div>
						)}

						<div className="flex justify-end space-x-3 pt-4">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
								disabled={loading}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
								disabled={loading}
							>
								{loading
									? "Saving..."
									: isEditing
									? "Update Task"
									: "Create Task"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default TodoModal;
