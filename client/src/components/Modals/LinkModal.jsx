import React, { useState, useEffect } from "react";
import { X, Link as LinkIcon, Globe, Tag, Users } from "lucide-react";
import { useResource } from "../../context/ResourceContext";

const LinkModal = ({ isOpen, onClose, link = null }) => {
	const { createLink, updateLink } = useResource();
	const isEditing = !!link;

	const [formData, setFormData] = useState({
		title: "",
		url: "",
		description: "",
		category: "",
		tags: "",
		accessLevel: "private",
	});

	// Update form data when link prop changes
	useEffect(() => {
		if (link) {
			setFormData({
				title: link.title || "",
				url: link.url || "",
				description: link.description || "",
				category: link.category || "",
				tags: link.tags?.join(", ") || "",
				accessLevel: link.visibility || link.accessLevel || "private",
			});
		} else {
			setFormData({
				title: "",
				url: "",
				description: "",
				category: "",
				tags: "",
				accessLevel: "private",
			});
		}
	}, [link]);

	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const linkData = {
				...formData,
				tags: formData.tags
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag),
			};

			// Map to backend visibility field
			linkData.visibility = formData.accessLevel;
			delete linkData.accessLevel;

			if (isEditing && (link?._id || link?.id)) {
				await updateLink(link._id || link.id, linkData);
			} else {
				await createLink(linkData);
			}

			onClose();
			setFormData({
				title: "",
				url: "",
				description: "",
				category: "",
				tags: "",
				accessLevel: "private",
			});
		} catch (error) {
			console.error("Error saving link:", error);
		} finally {
			setLoading(false);
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
							<LinkIcon className="h-5 w-5 mr-2 text-blue-500" />
							{isEditing ? "Edit Link" : "Add New Link"}
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
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
								placeholder="Enter link title"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								URL *
							</label>
							<div className="relative">
								<Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
								<input
									type="url"
									name="url"
									value={formData.url}
									onChange={handleChange}
									required
									className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
									placeholder="https://example.com"
								/>
							</div>
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
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
								>
									<option value="">Select category</option>
									{/* Work-focused categories */}
									<option value="bugsheet">Bug Sheet</option>
									<option value="credentials-sheet">Credentials Sheet</option>
									<option value="prd-doc">PRD Document</option>
									<option value="time-sheet">Time Sheet</option>
									<option value="workreport-sheet">Work Report Sheet</option>
									<option value="jira-ticket">Jira Ticket Link</option>
									{/* General categories */}
									<option value="development">Development</option>
									<option value="design">Design</option>
									<option value="documentation">Documentation</option>
									<option value="tools">Tools</option>
									<option value="reference">Reference</option>
									<option value="resources">Resources</option>
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
										className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
									className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
								className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								disabled={loading}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
								disabled={loading}
							>
								{loading
									? "Saving..."
									: isEditing
									? "Update Link"
									: "Create Link"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default LinkModal;
