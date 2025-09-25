import React, { useState, useEffect } from "react";
import {
	FileText,
	Upload,
	Download,
	Trash2,
	Search,
	Filter,
	Calendar,
	User,
	File,
	FileImage,
	FileVideo,
	Archive,
	Eye,
} from "lucide-react";
import { useResource } from "../../context/ResourceContext";
import DocumentModal from "../../components/Modals/DocumentModal";

const Documents = () => {
	const {
		documents,
		documentsPagination,
		fetchDocuments,
		deleteDocument,
		loading,
	} = useResource();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [searchInput, setSearchInput] = useState("");
	const [downloadingIds, setDownloadingIds] = useState(new Set());
	const [previewingIds, setPreviewingIds] = useState(new Set());

	const handleSearch = () => {
		setSearchTerm(searchInput);
		setCurrentPage(1);
	};

	const handleFilterChange = (type) => {
		setFilterType(type);
		setCurrentPage(1);
	};

	useEffect(() => {
		fetchDocuments({
			page: currentPage,
			limit: 10,
			search: searchTerm,
			type: filterType,
		});
	}, [fetchDocuments, currentPage, searchTerm, filterType]);

	const handleDelete = async (id) => {
		if (window.confirm("Are you sure you want to delete this document?")) {
			await deleteDocument(id);
		}
	};

	const handleDownload = async (doc) => {
		const docId = doc._id;
		if (downloadingIds.has(docId)) return; // Prevent multiple downloads

		setDownloadingIds((prev) => new Set([...prev, docId]));

		try {
			// For Cloudinary files, create a direct link to the download endpoint
			// The server will redirect to Cloudinary URL
			const token = localStorage.getItem("token");
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "https://kplrms.vercel.app/api";
			const downloadUrl = `${API_BASE_URL}/documents/${docId}/download`;

			// Create URL with auth token as query parameter
			const urlWithAuth = `${downloadUrl}?token=${encodeURIComponent(token)}`;

			// Open in new window to handle the redirect to Cloudinary
			window.open(urlWithAuth, "_blank");
		} catch (error) {
			console.error("Download error:", error);
			alert("Failed to download document. Please try again.");
		} finally {
			setDownloadingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(docId);
				return newSet;
			});
		}
	};

	const handleFileDownload = (doc, fileIndex) => {
		try {
			const token = localStorage.getItem("token");
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "https://kplrms.vercel.app/api";
			const downloadUrl = `${API_BASE_URL}/documents/${doc._id}/download/${fileIndex}`;

			// Create URL with auth token as query parameter
			const urlWithAuth = `${downloadUrl}?token=${encodeURIComponent(token)}`;

			// Open in new window to handle the redirect to Cloudinary
			window.open(urlWithAuth, "_blank");
		} catch (error) {
			console.error("File download error:", error);
			alert("Failed to download file. Please try again.");
		}
	};

	const handlePreview = async (doc) => {
		const docId = doc._id;
		if (previewingIds.has(docId)) return; // Prevent multiple previews

		setPreviewingIds((prev) => new Set([...prev, docId]));

		try {
			// For Cloudinary files, open the preview URL directly
			// The server will redirect to Cloudinary URL
			const token = localStorage.getItem("token");
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "https://kplrms.vercel.app/api";
			const previewUrl = `${API_BASE_URL}/documents/${docId}/preview?token=${encodeURIComponent(
				token
			)}`;

			// Open in new window - this will handle the redirect to Cloudinary
			const newWindow = window.open(previewUrl, "_blank");

			// If window didn't open, show popup message
			if (!newWindow) {
				alert(
					"Pop-up blocked. Please allow pop-ups for this site to preview documents."
				);
			}
		} catch (error) {
			console.error("Preview error:", error);
			alert(
				"Failed to preview document. Please try again or use the download button."
			);
		} finally {
			setPreviewingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(docId);
				return newSet;
			});
		}
	};

	// Helper function to check if a document is previewable
	const isPreviewable = (document) => {
		// For single file documents
		if (document.mimeType) {
			return (
				document.mimeType.startsWith("image/") ||
				document.mimeType.includes("pdf") ||
				document.mimeType.startsWith("text/") ||
				document.mimeType.includes("document") ||
				document.mimeType.includes("presentation") ||
				document.mimeType.includes("sheet")
			);
		}

		// For multiple file documents, check if any file is previewable
		if (document.files && document.files.length > 0) {
			return document.files.some(
				(file) =>
					file.mimeType &&
					(file.mimeType.startsWith("image/") ||
						file.mimeType.includes("pdf") ||
						file.mimeType.startsWith("text/") ||
						file.mimeType.includes("document") ||
						file.mimeType.includes("presentation") ||
						file.mimeType.includes("sheet"))
			);
		}

		return false;
	};

	const filteredDocuments = Array.isArray(documents) ? documents : [];

	const fileTypes = Array.isArray(documents)
		? [...new Set(documents.map((doc) => doc.mimeType).filter(Boolean))]
		: [];

	const getFileIcon = (mimeType) => {
		if (mimeType?.startsWith("image/"))
			return <FileImage className="h-6 w-6" />;
		if (mimeType?.startsWith("video/"))
			return <FileVideo className="h-6 w-6" />;
		if (mimeType?.includes("zip") || mimeType?.includes("rar"))
			return <Archive className="h-6 w-6" />;
		return <File className="h-6 w-6" />;
	};

	const getFileTypeColor = (mimeType) => {
		if (mimeType?.startsWith("image/"))
			return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
		if (mimeType?.startsWith("video/"))
			return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
		if (mimeType?.includes("pdf"))
			return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
		if (mimeType?.includes("word") || mimeType?.includes("document"))
			return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
		if (mimeType?.includes("sheet") || mimeType?.includes("excel"))
			return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
		if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint"))
			return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
		if (mimeType?.includes("zip") || mimeType?.includes("rar"))
			return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
		return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
	};

	const formatFileSize = (bytes) => {
		if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const getFileTypeDisplay = (mimeType, filename) => {
		// Use MIME type for better categorization
		if (mimeType?.includes("pdf")) return "PDF";
		if (mimeType?.startsWith("image/")) {
			const ext = filename?.split(".").pop()?.toLowerCase();
			if (ext === "png") return "PNG";
			if (ext === "jpg" || ext === "jpeg") return "JPG";
			if (ext === "gif") return "GIF";
			if (ext === "svg") return "SVG";
			return "IMAGE";
		}
		if (mimeType?.startsWith("video/")) {
			const ext = filename?.split(".").pop()?.toLowerCase();
			if (ext === "mp4") return "MP4";
			if (ext === "mov") return "MOV";
			if (ext === "avi") return "AVI";
			return "VIDEO";
		}
		if (mimeType?.includes("word") || mimeType?.includes("document"))
			return "DOC";
		if (mimeType?.includes("sheet") || mimeType?.includes("excel"))
			return "XLS";
		if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint"))
			return "PPT";
		if (mimeType?.includes("zip")) return "ZIP";
		if (mimeType?.includes("rar")) return "RAR";
		if (mimeType?.startsWith("text/")) return "TXT";

		// Fallback to file extension
		if (filename) {
			const ext = filename.split(".").pop()?.toUpperCase();
			return ext || "FILE";
		}
		return "FILE";
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
						Documents Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Upload and manage your project documents (
						{Array.isArray(documents) ? documents.length : 0} total)
					</p>
				</div>
				<button
					onClick={() => setIsModalOpen(true)}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
				>
					<Upload className="h-4 w-4" />
					<span>Upload Document</span>
				</button>
			</div>

			{/* Search and Filter */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search documents..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						/>
					</div>
					<button
						onClick={handleSearch}
						disabled={loading}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
					>
						Search
					</button>
					<div className="relative">
						<Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						<select
							value={filterType}
							onChange={(e) => handleFilterChange(e.target.value)}
							className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
						>
							<option value="">All Types</option>
							{fileTypes.map((type) => (
								<option key={type} value={type}>
									{type.split("/")[1]?.toUpperCase() || type}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Documents Grid */}
			{filteredDocuments.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								{searchTerm || filterType
									? "No documents found"
									: "No documents uploaded"}
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								{searchTerm || filterType
									? "Try adjusting your search or filter criteria"
									: "Start by uploading your first document"}
							</p>
							{!searchTerm && !filterType && (
								<button
									onClick={() => setIsModalOpen(true)}
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
								>
									Upload Your First Document
								</button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredDocuments.map((document) => (
						<div
							key={document._id}
							className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
						>
							<div className="flex items-start justify-between mb-4 gap-3">
								<div className="flex items-center space-x-3 min-w-0">
									<div className="text-blue-600">
										{getFileIcon(document.mimeType)}
									</div>
									<div className="flex-1 min-w-0">
										<h3
											title={document.title}
											className="text-lg font-semibold text-gray-900 dark:text-white truncate"
										>
											{document.title}
										</h3>
										<div className="flex items-center space-x-2 mt-1">
											{document.documentType === "multiple" &&
											document.files ? (
												<>
													<span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
														{document.files.length} Files
													</span>
													<span className="text-xs text-gray-500 dark:text-gray-400">
														{formatFileSize(
															document.totalFileSize || document.fileSize
														)}
													</span>
												</>
											) : (
												<>
													<span
														className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(
															document.mimeType
														)}`}
													>
														{getFileTypeDisplay(
															document.mimeType,
															document.fileName || document.title
														)}
													</span>
													<span className="text-xs text-gray-500 dark:text-gray-400">
														{formatFileSize(document.fileSize)}
													</span>
												</>
											)}
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-2 shrink-0">
									<button
										onClick={() => handleDownload(document)}
										disabled={downloadingIds.has(document._id)}
										className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										title={
											downloadingIds.has(document._id)
												? "Downloading..."
												: "Download"
										}
									>
										<Download
											className={`h-4 w-4 ${
												downloadingIds.has(document._id) ? "animate-pulse" : ""
											}`}
										/>
									</button>
									<button
										onClick={() => handleDelete(document._id)}
										className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
										title="Delete"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>

							{document.description && (
								<p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
									{document.description}
								</p>
							)}

							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<div className="flex items-center text-gray-500 dark:text-gray-400">
										<User className="h-4 w-4 mr-1" />
										<span>
											{document.addedBy?.fullName ||
												document.addedBy?.email ||
												"Unknown"}
										</span>
									</div>
									<div className="flex items-center text-gray-500 dark:text-gray-400">
										<Calendar className="h-4 w-4 mr-1" />
										<span>
											{new Date(document.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>

							{/* Multiple files list */}
							{document.files && document.files.length > 0 && (
								<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
									<div className="flex items-center mb-2">
										<FileText className="h-4 w-4 mr-2 text-gray-500" />
										<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Files ({document.files.length})
										</span>
									</div>
									<div className="space-y-1 max-h-24 overflow-y-auto">
										{document.files.map((file, index) => (
											<div
												key={index}
												className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs"
											>
												<div className="flex items-center min-w-0 flex-1">
													<div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
													<span className="truncate text-gray-700 dark:text-gray-300">
														{file.originalName || file.filename}
													</span>
												</div>
												<button
													onClick={() => handleFileDownload(document, index)}
													className="text-blue-500 hover:text-blue-600 ml-2 flex-shrink-0 p-1"
													title="Download"
												>
													<Download className="h-3 w-3" />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Preview/View Button for certain file types */}
							{isPreviewable(document) && (
								<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
									<button
										onClick={() => handlePreview(document)}
										disabled={previewingIds.has(document._id)}
										className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<Eye
											className={`h-4 w-4 ${
												previewingIds.has(document._id) ? "animate-pulse" : ""
											}`}
										/>
										<span>
											{previewingIds.has(document._id)
												? "Loading..."
												: "Preview"}
										</span>
									</button>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Pagination */}
			{documentsPagination.total > 10 && (
				<div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-lg">
					<div className="flex-1 flex justify-between sm:hidden">
						<button
							onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
							disabled={currentPage <= 1 || loading}
							className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<button
							onClick={() =>
								setCurrentPage((prev) =>
									Math.min(documentsPagination.pages, prev + 1)
								)
							}
							disabled={currentPage >= documentsPagination.pages || loading}
							className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
					<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
						<div>
							<p className="text-sm text-gray-700 dark:text-gray-300">
								Showing{" "}
								<span className="font-medium">
									{(currentPage - 1) * documentsPagination.limit + 1}
								</span>{" "}
								to{" "}
								<span className="font-medium">
									{Math.min(
										currentPage * documentsPagination.limit,
										documentsPagination.total
									)}
								</span>{" "}
								of{" "}
								<span className="font-medium">{documentsPagination.total}</span>{" "}
								results
							</p>
						</div>
						<div>
							<nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
								<button
									onClick={() =>
										setCurrentPage((prev) => Math.max(1, prev - 1))
									}
									disabled={currentPage <= 1 || loading}
									className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span className="sr-only">Previous</span>
									<svg
										className="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
								{/* Page numbers */}
								{Array.from(
									{ length: Math.min(5, documentsPagination.pages) },
									(_, i) => {
										const pageNum =
											Math.max(
												1,
												Math.min(documentsPagination.pages - 4, currentPage - 2)
											) + i;
										if (pageNum > documentsPagination.pages) return null;
										return (
											<button
												key={pageNum}
												onClick={() => setCurrentPage(pageNum)}
												disabled={loading}
												className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
													currentPage === pageNum
														? "z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-600 dark:text-blue-400"
														: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
												} disabled:opacity-50 disabled:cursor-not-allowed`}
											>
												{pageNum}
											</button>
										);
									}
								)}
								<button
									onClick={() =>
										setCurrentPage((prev) =>
											Math.min(documentsPagination.pages, prev + 1)
										)
									}
									disabled={currentPage >= documentsPagination.pages || loading}
									className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<span className="sr-only">Next</span>
									<svg
										className="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
							</nav>
						</div>
					</div>
				</div>
			)}

			{/* Modal */}
			<DocumentModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</div>
	);
};

export default Documents;
