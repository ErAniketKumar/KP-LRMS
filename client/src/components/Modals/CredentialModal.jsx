import React, { useState, useEffect } from "react";
import {
	X,
	Shield,
	Eye,
	EyeOff,
	Lock,
	User,
	Copy,
	CheckCircle,
} from "lucide-react";
import { useResource } from "../../context/ResourceContext";

const CredentialModal = ({ isOpen, onClose, credential = null }) => {
	const { createCredential, updateCredential } = useResource();
	const isEditing = !!credential;

	const [formData, setFormData] = useState({
		title: "",
		username: "",
		email: "",
		password: "",
		password2: "",
		url: "",
		notes: "",
		category: "",
		visibility: "private",
	});

	// Update form data when credential prop changes
	useEffect(() => {
		if (credential) {
			setFormData({
				title: credential.title || "",
				username: credential.username || "",
				email: credential.email || "",
				password: credential.password || "",
				password2: credential.password2 || "",
				url: credential.url || "",
				notes: credential.notes || "",
				category: credential.category || "",
				visibility: credential.visibility || "private",
			});
		} else {
			setFormData({
				title: "",
				username: "",
				email: "",
				password: "",
				password2: "",
				url: "",
				notes: "",
				category: "",
				visibility: "private",
			});
		}
	}, [credential]);

	const [showPassword, setShowPassword] = useState(false);
	const [showPassword2, setShowPassword2] = useState(false);
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState({});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Sanitize payload: remove empty strings to prevent 400 from validators
			const payload = Object.fromEntries(
				Object.entries(formData).filter(([, v]) => v !== "")
			);
			if (isEditing && (credential?._id || credential?.id)) {
				await updateCredential(credential._id || credential.id, payload);
			} else {
				await createCredential(payload);
			}

			onClose();
			setFormData({
				title: "",
				username: "",
				email: "",
				password: "",
				password2: "",
				url: "",
				notes: "",
				category: "",
				visibility: "private",
			});
		} catch (error) {
			console.error("Error saving credential:", error);
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = async (text, field) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied((prev) => ({ ...prev, [field]: true }));
			setTimeout(() => {
				setCopied((prev) => ({ ...prev, [field]: false }));
			}, 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	const generatePassword = () => {
		const length = 16;
		const charset =
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
		let password = "";
		for (let i = 0; i < length; i++) {
			password += charset.charAt(Math.floor(Math.random() * charset.length));
		}
		setFormData((prev) => ({ ...prev, password }));
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
							<Shield className="h-5 w-5 mr-2 text-purple-500" />
							{isEditing ? "Edit Credential" : "Add New Credential"}
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
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
								placeholder="e.g., Facebook, Gmail, AWS"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Website URL
							</label>
							<input
								type="url"
								name="url"
								value={formData.url}
								onChange={handleChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
								placeholder="https://example.com"
							/>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Username
								</label>
								<div className="relative">
									<User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleChange}
										className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
										placeholder="Enter username"
									/>
									{formData.username && (
										<button
											type="button"
											onClick={() =>
												copyToClipboard(formData.username, "username")
											}
											className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
										>
											{copied.username ? (
												<CheckCircle className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</button>
									)}
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Email
								</label>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
									placeholder="Enter email"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Password *
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
								<input
									type={showPassword ? "text" : "password"}
									name="password"
									value={formData.password}
									onChange={handleChange}
									required
									className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
									placeholder="Enter password"
								/>
								<div className="absolute right-2 top-2 flex space-x-1">
									{formData.password && (
										<button
											type="button"
											onClick={() =>
												copyToClipboard(formData.password, "password")
											}
											className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
										>
											{copied.password ? (
												<CheckCircle className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</button>
									)}
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>
							<button
								type="button"
								onClick={generatePassword}
								className="mt-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
							>
								Generate strong password
							</button>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Secondary Password (Optional)
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
								<input
									type={showPassword2 ? "text" : "password"}
									name="password2"
									value={formData.password2}
									onChange={handleChange}
									className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
									placeholder="Enter secondary password (optional)"
								/>
								<div className="absolute right-2 top-2 flex space-x-1">
									{formData.password2 && (
										<button
											type="button"
											onClick={() =>
												copyToClipboard(formData.password2, "password2")
											}
											className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
										>
											{copied.password2 ? (
												<CheckCircle className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</button>
									)}
									<button
										type="button"
										onClick={() => setShowPassword2(!showPassword2)}
										className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
									>
										{showPassword2 ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
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
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
							>
								<option value="">Select category</option>
								<option value="social">Social Media</option>
								<option value="email">Email</option>
								<option value="work">Work</option>
								<option value="banking">Banking</option>
								<option value="shopping">Shopping</option>
								<option value="entertainment">Entertainment</option>
								<option value="cloud">Cloud Services</option>
								<option value="pgadmin">PgAdmin</option>
								<option value="kibana">Kibana Dashboard</option>
								<option value="hrms">HRMS&PGR</option>
								<option value="other">Other</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Visibility
							</label>
							<select
								name="visibility"
								value={formData.visibility}
								onChange={handleChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
							>
								<option value="private">Private</option>
								<option value="organization">Organization</option>
								<option value="public">Public</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Notes
							</label>
							<textarea
								name="notes"
								value={formData.notes}
								onChange={handleChange}
								rows={2}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
								placeholder="Additional notes (optional)"
							/>
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
								disabled={loading}
							>
								{loading
									? "Saving..."
									: isEditing
									? "Update Credential"
									: "Save Credential"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default CredentialModal;
