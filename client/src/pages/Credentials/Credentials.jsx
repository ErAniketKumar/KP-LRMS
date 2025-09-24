import React, { useState, useEffect } from "react";
import {
	Key,
	Plus,
	Edit,
	Trash2,
	Search,
	Filter,
	Eye,
	EyeOff,
	Copy,
	CheckCircle,
	Shield,
	Globe,
	Calendar,
	Lock,
} from "lucide-react";
import { useResource } from "../../context/ResourceContext";
import CredentialModal from "../../components/Modals/CredentialModal";

const Credentials = () => {
	const { credentials, fetchCredentials, deleteCredential, loading } =
		useResource();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCredential, setEditingCredential] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterCategory, setFilterCategory] = useState("");
	const [visiblePasswords, setVisiblePasswords] = useState({});
	const [copied, setCopied] = useState({});

	useEffect(() => {
		fetchCredentials();
	}, [fetchCredentials]);

	const handleEdit = (credential) => {
		setEditingCredential(credential);
		setIsModalOpen(true);
	};

	const handleDelete = async (id) => {
		if (window.confirm("Are you sure you want to delete this credential?")) {
			await deleteCredential(id);
		}
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingCredential(null);
	};

	const togglePasswordVisibility = (id) => {
		setVisiblePasswords((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	const copyToClipboard = async (text, field, id) => {
		try {
			// Handle empty or undefined text
			const textToCopy = text || "";
			if (!textToCopy) {
				console.warn(`No ${field} to copy`);
				return;
			}

			await navigator.clipboard.writeText(textToCopy);
			const key = `${id}-${field}`;
			setCopied((prev) => ({ ...prev, [key]: true }));
			setTimeout(() => {
				setCopied((prev) => ({ ...prev, [key]: false }));
			}, 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	const filteredCredentials = Array.isArray(credentials)
		? credentials.filter((cred) => {
				const matchesSearch =
					(cred.title?.toLowerCase() || "").includes(
						searchTerm.toLowerCase()
					) ||
					(cred.username?.toLowerCase() || "").includes(
						searchTerm.toLowerCase()
					) ||
					(cred.email?.toLowerCase() || "").includes(
						searchTerm.toLowerCase()
					) ||
					(cred.url?.toLowerCase() || "").includes(searchTerm.toLowerCase());
				const matchesCategory =
					!filterCategory || cred.category === filterCategory;
				return matchesSearch && matchesCategory;
		  })
		: [];

	const categories = Array.isArray(credentials)
		? [...new Set(credentials.map((cred) => cred.category).filter(Boolean))]
		: [];

	const getCategoryColor = (category) => {
		const colors = {
			social:
				"bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
			email: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
			work: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
			banking:
				"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
			shopping:
				"bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
			entertainment:
				"bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
			cloud:
				"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
			pgadmin:
				"bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400",
			kibana:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
			hrms: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400",
		};
		return (
			colors[category] ||
			"bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
		);
	};

	const getVisibilityColor = (v) => {
		const map = {
			public:
				"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
			private: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
			organization:
				"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
		};
		return (
			map[v] ||
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
						Credentials Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Securely store and manage your credentials ({credentials.length}{" "}
						total)
					</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
				>
					<Plus className="h-4 w-4" />
					<span>Add Credential</span>
				</button>
			</div>

			{/* Search and Filter */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search credentials..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						/>
					</div>
					<div className="relative">
						<Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<select
							value={filterCategory}
							onChange={(e) => setFilterCategory(e.target.value)}
							className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						>
							<option value="">All Categories</option>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category.charAt(0).toUpperCase() + category.slice(1)}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Credentials Grid */}
			{filteredCredentials.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								{searchTerm || filterCategory
									? "No credentials found"
									: "No credentials stored"}
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								{searchTerm || filterCategory
									? "Try adjusting your search or filter criteria"
									: "Securely store your first credential"}
							</p>
							{!searchTerm && !filterCategory && (
								<button
									onClick={() => setIsModalOpen(true)}
									className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
								>
									Add Your First Credential
								</button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredCredentials.map((credential) => (
						<div
							key={credential._id}
							className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center space-x-3">
									<Shield className="h-6 w-6 text-purple-600" />
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
										{credential.title}
									</h3>
								</div>
								<div className="flex items-center space-x-2">
									<button
										onClick={() => handleEdit(credential)}
										className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
									>
										<Edit className="h-4 w-4" />
									</button>
									<button
										onClick={() => handleDelete(credential._id)}
										className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>

							{credential.url && (
								<div className="mb-3">
									<a
										href={credential.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
									>
										<Globe className="h-4 w-4 mr-2" />
										<span className="truncate">{credential.url}</span>
									</a>
								</div>
							)}

							<div className="space-y-3">
								{credential.username && (
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2 flex-1">
											<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
												Username:
											</span>
											<span className="text-sm text-gray-600 dark:text-gray-400 truncate">
												{credential.username}
											</span>
										</div>
										<button
											onClick={() =>
												copyToClipboard(
													credential.username,
													"username",
													credential._id
												)
											}
											className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
										>
											{copied[`${credential._id}-username`] ? (
												<CheckCircle className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</button>
									</div>
								)}

								{credential.email && (
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2 flex-1">
											<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
												Email:
											</span>
											<span className="text-sm text-gray-600 dark:text-gray-400 truncate">
												{credential.email}
											</span>
										</div>
										<button
											onClick={() =>
												copyToClipboard(
													credential.email,
													"email",
													credential._id
												)
											}
											className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
										>
											{copied[`${credential._id}-email`] ? (
												<CheckCircle className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</button>
									</div>
								)}

								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2 flex-1">
										<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Password:
										</span>
										<span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
											{visiblePasswords[credential._id]
												? credential.password || "[No password set]"
												: "••••••••"}
										</span>
									</div>
									<div className="flex items-center space-x-1">
										{credential.password && (
											<button
												onClick={() =>
													copyToClipboard(
														credential.password,
														"password",
														credential._id
													)
												}
												className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
											>
												{copied[`${credential._id}-password`] ? (
													<CheckCircle className="h-4 w-4 text-green-500" />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</button>
										)}
										<button
											onClick={() => togglePasswordVisibility(credential._id)}
											className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
										>
											{visiblePasswords[credential._id] ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								{credential.password2 && (
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2 flex-1">
											<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
												Password 2:
											</span>
											<span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
												{visiblePasswords[credential._id]
													? credential.password2
													: "••••••••"}
											</span>
										</div>
										<div className="flex items-center space-x-1">
											<button
												onClick={() =>
													copyToClipboard(
														credential.password2,
														"password2",
														credential._id
													)
												}
												className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
											>
												{copied[`${credential._id}-password2`] ? (
													<CheckCircle className="h-4 w-4 text-green-500" />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</button>
										</div>
									</div>
								)}
							</div>

							{credential.notes && (
								<div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-400">
									{credential.notes}
								</div>
							)}

							<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<div className="flex items-center space-x-2">
									{credential.category && (
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
												credential.category
											)}`}
										>
											{credential.category}
										</span>
									)}
									{credential.visibility && (
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${getVisibilityColor(
												credential.visibility
											)}`}
										>
											{credential.visibility}
										</span>
									)}
								</div>
								<div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
									<Calendar className="h-3 w-3 mr-1" />
									{new Date(credential.createdAt).toLocaleDateString()}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Modal */}
			<CredentialModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				credential={editingCredential}
			/>
		</div>
	);
};

export default Credentials;
