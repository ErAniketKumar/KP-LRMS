import React, { useState, useEffect } from "react";
import {
	Link as LinkIcon,
	Plus,
	Search,
	Eye,
	Trash2,
	Copy,
	QrCode,
	BarChart3,
	Calendar,
	User,
	ExternalLink,
	MousePointer,
	Users,
} from "lucide-react";
import ShortUrlModal from "../../components/Modals/ShortUrlModal";
import QRCodeModal from "../../components/Modals/QRCodeModal";
import AnalyticsModal from "../../components/Modals/AnalyticsModal";

const ShortUrl = () => {
	const [shortUrls, setShortUrls] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isQRModalOpen, setIsQRModalOpen] = useState(false);
	const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
	const [selectedUrl, setSelectedUrl] = useState(null);

	// Fetch short URLs
	const fetchShortUrls = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			const response = await fetch("/api/shorturl", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await response.json();
			if (data.success) {
				setShortUrls(data.data);
			}
		} catch (error) {
			console.error("Error fetching short URLs:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchShortUrls();
	}, []);

	// Delete short URL
	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this short URL?")) {
			return;
		}

		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`/api/shorturl/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				setShortUrls(shortUrls.filter((url) => url._id !== id));
			}
		} catch (error) {
			console.error("Error deleting short URL:", error);
		}
	};

	// Copy to clipboard
	const handleCopy = async (shortCode) => {
		const shortUrl = `${window.location.origin}/s/${shortCode}`;
		try {
			await navigator.clipboard.writeText(shortUrl);
			alert("Short URL copied to clipboard!");
		} catch (error) {
			console.error("Error copying to clipboard:", error);
		}
	};

	// Show QR Code
	const handleShowQR = (url) => {
		setSelectedUrl(url);
		setIsQRModalOpen(true);
	};

	// Show Analytics
	const handleShowAnalytics = (url) => {
		setSelectedUrl(url);
		setIsAnalyticsModalOpen(true);
	};

	// Filter short URLs
	const filteredShortUrls = shortUrls.filter(
		(url) =>
			url.originalUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			url.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			url.shortCode?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							URL Shortener
						</h1>
						<p className="mt-2 text-gray-600 dark:text-gray-400">
							Create short URLs and track their performance
						</p>
					</div>
					<button
						onClick={() => setIsModalOpen(true)}
						className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
					>
						<Plus className="h-5 w-5" />
						<span>Shorten URL</span>
					</button>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search URLs, titles, or short codes..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
					/>
				</div>
			</div>

			{/* Loading State */}
			{loading ? (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-2 text-gray-600 dark:text-gray-400">
						Loading short URLs...
					</p>
				</div>
			) : (
				<>
					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
									<LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										Total URLs
									</p>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{shortUrls.length}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
									<MousePointer className="h-6 w-6 text-green-600 dark:text-green-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										Total Clicks
									</p>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{shortUrls.reduce(
											(sum, url) => sum + (url.clickCount || 0),
											0
										)}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
									<Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										Unique Visitors
									</p>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{shortUrls.reduce(
											(sum, url) => sum + (url.uniqueClicks || 0),
											0
										)}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
									<BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
										Avg. CTR
									</p>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{shortUrls.length > 0
											? (
													shortUrls.reduce(
														(sum, url) => sum + (url.clickCount || 0),
														0
													) / shortUrls.length
											  ).toFixed(1)
											: "0"}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Short URLs List */}
					{filteredShortUrls.length === 0 ? (
						<div className="text-center py-12">
							<LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								No short URLs found
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								{searchTerm
									? "No URLs match your search criteria."
									: "Get started by creating your first short URL."}
							</p>
							{!searchTerm && (
								<button
									onClick={() => setIsModalOpen(true)}
									className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
								>
									<Plus className="h-5 w-5" />
									<span>Shorten URL</span>
								</button>
							)}
						</div>
					) : (
						<div className="grid gap-6">
							{filteredShortUrls.map((url) => (
								<div
									key={url._id}
									className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0">
											{/* Title and Description */}
											<div className="mb-3">
												{url.title && (
													<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
														{url.title}
													</h3>
												)}
												{url.description && (
													<p className="text-gray-600 dark:text-gray-400 text-sm">
														{url.description}
													</p>
												)}
											</div>

											{/* URLs */}
											<div className="space-y-2 mb-4">
												<div className="flex items-center space-x-2">
													<span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16">
														SHORT:
													</span>
													<code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-blue-600 dark:text-blue-400">
														{window.location.origin}/s/{url.shortCode}
													</code>
													<button
														onClick={() => handleCopy(url.shortCode)}
														className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
														title="Copy"
													>
														<Copy className="h-4 w-4" />
													</button>
												</div>
												<div className="flex items-center space-x-2">
													<span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16">
														ORIGINAL:
													</span>
													<a
														href={url.originalUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 truncate flex items-center space-x-1"
													>
														<span className="truncate">{url.originalUrl}</span>
														<ExternalLink className="h-3 w-3 flex-shrink-0" />
													</a>
												</div>
											</div>

											{/* Stats */}
											<div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
												<div className="flex items-center space-x-1">
													<MousePointer className="h-4 w-4" />
													<span>{url.clickCount || 0} clicks</span>
												</div>
												<div className="flex items-center space-x-1">
													<Users className="h-4 w-4" />
													<span>{url.uniqueClicks || 0} unique</span>
												</div>
												<div className="flex items-center space-x-1">
													<Calendar className="h-4 w-4" />
													<span>
														{new Date(url.createdAt).toLocaleDateString()}
													</span>
												</div>
												<div className="flex items-center space-x-1">
													<User className="h-4 w-4" />
													<span>
														{url.createdBy?.fullName || url.createdBy?.email}
													</span>
												</div>
											</div>
										</div>

										{/* Actions */}
										<div className="flex items-center space-x-2 ml-4">
											<button
												onClick={() => handleShowQR(url)}
												className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
												title="QR Code"
											>
												<QrCode className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleShowAnalytics(url)}
												className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
												title="Analytics"
											>
												<BarChart3 className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleDelete(url._id)}
												className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
												title="Delete"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{/* Modals */}
			<ShortUrlModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={fetchShortUrls}
			/>

			<QRCodeModal
				isOpen={isQRModalOpen}
				onClose={() => setIsQRModalOpen(false)}
				shortUrl={selectedUrl}
			/>

			<AnalyticsModal
				isOpen={isAnalyticsModalOpen}
				onClose={() => setIsAnalyticsModalOpen(false)}
				shortUrl={selectedUrl}
			/>
		</div>
	);
};

export default ShortUrl;
