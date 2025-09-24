import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
	Building2,
	Plus,
	Edit,
	Trash2,
	Search,
	Users,
	Globe,
	Phone,
	Power,
	Mail,
	Save,
	X,
	AlertCircle,
} from "lucide-react";

const AdminOrganizations = () => {
	const [organizations, setOrganizations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingOrg, setEditingOrg] = useState(null);
	const [formData, setFormData] = useState({
		name: "",
		domain: "",
		contactInfo: "",
		isActive: true,
	});
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetchOrganizations();
	}, []);

	const fetchOrganizations = async () => {
		try {
			const token = localStorage.getItem("token");
			console.log(
				"Fetching organizations with token:",
				token ? "Present" : "Missing"
			);

			const response = await fetch("/api/organizations/admin", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("Fetch organizations response status:", response.status);

			if (response.ok) {
				const data = await response.json();
				console.log("Organizations data received:", data);
				console.log("First organization sample:", data.data?.[0]);
				console.log(
					"Organizations array:",
					data.data?.map((org) => ({
						id: org._id,
						name: org.name,
						isActive: org.isActive,
						hasIsActive: "isActive" in org,
					}))
				);
				setOrganizations(data.data || []);
			} else {
				console.error(
					"Failed to fetch organizations, status:",
					response.status
				);
			}
		} catch (error) {
			console.error("Error fetching organizations:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setErrors({});

		console.log("Submitting form with data:", formData);

		try {
			const token = localStorage.getItem("token");
			const url = editingOrg
				? `/api/organizations/${editingOrg._id}`
				: "/api/organizations";
			const method = editingOrg ? "PUT" : "POST";

			console.log("Making request:", { url, method, formData });

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			const result = await response.json();
			console.log("Submit response:", { status: response.status, result });

			if (response.ok) {
				await fetchOrganizations();
				handleCloseModal();
				toast.success(result.message || "Organization saved successfully");
			} else {
				if (result.errors) {
					const fieldErrors = {};
					result.errors.forEach((error) => {
						fieldErrors[error.path || error.param] = error.msg || error.message;
					});
					setErrors(fieldErrors);
				} else {
					setErrors({ general: result.message });
				}
			}
		} catch (error) {
			console.error("Error saving organization:", error);
			setErrors({ general: "Network error. Please try again." });
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (orgId, orgName) => {
		console.log("handleDelete called with:", { orgId, orgName });

		// Validate orgId before proceeding
		if (!orgId) {
			console.error("Organization ID is missing");
			toast.error(
				"Error: Organization ID is missing. Please refresh the page and try again."
			);
			return;
		}

		if (!window.confirm(`Are you sure you want to delete "${orgName}"?`)) {
			return;
		}

		try {
			const token = localStorage.getItem("token");
			console.log("Sending DELETE request to:", `/api/organizations/${orgId}`);

			const response = await fetch(`/api/organizations/${orgId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const result = await response.json();
			console.log("Delete response:", { status: response.status, result });

			if (response.ok) {
				await fetchOrganizations();
				toast.success("Organization deleted successfully");
			} else {
				toast.error(result.message || "Failed to delete organization");
			}
		} catch (error) {
			console.error("Error deleting organization:", error);
			toast.error("Network error. Please try again.");
		}
	};

	const handleEdit = (org) => {
		setEditingOrg(org);
		setFormData({
			name: org.name,
			domain: org.domain,
			contactInfo: org.contactInfo || "",
			isActive: org.isActive ?? true,
		});
		setIsModalOpen(true);
	};

	const handleAdd = () => {
		setEditingOrg(null);
		setFormData({
			name: "",
			domain: "",
			contactInfo: "",
			isActive: true,
		});
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingOrg(null);
		setFormData({
			name: "",
			domain: "",
			contactInfo: "",
			isActive: true,
		});
		setErrors({});
	};

	const handleToggleStatus = async (orgId, currentStatus) => {
		console.log("Toggling status:", {
			orgId,
			currentStatus,
			newStatus: !currentStatus,
		});

		try {
			const response = await fetch(`/api/organizations/${orgId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({
					isActive: !currentStatus,
				}),
			});

			console.log("Toggle status response:", response.status);

			if (response.ok) {
				const result = await response.json();
				console.log("Toggle result:", result);
				fetchOrganizations();
				toast.success("Organization status updated successfully");
			} else {
				const error = await response.json();
				console.error("Toggle error:", error);
				toast.error(error.message || "Failed to update organization status");
			}
		} catch (error) {
			console.error("Toggle network error:", error);
			toast.error("Error updating organization status");
		}
	};

	const filteredOrganizations = organizations.filter(
		(org) =>
			org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			org.domain.toLowerCase().includes(searchTerm.toLowerCase())
	);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
					</div>
					<div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
				</div>
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="animate-pulse space-y-4">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
							></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
						<Building2 className="h-8 w-8 mr-3 text-blue-600" />
						Organization Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Manage organizations and their email domains ({organizations.length}{" "}
						total)
					</p>
				</div>
				<button
					onClick={handleAdd}
					className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
				>
					<Plus className="h-4 w-4" />
					<span>Add Organization</span>
				</button>
			</div>

			{/* Search */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
				<div className="relative">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search organizations..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>

			{/* Organizations Table */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
				{filteredOrganizations.length === 0 ? (
					<div className="text-center py-12">
						<Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							{searchTerm ? "No organizations found" : "No organizations yet"}
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							{searchTerm
								? "Try adjusting your search criteria"
								: "Start by adding your first organization"}
						</p>
						{!searchTerm && (
							<button
								onClick={handleAdd}
								className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
							>
								Add First Organization
							</button>
						)}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Organization
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Domain
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Users
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 dark:divide-gray-600">
								{filteredOrganizations.map((org, index) => {
									// Use _id or id as fallback
									const orgId = org._id || org.id;

									return (
										<tr
											key={orgId || `org-${index}`}
											className="hover:bg-gray-50 dark:hover:bg-gray-700"
										>
											<td className="px-6 py-4">
												<div>
													<div className="text-sm font-medium text-gray-900 dark:text-white">
														{org.name}
													</div>
													{org.contactInfo && (
														<div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
															<Phone className="h-3 w-3 mr-1" />
															{org.contactInfo}
														</div>
													)}
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center text-sm text-gray-900 dark:text-white">
													<Globe className="h-4 w-4 mr-2 text-gray-400" />
													{org.domain}
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center text-sm text-gray-900 dark:text-white">
													<Users className="h-4 w-4 mr-2 text-gray-400" />
													{org.userCount || 0}
												</div>
											</td>
											<td className="px-6 py-4">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
														org.isActive
															? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
															: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
													}`}
												>
													{org.isActive ? "Active" : "Inactive"}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center space-x-2">
													<button
														onClick={() => {
															if (!orgId) {
																toast.error(
																	"Error: Organization ID is missing. Please refresh the page and try again."
																);
																return;
															}
															handleToggleStatus(orgId, org.isActive);
														}}
														className={`p-2 rounded-lg transition-colors ${
															!orgId
																? "opacity-50 cursor-not-allowed"
																: org.isActive
																? "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 cursor-pointer"
																: "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900/20 cursor-pointer"
														}`}
														title={
															!orgId
																? "Organization ID missing"
																: org.isActive
																? "Deactivate organization"
																: "Activate organization"
														}
													>
														<Power className="h-4 w-4" />
													</button>
													<button
														onClick={() => {
															if (!orgId) {
																toast.error(
																	"Error: Organization ID is missing. Please refresh the page and try again."
																);
																return;
															}
															handleEdit(org);
														}}
														className={`p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors ${
															!orgId
																? "opacity-50 cursor-not-allowed"
																: "cursor-pointer"
														}`}
														title={!orgId ? "Organization ID missing" : "Edit"}
													>
														<Edit className="h-4 w-4" />
													</button>
													<button
														onClick={() => {
															if (!orgId) {
																toast.error(
																	"Error: Organization ID is missing. Please refresh the page and try again."
																);
																return;
															}
															if (org.userCount && org.userCount > 0) {
																toast.error(
																	`Cannot delete organization. ${org.userCount} users are still associated with this organization.`
																);
																return;
															}
															handleDelete(orgId, org.name);
														}}
														className={`p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors ${
															!orgId
																? "opacity-50 cursor-not-allowed"
																: "cursor-pointer"
														}`}
														title={
															!orgId
																? "Organization ID missing"
																: org.userCount && org.userCount > 0
																? `Cannot delete: ${org.userCount} users associated`
																: "Delete organization"
														}
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								{editingOrg ? "Edit Organization" : "Add Organization"}
							</h3>
							<button
								onClick={handleCloseModal}
								className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
							>
								<X className="h-6 w-6" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							{errors.general && (
								<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center">
									<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
									<span className="text-sm text-red-700 dark:text-red-400">
										{errors.general}
									</span>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Organization Name *
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
										errors.name
											? "border-red-300 dark:border-red-600"
											: "border-gray-300 dark:border-gray-600"
									}`}
									placeholder="Enter organization name"
									required
								/>
								{errors.name && (
									<p className="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.name}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Domain *
								</label>
								<input
									type="text"
									value={formData.domain}
									onChange={(e) => {
										let normalizedDomain = e.target.value.toLowerCase().trim();
										// If it looks like an email, extract just the domain part
										if (normalizedDomain.includes("@")) {
											normalizedDomain = normalizedDomain.split("@").pop();
										}
										// Remove any remaining @ symbols
										normalizedDomain = normalizedDomain.replace(/^@+/, "");
										setFormData({ ...formData, domain: normalizedDomain });
									}}
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
										errors.domain
											? "border-red-300 dark:border-red-600"
											: "border-gray-300 dark:border-gray-600"
									}`}
									placeholder="e.g., company.com"
									required
								/>
								{errors.domain && (
									<p className="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.domain}
									</p>
								)}
								<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
									Enter the email domain (e.g., "gmail.com", "beehyv.com",
									"kalawatiputra.com"). Users with email addresses from this
									domain can register.
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Contact Information
								</label>
								<textarea
									value={formData.contactInfo}
									onChange={(e) =>
										setFormData({ ...formData, contactInfo: e.target.value })
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
									placeholder="Phone, address, or other contact details..."
									rows={3}
								/>
							</div>

							<div>
								<label className="flex items-center space-x-3">
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Organization Status
									</span>
									<div className="relative">
										<div
											onClick={() => {
												console.log(
													"Toggle clicked - current:",
													formData.isActive,
													"new:",
													!formData.isActive
												);
												setFormData({
													...formData,
													isActive: !formData.isActive,
												});
											}}
											className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${
												formData.isActive
													? "bg-blue-600"
													: "bg-gray-300 dark:bg-gray-600"
											}`}
										>
											<div
												className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
													formData.isActive ? "translate-x-6" : "translate-x-1"
												} mt-1`}
											></div>
										</div>
									</div>
									<span
										className={`text-sm ${
											formData.isActive
												? "text-green-600 dark:text-green-400"
												: "text-gray-500 dark:text-gray-400"
										}`}
									>
										{formData.isActive ? "Active" : "Inactive"}
									</span>
								</label>
							</div>

							<div className="flex justify-end space-x-3 pt-4">
								<button
									type="button"
									onClick={handleCloseModal}
									className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
								>
									<Save className="h-4 w-4" />
									<span>{submitting ? "Saving..." : "Save Organization"}</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminOrganizations;
