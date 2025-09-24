import React, { useEffect, useState } from "react";
import {
	Shield,
	Users,
	BarChart3,
	Settings,
	FileText,
	Key,
	Link as LinkIcon,
	CheckSquare,
	HardDrive,
	Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
	const { user } = useAuth();

	if (user?.role !== "admin") {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
						Access Denied
					</h3>
					<p className="text-gray-600 dark:text-gray-400">
						You don't have permission to access this area.
					</p>
				</div>
			</div>
		);
	}

	const navigate = useNavigate();
	const { api } = useAuth();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState(null);

	useEffect(() => {
		const loadStats = async () => {
			try {
				const res = await api.get("/admin/system-stats");
				setStats(res.data.data);
			} catch (e) {
				// noop, UI will show placeholders
			} finally {
				setLoading(false);
			}
		};
		loadStats();
	}, [api]);

	const adminStats = [
		{
			name: "Total Users",
			value: stats?.users?.total ?? "-",
			icon: Users,
			color: "bg-blue-500",
		},
		{
			name: "Active Users",
			value: stats?.users?.active ?? "-",
			icon: Settings,
			color: "bg-green-500",
		},
		{
			name: "Unverified",
			value: stats?.users?.unverified ?? "-",
			icon: Shield,
			color: "bg-yellow-500",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					Admin Panel
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					System administration and management
				</p>
			</div>

			{/* Admin Stats */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{adminStats.map((stat) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.name}
							className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
						>
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className={`${stat.color} p-3 rounded-md`}>
											<Icon className="h-6 w-6 text-white" />
										</div>
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
												{stat.name}
											</dt>
											<dd className="text-2xl font-semibold text-gray-900 dark:text-white">
												{loading ? "…" : stat.value}
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Resource Overview */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						name: "Links",
						value: stats?.resources?.links ?? "-",
						icon: LinkIcon,
						color: "bg-indigo-500",
					},
					{
						name: "Documents",
						value: stats?.resources?.documents ?? "-",
						icon: FileText,
						color: "bg-purple-500",
					},
					{
						name: "Credentials",
						value: stats?.resources?.credentials ?? "-",
						icon: Key,
						color: "bg-green-500",
					},
					{
						name: "Open Tasks",
						value: stats?.resources?.openTodos ?? "-",
						icon: CheckSquare,
						color: "bg-orange-500",
					},
				].map((stat) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.name}
							className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
						>
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className={`${stat.color} p-3 rounded-md`}>
											<Icon className="h-6 w-6 text-white" />
										</div>
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
												{stat.name}
											</dt>
											<dd className="text-2xl font-semibold text-gray-900 dark:text-white">
												{loading ? "…" : stat.value}
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Storage */}
			<div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
				<div className="p-5 flex items-center">
					<div className="flex-shrink-0">
						<div className="bg-slate-500 p-3 rounded-md">
							<HardDrive className="h-6 w-6 text-white" />
						</div>
					</div>
					<div className="ml-5">
						<div className="text-sm font-medium text-gray-500 dark:text-gray-400">
							Document Storage
						</div>
						<div className="text-2xl font-semibold text-gray-900 dark:text-white">
							{loading
								? "…"
								: `${Math.round(
										(stats?.storage?.documentsBytes || 0) / (1024 * 1024)
								  )} MB`}
						</div>
					</div>
				</div>
			</div>

			{/* Admin Actions */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h3 className="text-lg font-medium text-gray-900 dark:text-white">
						Quick Actions
					</h3>
				</div>
				<div className="p-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<button
							onClick={() => navigate("/admin/users")}
							className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
						>
							<Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
							<span className="text-sm font-medium text-blue-900 dark:text-blue-100">
								Manage Users
							</span>
						</button>
						<button
							onClick={() => navigate("/admin/organizations")}
							className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
						>
							<Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
							<span className="text-sm font-medium text-orange-900 dark:text-orange-100">
								Organizations
							</span>
						</button>
						<button
							onClick={() => navigate("/admin/analytics")}
							className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
						>
							<BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
							<span className="text-sm font-medium text-green-900 dark:text-green-100">
								View Analytics
							</span>
						</button>
						<button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
							<Settings className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
							<span className="text-sm font-medium text-purple-900 dark:text-purple-100">
								System Settings
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Admin;
