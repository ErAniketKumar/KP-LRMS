import React, { useState, useEffect } from "react";
import {
	Link as LinkIcon,
	Plus,
	ExternalLink,
	Edit,
	Trash2,
	Search,
	Filter,
	Tag,
	Globe,
	Calendar,
} from "lucide-react";
import { useResource } from "../../context/ResourceContext";
import LinkModal from "../../components/Modals/LinkModal";

const Links = () => {
	const { links, linksPagination, fetchLinks, deleteLink, loading } =
		useResource();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingLink, setEditingLink] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterCategory, setFilterCategory] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [searchInput, setSearchInput] = useState("");

	const handleSearch = () => {
		setSearchTerm(searchInput);
		setCurrentPage(1);
	};

	const handleFilterChange = (category) => {
		setFilterCategory(category);
		setCurrentPage(1);
	};

	// Helper function to format category display names
	const formatCategoryName = (category) => {
		const categoryNames = {
			// Work-focused categories
			bugsheet: "Bug Sheet",
			"credentials-sheet": "Credentials Sheet",
			"prd-doc": "PRD Document",
			"time-sheet": "Time Sheet",
			"workreport-sheet": "Work Report Sheet",
			"jira-ticket": "Jira Ticket Link",
			// General categories
			development: "Development",
			design: "Design",
			documentation: "Documentation",
			tools: "Tools",
			reference: "Reference",
			resources: "Resources",
			other: "Other",
		};
		return (
			categoryNames[category] ||
			category.charAt(0).toUpperCase() + category.slice(1)
		);
	};

	useEffect(() => {
		fetchLinks({
			page: currentPage,
			limit: 10,
			search: searchTerm,
			category: filterCategory,
		});
	}, [fetchLinks, currentPage, searchTerm, filterCategory]);

	const handleEdit = (link) => {
		setEditingLink(link);
		setIsModalOpen(true);
	};

	const handleDelete = async (id) => {
		if (window.confirm("Are you sure you want to delete this link?")) {
			await deleteLink(id);
		}
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingLink(null);
	};

	const filteredLinks = Array.isArray(links) ? links : [];

	const categories = Array.isArray(links)
		? [...new Set(links.map((link) => link.category).filter(Boolean))]
		: [];

	const getCategoryColor = (category) => {
		const colors = {
			// Work-focused categories
			bugsheet: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
			"credentials-sheet":
				"bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
			"prd-doc":
				"bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
			"time-sheet":
				"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
			"workreport-sheet":
				"bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
			"jira-ticket":
				"bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400",
			// General categories
			development:
				"bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400",
			design:
				"bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
			documentation:
				"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
			tools:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
			reference:
				"bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400",
			resources:
				"bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
			other: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
		};
		return (
			colors[category] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
		);
	};

	const getAccessLevelColor = (level) => {
		const colors = {
			public:
				"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
			private: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
			team: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
			organization:
				"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
		};
		return (
			colors[level] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
		);
	};

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
						Links Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Manage and organize your project links ({links.length} total)
					</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
				>
					<Plus className="h-4 w-4" />
					<span>Add Link</span>
				</button>
			</div>

			{/* Search and Filter */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search links..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && handleSearch()}
							className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						/>
						<button
							onClick={handleSearch}
							className="absolute right-2 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
						>
							Search
						</button>
					</div>
					<div className="relative">
						<Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<select
							value={filterCategory}
							onChange={(e) => handleFilterChange(e.target.value)}
							className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						>
							<option value="">All Categories</option>
							{categories.map((category) => (
								<option key={category} value={category}>
									{formatCategoryName(category)}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Links List */}
			{filteredLinks.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								{searchTerm || filterCategory
									? "No links found"
									: "No links yet"}
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								{searchTerm || filterCategory
									? "Try adjusting your search or filter criteria"
									: "Start by adding your first project link"}
							</p>
							{!searchTerm && !filterCategory && (
								<button
									onClick={() => setIsModalOpen(true)}
									className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
								>
									Add Your First Link
								</button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4">
					{filteredLinks.map((link) => (
						<div
							key={link._id}
							className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center space-x-3 mb-2">
										<Globe className="h-5 w-5 text-gray-400" />
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
											{link.title}
										</h3>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
										>
											<ExternalLink className="h-4 w-4" />
										</a>
									</div>

									{link.description && (
										<p className="text-gray-600 dark:text-gray-400 mb-3">
											{link.description}
										</p>
									)}

									<div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
										<span className="flex items-center">
											<Calendar className="h-4 w-4 mr-1" />
											{new Date(link.createdAt).toLocaleDateString()}
										</span>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 truncate max-w-xs"
										>
											{link.url}
										</a>
									</div>

									<div className="flex items-center space-x-2 mt-3">
										{link.category && (
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
													link.category
												)}`}
											>
												{formatCategoryName(link.category)}
											</span>
										)}
										{(link.visibility || link.accessLevel) && (
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${getAccessLevelColor(
													link.visibility || link.accessLevel
												)}`}
											>
												{link.visibility || link.accessLevel}
											</span>
										)}
										{link.tags && link.tags.length > 0 && (
											<div className="flex items-center space-x-1">
												<Tag className="h-3 w-3 text-gray-400" />
												<span className="text-xs text-gray-500 dark:text-gray-400">
													{link.tags.join(", ")}
												</span>
											</div>
										)}
									</div>
								</div>

								<div className="flex items-center space-x-2 ml-4">
									<button
										onClick={() => handleEdit(link)}
										className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
									>
										<Edit className="h-4 w-4" />
									</button>
									<button
										onClick={() => handleDelete(link._id)}
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
			<LinkModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				link={editingLink}
			/>

			{/* Pagination */}
			{linksPagination.pages > 1 && (
				<div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
					<div className="text-sm text-gray-700 dark:text-gray-300">
						Showing {(linksPagination.page - 1) * linksPagination.limit + 1} to{" "}
						{Math.min(
							linksPagination.page * linksPagination.limit,
							linksPagination.total
						)}{" "}
						of {linksPagination.total} links
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
							disabled={linksPagination.page <= 1 || loading}
							className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Previous
						</button>

						{/* Page numbers */}
						<div className="flex items-center space-x-1">
							{Array.from(
								{ length: Math.min(5, linksPagination.pages) },
								(_, i) => {
									let pageNum;
									if (linksPagination.pages <= 5) {
										pageNum = i + 1;
									} else if (linksPagination.page <= 3) {
										pageNum = i + 1;
									} else if (
										linksPagination.page >=
										linksPagination.pages - 2
									) {
										pageNum = linksPagination.pages - 4 + i;
									} else {
										pageNum = linksPagination.page - 2 + i;
									}

									return (
										<button
											key={pageNum}
											onClick={() => setCurrentPage(pageNum)}
											disabled={loading}
											className={`px-3 py-1 text-sm border rounded-md transition-colors ${
												linksPagination.page === pageNum
													? "bg-blue-600 text-white border-blue-600"
													: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
											} disabled:opacity-50 disabled:cursor-not-allowed`}
										>
											{pageNum}
										</button>
									);
								}
							)}
						</div>

						<button
							onClick={() =>
								setCurrentPage((prev) =>
									Math.min(linksPagination.pages, prev + 1)
								)
							}
							disabled={
								linksPagination.page >= linksPagination.pages || loading
							}
							className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Links;
