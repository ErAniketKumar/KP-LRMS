import React, { useState, useRef } from "react";
import { X, Upload, FileText, Tag, Users, File } from "lucide-react";
import { useResource } from "../../context/ResourceContext";

const DocumentModal = ({ isOpen, onClose }) => {
	const { uploadDocument, uploadMultipleDocuments } = useResource();
	const fileInputRef = useRef(null);

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		category: "",
		tags: "",
		accessLevel: "private",
	});

	const [selectedFile, setSelectedFile] = useState(null);
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [currentUpload, setCurrentUpload] = useState("");
	const [multipleMode, setMultipleMode] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileSelect = (file) => {
		if (multipleMode) {
			setSelectedFiles((prev) => [...prev, file]);
		} else {
			setSelectedFile(file);
			if (!formData.title) {
				// Auto-fill title from filename (without extension)
				const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
				setFormData((prev) => ({ ...prev, title: nameWithoutExtension }));
			}
		}
	};

	const handleFilesSelect = (files) => {
		const fileArray = Array.from(files);
		if (multipleMode) {
			setSelectedFiles((prev) => [...prev, ...fileArray]);
		} else {
			// If single mode, only take first file
			handleFileSelect(fileArray[0]);
		}
	};

	const handleFileInputChange = (e) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			if (multipleMode && files.length > 1) {
				handleFilesSelect(files);
			} else {
				handleFileSelect(files[0]);
			}
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			if (multipleMode && files.length > 1) {
				handleFilesSelect(files);
			} else {
				handleFileSelect(files[0]);
			}
		}
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setDragOver(false);
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const removeFile = (index) => {
		if (multipleMode) {
			setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
		} else {
			setSelectedFile(null);
		}
	};

	const toggleMultipleMode = () => {
		setMultipleMode(!multipleMode);
		setSelectedFile(null);
		setSelectedFiles([]);
		// Reset form data when switching modes
		setFormData({
			title: "",
			description: "",
			category: "",
			tags: "",
			accessLevel: "private",
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const filesToUpload = multipleMode
			? selectedFiles
			: selectedFile
			? [selectedFile]
			: [];

		if (filesToUpload.length === 0) {
			alert("Please select at least one file to upload");
			return;
		}

		setLoading(true);
		setUploadProgress(0);

		try {
			if (multipleMode && filesToUpload.length > 1) {
				// Multiple files mode - upload all as a single document entry
				setCurrentUpload(
					`Uploading ${filesToUpload.length} files as one document...`
				);
				setUploadProgress(50);

				const formDataToSend = new FormData();

				// Add all files
				filesToUpload.forEach((file) => {
					formDataToSend.append("files", file);
				});

				// Add metadata
				formDataToSend.append(
					"title",
					formData.title || `Multiple Files (${filesToUpload.length} files)`
				);
				formDataToSend.append("description", formData.description);
				formDataToSend.append("category", formData.category);
				formDataToSend.append("accessLevel", formData.accessLevel);
				formDataToSend.append("visibility", formData.accessLevel);

				if (formData.tags) {
					const tags = formData.tags
						.split(",")
						.map((tag) => tag.trim())
						.filter((tag) => tag);
					tags.forEach((tag) => formDataToSend.append("tags", tag));
				}

				setUploadProgress(90);
				await uploadMultipleDocuments(formDataToSend);
				setUploadProgress(100);
			} else {
				// Single file mode - use existing upload logic
				const file = filesToUpload[0];
				setCurrentUpload(`Uploading ${file.name}...`);
				setUploadProgress(50);

				const formDataToSend = new FormData();
				formDataToSend.append("file", file);
				formDataToSend.append(
					"title",
					formData.title || file.name.replace(/\.[^/.]+$/, "")
				);
				formDataToSend.append("description", formData.description);
				formDataToSend.append("category", formData.category);
				formDataToSend.append("accessLevel", formData.accessLevel);
				formDataToSend.append("visibility", formData.accessLevel);

				if (formData.tags) {
					const tags = formData.tags
						.split(",")
						.map((tag) => tag.trim())
						.filter((tag) => tag);
					tags.forEach((tag) => formDataToSend.append("tags", tag));
				}

				setUploadProgress(90);
				await uploadDocument(formDataToSend);
				setUploadProgress(100);
			}

			onClose();
			setFormData({
				title: "",
				description: "",
				category: "",
				tags: "",
				accessLevel: "private",
			});
			setSelectedFile(null);
			setSelectedFiles([]);
			setUploadProgress(0);
			setCurrentUpload("");
		} catch (error) {
			console.error("Error uploading documents:", error);
		} finally {
			setLoading(false);
			setUploadProgress(0);
			setCurrentUpload("");
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
							<Upload className="h-5 w-5 mr-2 text-purple-500" />
							Upload Document
						</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Multiple Mode Toggle */}
						<div className="flex items-center justify-between">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Upload Mode
							</label>
							<button
								type="button"
								onClick={toggleMultipleMode}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									multipleMode
										? "bg-purple-600"
										: "bg-gray-200 dark:bg-gray-700"
								}`}
							>
								<span className="sr-only">Enable multiple file upload</span>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										multipleMode ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
						<p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
							{multipleMode
								? "Multiple files mode: Upload several files at once"
								: "Single file mode: Upload one file at a time"}
						</p>

						{/* File Upload Area */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								File{multipleMode ? "s" : ""} *
							</label>
							<div
								className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
									dragOver
										? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
										: "border-gray-300 dark:border-gray-600 hover:border-purple-400"
								}`}
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
							>
								{/* Display selected files */}
								{multipleMode ? (
									selectedFiles.length > 0 ? (
										<div className="space-y-2">
											{selectedFiles.map((file, index) => (
												<div
													key={index}
													className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
												>
													<div className="flex items-center space-x-2">
														<File className="h-4 w-4 text-purple-500" />
														<div>
															<p className="text-sm font-medium text-gray-900 dark:text-white">
																{file.name}
															</p>
															<p className="text-xs text-gray-500 dark:text-gray-400">
																{formatFileSize(file.size)}
															</p>
														</div>
													</div>
													<button
														type="button"
														onClick={() => removeFile(index)}
														className="text-red-500 hover:text-red-700"
													>
														<X className="h-4 w-4" />
													</button>
												</div>
											))}
											<div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="text-purple-600 hover:text-purple-500 font-medium text-sm"
												>
													Add more files
												</button>
											</div>
										</div>
									) : (
										<div>
											<Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
											<p className="text-sm text-gray-600 dark:text-gray-400">
												Drag and drop files here, or{" "}
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="text-purple-600 hover:text-purple-500 font-medium"
												>
													browse
												</button>
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
												Select multiple files • Max 10MB per file
											</p>
										</div>
									)
								) : selectedFile ? (
									<div className="flex items-center justify-center space-x-2">
										<File className="h-8 w-8 text-purple-500" />
										<div>
											<p className="text-sm font-medium text-gray-900 dark:text-white">
												{selectedFile.name}
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{formatFileSize(selectedFile.size)}
											</p>
										</div>
									</div>
								) : (
									<div>
										<Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
										<p className="text-sm text-gray-600 dark:text-gray-400">
											Drag and drop a file here, or{" "}
											<button
												type="button"
												onClick={() => fileInputRef.current?.click()}
												className="text-purple-600 hover:text-purple-500 font-medium"
											>
												browse
											</button>
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											Max file size: 10MB
										</p>
									</div>
								)}
								<input
									ref={fileInputRef}
									type="file"
									onChange={handleFileInputChange}
									className="hidden"
									accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
									multiple={multipleMode}
								/>
							</div>
							{!multipleMode && selectedFile && (
								<button
									type="button"
									onClick={() => removeFile(0)}
									className="mt-2 text-sm text-red-600 hover:text-red-500"
								>
									Remove file
								</button>
							)}
						</div>

						{/* Upload Progress */}
						{loading && (
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										{currentUpload || "Preparing upload..."}
									</span>
									<span className="text-sm text-gray-600 dark:text-gray-400">
										{Math.round(uploadProgress)}%
									</span>
								</div>
								<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-purple-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${uploadProgress}%` }}
									/>
								</div>
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Title *
							</label>
							<input
								type="text"
								name="title"
								value={formData.title}
								onChange={handleChange}
								required={!multipleMode}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
								placeholder={
									multipleMode
										? "Base title (filenames will be used if empty)"
										: "Enter document title"
								}
							/>
							{multipleMode && (
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									Leave empty to use individual filenames as titles
								</p>
							)}
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
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
								placeholder="Optional description"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Category
								</label>
								<select
									name="category"
									value={formData.category}
									onChange={handleChange}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
								>
									<option value="">Select category</option>
									{/* New requested categories */}
									<option value="prd-document">PRD Document</option>
									<option value="requirement-doc">Requirement Document</option>
									<option value="self-prepared-document">
										Self Prepared Document
									</option>
									<option value="study-materials">Study Materials</option>
									{/* Existing categories */}
									<option value="contract">Contract</option>
									<option value="specification">Specification</option>
									<option value="report">Report</option>
									<option value="manual">Manual</option>
									<option value="presentation">Presentation</option>
									<option value="other">Other</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Access Level
								</label>
								<div className="relative">
									<Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
									<select
										name="accessLevel"
										value={formData.accessLevel}
										onChange={handleChange}
										className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
									>
										<option value="private">Private</option>
										<option value="team">Team</option>
										<option value="organization">Organization</option>
										<option value="public">Public</option>
									</select>
								</div>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Tags
							</label>
							<div className="relative">
								<Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
								<input
									type="text"
									name="tags"
									value={formData.tags}
									onChange={handleChange}
									className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
									placeholder="tag1, tag2, tag3"
								/>
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Separate tags with commas
							</p>
						</div>

						<div className="flex justify-end space-x-3 pt-4">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
								disabled={loading}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
								disabled={
									loading ||
									(multipleMode ? selectedFiles.length === 0 : !selectedFile)
								}
							>
								{loading
									? multipleMode && selectedFiles.length > 1
										? `Uploading ${selectedFiles.length} files...`
										: "Uploading..."
									: multipleMode && selectedFiles.length > 1
									? `Upload ${selectedFiles.length} Documents`
									: "Upload Document"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default DocumentModal;
