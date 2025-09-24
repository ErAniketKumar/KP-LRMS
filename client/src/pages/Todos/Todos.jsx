import React, { useState, useEffect } from "react";
import {
	CheckSquare,
	Plus,
	Square,
	Edit,
	Trash2,
	Search,
	Filter,
	Calendar,
	User,
	AlertCircle,
	Clock,
	Tag,
} from "lucide-react";
import { useResource } from "../../context/ResourceContext";
import TodoModal from "../../components/Modals/TodoModal";

const Todos = () => {
	const { todos, fetchTodos, completeTodo, deleteTodo, loading } =
		useResource();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTodo, setEditingTodo] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("");
	const [filterPriority, setFilterPriority] = useState("");

	useEffect(() => {
		fetchTodos();
	}, [fetchTodos]);

	const handleEdit = (todo) => {
		setEditingTodo(todo);
		setIsModalOpen(true);
	};

	const handleComplete = async (id, currentStatus) => {
		if (id && currentStatus !== "completed") {
			await completeTodo(id);
		}
	};

	const handleDelete = async (id) => {
		if (window.confirm("Are you sure you want to delete this task?")) {
			await deleteTodo(id);
		}
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingTodo(null);
	};

	// Normalize statuses between backend (to-do) and UI (pending)
	const normalizeStatus = (status) => {
		if (!status) return "pending";
		return status === "to-do" ? "pending" : status;
	};

	const safeTodos = Array.isArray(todos) ? todos : [];

	const filteredTodos = safeTodos
		? safeTodos.filter((todo) => {
				const matchesSearch =
					(todo.title?.toLowerCase() || "").includes(
						searchTerm.toLowerCase()
					) ||
					(todo.description?.toLowerCase() || "").includes(
						searchTerm.toLowerCase()
					);
				const matchesStatus =
					!filterStatus || normalizeStatus(todo.status) === filterStatus;
				const matchesPriority =
					!filterPriority || todo.priority === filterPriority;
				return matchesSearch && matchesStatus && matchesPriority;
		  })
		: [];

	const getPriorityColor = (priority) => {
		const colors = {
			high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
			medium:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
			low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
		};
		return (
			colors[priority] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
		);
	};

	const getStatusColor = (status) => {
		const colors = {
			completed:
				"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
			"in-progress":
				"bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
			pending:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
		};
		return (
			colors[status] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
		);
	};

	const getCategoryColor = (category) => {
		const colors = {
			development:
				"bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
			design:
				"bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
			testing:
				"bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
			documentation:
				"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
			meeting:
				"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
			review:
				"bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
		};
		return (
			colors[category] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
		);
	};

	const isOverdue = (dueDate) => {
		if (!dueDate) return false;
		return (
			new Date(dueDate) < new Date() &&
			todos.find((t) => t.dueDate === dueDate)?.status !== "completed"
		);
	};

	const formatDueDate = (dueDate) => {
		if (!dueDate) return null;
		const date = new Date(dueDate);
		const today = new Date();
		const diffTime = date - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return "Due today";
		if (diffDays === 1) return "Due tomorrow";
		if (diffDays === -1) return "Due yesterday";
		if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
		if (diffDays <= 7) return `Due in ${diffDays} days`;
		return date.toLocaleDateString();
	};

	// Stats
	const completedTodos = Array.isArray(todos)
		? todos.filter((todo) => normalizeStatus(todo.status) === "completed")
				.length
		: 0;
	const inProgressTodos = Array.isArray(todos)
		? todos.filter((todo) => normalizeStatus(todo.status) === "in-progress")
				.length
		: 0;
	const pendingTodos = Array.isArray(todos)
		? todos.filter((todo) => normalizeStatus(todo.status) === "pending").length
		: 0;
	const overdueTodos = Array.isArray(todos)
		? todos.filter((todo) => isOverdue(todo.dueDate)).length
		: 0;

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
					</div>
					<div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
				</div>
				<div className="grid grid-cols-1 gap-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
						>
							<div className="space-y-3">
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
								<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
								<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Tasks Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Track and manage your project tasks ({safeTodos.length} total)
					</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
				>
					<Plus className="h-4 w-4" />
					<span>Create Task</span>
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
					<div className="flex items-center">
						<CheckSquare className="h-8 w-8 text-green-500" />
						<div className="ml-3">
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Completed
							</p>
							<p className="text-2xl font-semibold text-gray-900 dark:text-white">
								{completedTodos}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
					<div className="flex items-center">
						<Clock className="h-8 w-8 text-blue-500" />
						<div className="ml-3">
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								In Progress
							</p>
							<p className="text-2xl font-semibold text-gray-900 dark:text-white">
								{inProgressTodos}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
					<div className="flex items-center">
						<Square className="h-8 w-8 text-yellow-500" />
						<div className="ml-3">
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Pending
							</p>
							<p className="text-2xl font-semibold text-gray-900 dark:text-white">
								{pendingTodos}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
					<div className="flex items-center">
						<AlertCircle className="h-8 w-8 text-red-500" />
						<div className="ml-3">
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Overdue
							</p>
							<p className="text-2xl font-semibold text-gray-900 dark:text-white">
								{overdueTodos}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Search and Filter */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search tasks..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						/>
					</div>
					<div className="flex space-x-2">
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						>
							<option value="">All Status</option>
							<option value="pending">Pending</option>
							<option value="in-progress">In Progress</option>
							<option value="completed">Completed</option>
						</select>
						<select
							value={filterPriority}
							onChange={(e) => setFilterPriority(e.target.value)}
							className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						>
							<option value="">All Priority</option>
							<option value="high">High</option>
							<option value="medium">Medium</option>
							<option value="low">Low</option>
						</select>
					</div>
				</div>
			</div>

			{/* Tasks List */}
			{filteredTodos.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								{searchTerm || filterStatus || filterPriority
									? "No tasks found"
									: "No tasks created"}
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								{searchTerm || filterStatus || filterPriority
									? "Try adjusting your search or filter criteria"
									: "Create your first task to get organized"}
							</p>
							{!searchTerm && !filterStatus && !filterPriority && (
								<button
									onClick={() => setIsModalOpen(true)}
									className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
								>
									Create Your First Task
								</button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					{filteredTodos.map((todo, idx) => (
						<div
							key={todo._id || `${todo.title || "todo"}-${idx}`}
							className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow ${
								todo.status === "completed" ? "opacity-75" : ""
							}`}
						>
							<div className="flex items-start justify-between">
								<div className="flex items-start space-x-4 flex-1">
									<button
										onClick={() => handleComplete(todo._id, todo.status)}
										className={`mt-1 transition-colors ${
											todo.status === "completed"
												? "text-green-600 hover:text-green-700"
												: "text-gray-400 hover:text-green-600"
										}`}
									>
										{todo.status === "completed" ? (
											<CheckSquare className="h-5 w-5" />
										) : (
											<Square className="h-5 w-5" />
										)}
									</button>

									<div className="flex-1">
										<div className="flex items-center space-x-3 mb-2">
											<h3
												className={`text-lg font-semibold ${
													todo.status === "completed"
														? "line-through text-gray-500 dark:text-gray-400"
														: "text-gray-900 dark:text-white"
												}`}
											>
												{todo.title}
											</h3>
											{isOverdue(todo.dueDate) && (
												<AlertCircle className="h-5 w-5 text-red-500" />
											)}
										</div>

										{todo.description && (
											<p className="text-gray-600 dark:text-gray-400 mb-3">
												{todo.description}
											</p>
										)}

										<div className="flex items-center space-x-4 text-sm">
											<div className="flex items-center space-x-2">
												<span
													className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
														normalizeStatus(todo.status)
													)}`}
												>
													{(normalizeStatus(todo.status) || "")
														.replace("-", " ")
														.replace(/\b\w/g, (l) => l.toUpperCase())}
												</span>
												<span
													className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
														todo.priority
													)}`}
												>
													{todo.priority} priority
												</span>
												{todo.category && (
													<span
														className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
															todo.category
														)}`}
													>
														{todo.category}
													</span>
												)}
											</div>
										</div>

										<div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
											{todo.dueDate && (
												<div
													className={`flex items-center ${
														isOverdue(todo.dueDate)
															? "text-red-600 dark:text-red-400"
															: ""
													}`}
												>
													<Calendar className="h-4 w-4 mr-1" />
													<span>{formatDueDate(todo.dueDate)}</span>
												</div>
											)}
											<div className="flex items-center">
												<User className="h-4 w-4 mr-1" />
												<span>{todo.createdBy?.fullName || "Unknown"}</span>
											</div>
										</div>
									</div>
								</div>

								<div className="flex items-center space-x-2 ml-4">
									<button
										onClick={() => handleEdit(todo)}
										className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
									>
										<Edit className="h-4 w-4" />
									</button>
									<button
										onClick={() => handleDelete(todo._id)}
										className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Modal */}
			<TodoModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				todo={editingTodo}
			/>
		</div>
	);
};

export default Todos;
