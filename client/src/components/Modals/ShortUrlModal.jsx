import React, { useState } from "react";
import toast from "react-hot-toast";
import {
	X,
	Link as LinkIcon,
	Settings,
	Calendar,
	MousePointer,
} from "lucide-react";

// API Base URL
const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://kplrms.vercel.app/api";

const ShortUrlModal = ({ isOpen, onClose, onSuccess }) => {
	const [formData, setFormData] = useState({
		originalUrl: "",
		title: "",
		description: "",
		customCode: "",
		expirationDate: "",
		maxClicks: "",
	});
	const [loading, setLoading] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`${API_BASE_URL}/shorturl`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					...formData,
					expirationDate: formData.expirationDate || undefined,
					maxClicks: formData.maxClicks
						? parseInt(formData.maxClicks)
						: undefined,
				}),
			});

			const data = await response.json();

			if (data.success) {
				// Reset form
				setFormData({
					originalUrl: "",
					title: "",
					description: "",
					customCode: "",
					expirationDate: "",
					maxClicks: "",
				});
				setShowAdvanced(false);
				onSuccess();
				onClose();

				// Show success message with the short URL
				toast.success(`Short URL created successfully!`);

				// Copy short URL to clipboard
				if (navigator.clipboard) {
					navigator.clipboard.writeText(data.shortUrl);
					toast.success("Short URL copied to clipboard!");
				}
			} else {
				// Handle validation errors
				if (data.errors && Array.isArray(data.errors)) {
					data.errors.forEach((error) => toast.error(error.msg));
				} else {
					toast.error(data.message || "Failed to create short URL");
				}
			}
		} catch (error) {
			console.error("Error creating short URL:", error);
			toast.error("Failed to create short URL. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center space-x-3">
						<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
							<LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">
								Shorten URL
							</h2>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Create a short URL with optional customizations
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="h-5 w-5 text-gray-500" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					{/* Original URL */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Original URL *
						</label>
						<input
							type="url"
							name="originalUrl"
							value={formData.originalUrl}
							onChange={handleInputChange}
							required
							placeholder="https://example.com/very/long/url"
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>

					{/* Title */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Title (Optional)
						</label>
						<input
							type="text"
							name="title"
							value={formData.title}
							onChange={handleInputChange}
							maxLength={200}
							placeholder="Give your short URL a memorable title"
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>

					{/* Description */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Description (Optional)
						</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							maxLength={500}
							rows={3}
							placeholder="Add a description to help you remember what this URL is for"
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
						/>
					</div>

					{/* Advanced Options Toggle */}
					<div>
						<button
							type="button"
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
						>
							<Settings className="h-4 w-4" />
							<span>{showAdvanced ? "Hide" : "Show"} Advanced Options</span>
						</button>
					</div>

					{/* Advanced Options */}
					{showAdvanced && (
						<div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
							{/* Custom Code */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Custom Short Code (Optional)
								</label>
								<div className="flex items-center space-x-2">
									<span className="text-sm text-gray-500 dark:text-gray-400">
										{window.location.origin}/s/
									</span>
									<input
										type="text"
										name="customCode"
										value={formData.customCode}
										onChange={handleInputChange}
										placeholder="my-custom-url"
										pattern="[a-zA-Z0-9_-]{3,20}"
										minLength={3}
										maxLength={20}
										className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
									/>
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									Letters, numbers, hyphens, and underscores only (3-20
									characters)
								</p>
							</div>

							{/* Expiration Date */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									<Calendar className="h-4 w-4 inline mr-1" />
									Expiration Date (Optional)
								</label>
								<input
									type="datetime-local"
									name="expirationDate"
									value={formData.expirationDate}
									onChange={handleInputChange}
									min={new Date().toISOString().slice(0, 16)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
								/>
							</div>

							{/* Max Clicks */}
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									<MousePointer className="h-4 w-4 inline mr-1" />
									Maximum Clicks (Optional)
								</label>
								<input
									type="number"
									name="maxClicks"
									value={formData.maxClicks}
									onChange={handleInputChange}
									min={1}
									placeholder="No limit"
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
								/>
							</div>
						</div>
					)}

					{/* Form Actions */}
					<div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !formData.originalUrl}
							className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
						>
							{loading ? "Creating..." : "Shorten URL"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ShortUrlModal;
