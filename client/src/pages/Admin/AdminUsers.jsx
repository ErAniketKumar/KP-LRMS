import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
	Users,
	Search,
	Shield,
	Trash2,
	CheckCircle2,
	XCircle,
} from "lucide-react";

const RoleSelect = ({ value, onChange }) => (
	<select
		className="bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 text-sm"
		value={value}
		onChange={(e) => onChange(e.target.value)}
	>
		<option value="viewer">viewer</option>
		<option value="contributor">contributor</option>
		<option value="admin">admin</option>
	</select>
);

const AdminUsers = () => {
	const { api, user } = useAuth();
	const [query, setQuery] = useState("");
	const [role, setRole] = useState("");
	const [status, setStatus] = useState("");
	const [org, setOrg] = useState("");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [rows, setRows] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);

	const load = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (query) params.set("q", query);
			if (role) params.set("role", role);
			if (status) params.set("status", status);
			if (org) params.set("org", org);
			params.set("page", String(page));
			params.set("limit", String(limit));
			const res = await api.get(`/admin/users?${params.toString()}`);
			setRows(res.data.data || []);
			setTotal(res.data.pagination?.total || 0);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit]);

	if (user?.role !== "admin") return null;

	const pages = Math.max(1, Math.ceil(total / limit));

	const onRoleChange = async (id, newRole) => {
		await api.put(`/admin/users/${id}/role`, { role: newRole });
		load();
	};

	const onToggleStatus = async (id, isActive) => {
		await api.put(`/admin/users/${id}/status`, { isActive });
		load();
	};

	const onVerify = async (id) => {
		await api.put(`/admin/users/${id}/status`, { isVerified: true });
		load();
	};

	const onDelete = async (id) => {
		if (!window.confirm("Delete this user? This cannot be undone.")) return;
		await api.delete(`/admin/users/${id}`);
		load();
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
					<Users className="h-6 w-6 mr-2" /> User Management
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Manage users, roles, and status
				</p>
			</div>

			{/* Filters */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
				<div className="relative md:col-span-2">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
					<input
						className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded text-sm"
						placeholder="Search name or email"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && load()}
					/>
				</div>
				<select
					className="bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-2 text-sm"
					value={role}
					onChange={(e) => setRole(e.target.value)}
				>
					<option value="">All roles</option>
					<option value="viewer">viewer</option>
					<option value="contributor">contributor</option>
					<option value="admin">admin</option>
				</select>
				<select
					className="bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-2 text-sm"
					value={status}
					onChange={(e) => setStatus(e.target.value)}
				>
					<option value="">All status</option>
					<option value="active">active</option>
					<option value="inactive">inactive</option>
					<option value="unverified">unverified</option>
				</select>
				<div className="flex items-center space-x-2">
					<button
						onClick={() => {
							setPage(1);
							load();
						}}
						className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
					>
						Apply
					</button>
					<button
						onClick={() => {
							setQuery("");
							setRole("");
							setStatus("");
							setOrg("");
							setPage(1);
							load();
						}}
						className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm"
					>
						Reset
					</button>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
						<thead className="bg-gray-50 dark:bg-gray-700">
							<tr>
								<th className="px-4 py-2 text-left font-semibold">Name</th>
								<th className="px-4 py-2 text-left font-semibold">Email</th>
								<th className="px-4 py-2 text-left font-semibold">
									Organization
								</th>
								<th className="px-4 py-2 text-left font-semibold">Role</th>
								<th className="px-4 py-2 text-left font-semibold">Verified</th>
								<th className="px-4 py-2 text-left font-semibold">Active</th>
								<th className="px-4 py-2 text-left font-semibold">
									Last Login
								</th>
								<th className="px-4 py-2 text-right font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
							{loading ? (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
									>
										Loading…
									</td>
								</tr>
							) : rows.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
									>
										No users found
									</td>
								</tr>
							) : (
								rows.map((u) => (
									<tr
										key={u._id}
										className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
									>
										<td className="px-4 py-2">{u.fullName}</td>
										<td className="px-4 py-2">{u.email}</td>
										<td className="px-4 py-2">{u.organization}</td>
										<td className="px-4 py-2">
											<RoleSelect
												value={u.role}
												onChange={(r) => onRoleChange(u._id, r)}
											/>
										</td>
										<td className="px-4 py-2">
											{u.isVerified ? (
												<span className="inline-flex items-center text-green-600">
													<CheckCircle2 className="h-4 w-4 mr-1" /> yes
												</span>
											) : (
												<button
													onClick={() => onVerify(u._id)}
													className="inline-flex items-center text-yellow-600 hover:text-yellow-700"
												>
													<Shield className="h-4 w-4 mr-1" /> verify
												</button>
											)}
										</td>
										<td className="px-4 py-2">
											{u.isActive ? (
												<button
													onClick={() => onToggleStatus(u._id, false)}
													className="inline-flex items-center text-green-600 hover:text-green-700"
												>
													<CheckCircle2 className="h-4 w-4 mr-1" /> active
												</button>
											) : (
												<button
													onClick={() => onToggleStatus(u._id, true)}
													className="inline-flex items-center text-red-600 hover:text-red-700"
												>
													<XCircle className="h-4 w-4 mr-1" /> inactive
												</button>
											)}
										</td>
										<td className="px-4 py-2">
											{u.lastLogin
												? new Date(u.lastLogin).toLocaleString()
												: "—"}
										</td>
										<td className="px-4 py-2 text-right">
											<button
												onClick={() => onDelete(u._id)}
												className="inline-flex items-center px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
											>
												<Trash2 className="h-4 w-4 mr-1" /> Delete
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				{/* Pagination */}
				<div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
					<div className="text-sm text-gray-600 dark:text-gray-400">
						Page {page} of {pages}
					</div>
					<div className="space-x-2">
						<button
							disabled={page <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							className="px-3 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded disabled:opacity-50"
						>
							Prev
						</button>
						<button
							disabled={page >= pages}
							onClick={() => setPage((p) => Math.min(pages, p + 1))}
							className="px-3 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded disabled:opacity-50"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminUsers;
