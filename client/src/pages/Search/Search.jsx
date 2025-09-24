import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
	Search as SearchIcon,
	Filter,
	Link as LinkIcon,
	Key,
	FileText,
	CheckSquare,
	ExternalLink,
	Calendar,
	User,
	Tag,
	AlertCircle,
	Download,
	Eye,
} from "lucide-react";
import { useResource } from "../../context/ResourceContext";

const Search = () => {
	const location = useLocation();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFilter, setSelectedFilter] = useState("all");
	const [hasSearched, setHasSearched] = useState(false);

	const {
		links,
		documents,
		todos,
		credentials,
		fetchLinks,
		fetchDocuments,
		fetchTodos,
		fetchCredentials,
		loading,
	} = useResource();

	// Handle URL search parameters
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const queryParam = urlParams.get("q");
		if (queryParam) {
			setSearchQuery(queryParam);
			setHasSearched(true);
		}
	}, [location.search]);

	const filters = [
		{ id: "all", name: "All", icon: SearchIcon },
		{ id: "links", name: "Links", icon: LinkIcon },
		{ id: "credentials", name: "Credentials", icon: Key },
		{ id: "documents", name: "Documents", icon: FileText },
		{ id: "tasks", name: "Tasks", icon: CheckSquare },
	];

	useEffect(() => {
		// Fetch all data when component mounts
		fetchLinks();
		fetchDocuments();
		fetchTodos();
		fetchCredentials();
	}, [fetchLinks, fetchDocuments, fetchTodos, fetchCredentials]);

	const searchResults = useMemo(() => {
		if (!searchQuery.trim()) return [];

		const results = [];
		const query = searchQuery.toLowerCase();

		// Search Links
		if (
			(selectedFilter === "all" || selectedFilter === "links") &&
			Array.isArray(links)
		) {
			links.forEach((link) => {
				if (
					link.title.toLowerCase().includes(query) ||
					link.description?.toLowerCase().includes(query) ||
					link.url.toLowerCase().includes(query) ||
					link.category?.toLowerCase().includes(query) ||
					link.tags?.some((tag) => tag.toLowerCase().includes(query))
				) {
					results.push({
						id: link._id,
						type: "link",
						title: link.title,
						description: link.description,
						url: link.url,
						category: link.category,
						tags: link.tags,
						accessLevel: link.accessLevel,
						createdAt: link.createdAt,
						createdBy: link.createdBy,
						data: link,
					});
				}
			});
		}

		// Search Documents
		if (
			(selectedFilter === "all" || selectedFilter === "documents") &&
			Array.isArray(documents)
		) {
			documents.forEach((doc) => {
				if (
					doc.title.toLowerCase().includes(query) ||
					doc.description?.toLowerCase().includes(query) ||
					doc.fileType?.toLowerCase().includes(query)
				) {
					results.push({
						id: doc._id,
						type: "document",
						title: doc.title,
						description: doc.description,
						fileName: doc.title,
						size: doc.size,
						fileType: doc.fileType,
						url: doc.url,
						createdAt: doc.createdAt,
						uploadedBy: doc.uploadedBy,
						data: doc,
					});
				}
			});
		}

		// Search Todos
		if (
			(selectedFilter === "all" || selectedFilter === "tasks") &&
			Array.isArray(todos)
		) {
			todos.forEach((todo) => {
				if (
					todo.title.toLowerCase().includes(query) ||
					todo.description?.toLowerCase().includes(query) ||
					todo.category?.toLowerCase().includes(query) ||
					todo.priority?.toLowerCase().includes(query) ||
					todo.status?.toLowerCase().includes(query)
				) {
					results.push({
						id: todo._id,
						type: "task",
						title: todo.title,
						description: todo.description,
						category: todo.category,
						priority: todo.priority,
						status: todo.status,
						dueDate: todo.dueDate,
						createdAt: todo.createdAt,
						createdBy: todo.createdBy,
						data: todo,
					});
				}
			});
		}

		// Search Credentials
		if (
			(selectedFilter === "all" || selectedFilter === "credentials") &&
			Array.isArray(credentials)
		) {
			credentials.forEach((cred) => {
				if (
					cred.title.toLowerCase().includes(query) ||
					cred.username?.toLowerCase().includes(query) ||
					cred.email?.toLowerCase().includes(query) ||
					cred.url?.toLowerCase().includes(query) ||
					cred.category?.toLowerCase().includes(query) ||
					cred.notes?.toLowerCase().includes(query)
				) {
					results.push({
						id: cred._id,
						type: "credential",
						title: cred.title,
						description: cred.notes,
						username: cred.username,
						email: cred.email,
						url: cred.url,
						category: cred.category,
						createdAt: cred.createdAt,
						data: cred,
					});
				}
			});
		}

		return results.sort(
			(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
		);
	}, [searchQuery, selectedFilter, links, documents, todos, credentials]);

	const handleSearch = (e) => {
		e.preventDefault();
		setHasSearched(true);
	};

	const getTypeIcon = (type) => {
		switch (type) {
			case "link":
				return LinkIcon;
			case "credential":
				return Key;
			case "document":
				return FileText;
			case "task":
				return CheckSquare;
			default:
				return SearchIcon;
		}
	};

	const getTypeColor = (type) => {
		switch (type) {
			case "link":
				return "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
			case "credential":
				return "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400";
			case "document":
				return "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400";
			case "task":
				return "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400";
			default:
				return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
		}
	};

	const handleResultClick = (result) => {
		// You could navigate to the specific resource or open a modal here
		// For now, we'll just handle external links
		if (result.type === "link" && result.url) {
			window.open(result.url, "_blank");
		}
	};
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					Search Resources
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Search across all your links, credentials, documents, and tasks
				</p>
			</div>

			{/* Search Form */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
				<form onSubmit={handleSearch} className="space-y-4">
					<div className="flex space-x-4">
						<div className="flex-1">
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<SearchIcon className="h-5 w-5 text-gray-400" />
								</div>
								<input
									type="text"
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Search for links, credentials, documents, or tasks..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
						<button
							type="submit"
							className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md flex items-center space-x-2"
						>
							<SearchIcon className="h-4 w-4" />
							<span>Search</span>
						</button>
					</div>

					{/* Filters */}
					<div className="flex flex-wrap gap-2">
						{filters.map((filter) => {
							const Icon = filter.icon;
							return (
								<button
									key={filter.id}
									type="button"
									onClick={() => setSelectedFilter(filter.id)}
									className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
										selectedFilter === filter.id
											? "bg-indigo-600 text-white"
											: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
									}`}
								>
									<Icon className="h-4 w-4" />
									<span>{filter.name}</span>
								</button>
							);
						})}
					</div>
				</form>
			</div>

			{/* Search Results */}
			{(hasSearched || searchQuery.trim()) && (
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
					<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium text-gray-900 dark:text-white">
									Search Results
								</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									{searchResults.length} results found{" "}
									{searchQuery && `for "${searchQuery}"`}
								</p>
							</div>
							{searchQuery && (
								<button
									onClick={() => {
										setSearchQuery("");
										setHasSearched(false);
									}}
									className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								>
									Clear search
								</button>
							)}
						</div>
					</div>

					{loading ? (
						<div className="p-6">
							<div className="animate-pulse space-y-4">
								{[1, 2, 3].map((i) => (
									<div key={i} className="flex items-start space-x-4">
										<div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
										<div className="flex-1 space-y-2">
											<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
											<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						</div>
					) : searchResults.length === 0 ? (
						<div className="p-12 text-center">
							<SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								No results found
							</h3>
							<p className="text-gray-500 dark:text-gray-400">
								Try adjusting your search terms or filters
							</p>
						</div>
					) : (
						<div className="divide-y divide-gray-200 dark:divide-gray-700">
							{searchResults.map((result) => {
								const Icon = getTypeIcon(result.type);
								return (
									<div
										key={result.id}
										className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
										onClick={() => handleResultClick(result)}
									>
										<div className="flex items-start space-x-4">
											<div
												className={`p-2 rounded-lg ${getTypeColor(
													result.type
												)}`}
											>
												<Icon className="h-5 w-5" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-2 mb-1">
													<h4 className="text-sm font-medium text-gray-900 dark:text-white">
														{result.title}
													</h4>
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">
														{result.type}
													</span>
													{result.type === "link" && (
														<ExternalLink className="h-3 w-3 text-gray-400" />
													)}
												</div>

												{result.description && (
													<p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
														{result.description}
													</p>
												)}

												<div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
													{result.createdAt && (
														<div className="flex items-center">
															<Calendar className="h-3 w-3 mr-1" />
															<span>
																{new Date(
																	result.createdAt
																).toLocaleDateString()}
															</span>
														</div>
													)}

													{(result.createdBy || result.uploadedBy) && (
														<div className="flex items-center">
															<User className="h-3 w-3 mr-1" />
															<span>
																{result.createdBy?.fullName ||
																	result.uploadedBy?.fullName ||
																	"Unknown"}
															</span>
														</div>
													)}

													{result.category && (
														<div className="flex items-center">
															<Tag className="h-3 w-3 mr-1" />
															<span>{result.category}</span>
														</div>
													)}
												</div>

												{/* Type-specific information */}
												{result.type === "link" && result.url && (
													<p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 truncate">
														{result.url}
													</p>
												)}

												{result.type === "document" && (
													<div className="flex items-center space-x-2 mt-2">
														<span className="text-xs text-gray-500 dark:text-gray-400">
															{result.fileName}
														</span>
														{result.size && (
															<span className="text-xs text-gray-400">
																•{" "}
																{result.size > 1024 * 1024
																	? `${(result.size / (1024 * 1024)).toFixed(
																			1
																	  )} MB`
																	: `${(result.size / 1024).toFixed(1)} KB`}
															</span>
														)}
													</div>
												)}

												{result.type === "task" && (
													<div className="flex items-center space-x-2 mt-2">
														<span
															className={`px-2 py-1 text-xs rounded-full ${
																result.status === "completed"
																	? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
																	: result.status === "in-progress"
																	? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
																	: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
															}`}
														>
															{result.status.replace("-", " ")}
														</span>
														<span
															className={`px-2 py-1 text-xs rounded-full ${
																result.priority === "high"
																	? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
																	: result.priority === "medium"
																	? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
																	: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
															}`}
														>
															{result.priority} priority
														</span>
														{result.dueDate && (
															<div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
																<AlertCircle className="h-3 w-3 mr-1" />
																<span>
																	Due{" "}
																	{new Date(
																		result.dueDate
																	).toLocaleDateString()}
																</span>
															</div>
														)}
													</div>
												)}

												{result.type === "credential" && (
													<div className="flex items-center space-x-2 mt-2">
														{result.username && (
															<span className="text-xs text-gray-500 dark:text-gray-400">
																Username: {result.username}
															</span>
														)}
														{result.email && (
															<span className="text-xs text-gray-500 dark:text-gray-400">
																Email: {result.email}
															</span>
														)}
														{result.url && (
															<span className="text-xs text-indigo-600 dark:text-indigo-400 truncate">
																{result.url}
															</span>
														)}
													</div>
												)}
											</div>

											<div className="flex items-center space-x-2">
												{result.type === "link" && (
													<button
														onClick={(e) => {
															e.stopPropagation();
															window.open(result.url, "_blank");
														}}
														className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
													>
														<ExternalLink className="h-4 w-4" />
													</button>
												)}
												{result.type === "document" && (
													<>
														<button
															onClick={(e) => {
																e.stopPropagation();
																window.open(result.url, "_blank");
															}}
															className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
														>
															<Eye className="h-4 w-4" />
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																const link = document.createElement("a");
																link.href = result.url;
																link.download = result.fileName;
																document.body.appendChild(link);
																link.click();
																document.body.removeChild(link);
															}}
															className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
														>
															<Download className="h-4 w-4" />
														</button>
													</>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* No search performed yet */}
			{!hasSearched && !searchQuery.trim() && (
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
					<SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
						Search All Resources
					</h3>
					<p className="text-gray-500 dark:text-gray-400 mb-4">
						Enter a search term to find links, credentials, documents, and tasks
					</p>
					<div className="flex justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
						<div className="flex items-center">
							<LinkIcon className="h-4 w-4 mr-1 text-blue-500" />
							<span>{links.length} Links</span>
						</div>
						<div className="flex items-center">
							<FileText className="h-4 w-4 mr-1 text-purple-500" />
							<span>{documents.length} Documents</span>
						</div>
						<div className="flex items-center">
							<CheckSquare className="h-4 w-4 mr-1 text-orange-500" />
							<span>{todos.length} Tasks</span>
						</div>
						<div className="flex items-center">
							<Key className="h-4 w-4 mr-1 text-green-500" />
							<span>{credentials.length} Credentials</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Search;
