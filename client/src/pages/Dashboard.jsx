import React, { useState, useEffect } from "react";
import {
	BarChart3,
	Users,
	Link as LinkIcon,
	Key,
	FileText,
	CheckSquare,
	TrendingUp,
	Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../context/ResourceContext";
import LinkModal from "../components/Modals/LinkModal";
import DocumentModal from "../components/Modals/DocumentModal";
import TodoModal from "../components/Modals/TodoModal";
import CredentialModal from "../components/Modals/CredentialModal";

const Dashboard = () => {
	const { user } = useAuth();
	const {
		links,
		documents,
		todos,
		credentials,
		stats: dashboardStats,
		fetchDashboardStats,
		recentActivity,
		fetchRecentActivity,
		loading,
	} = useResource();
	const [modals, setModals] = useState({
		link: false,
		document: false,
		todo: false,
		credential: false,
	});

	useEffect(() => {
		fetchDashboardStats();
		fetchRecentActivity();
	}, [fetchDashboardStats, fetchRecentActivity]);

	const openModal = (type) => {
		setModals((prev) => ({ ...prev, [type]: true }));
	};

	const closeModal = (type) => {
		setModals((prev) => ({ ...prev, [type]: false }));
	};

	const stats = [
		{
			name: "Total Links",
			value: dashboardStats?.totalLinks || "0",
			change: `+${dashboardStats?.linksGrowth || 0}%`,
			changeType: "positive",
			icon: LinkIcon,
			color: "bg-blue-500",
		},
		{
			name: "Credentials",
			value: dashboardStats?.totalCredentials || "0",
			change: `+${dashboardStats?.credentialsGrowth || 0}%`,
			changeType: "positive",
			icon: Key,
			color: "bg-green-500",
		},
		{
			name: "Documents",
			value: dashboardStats?.totalDocuments || "0",
			change: `+${dashboardStats?.documentsGrowth || 0}%`,
			changeType: "positive",
			icon: FileText,
			color: "bg-purple-500",
		},
		{
			name: "Active Tasks",
			value: dashboardStats?.activeTodos || "0",
			change: `${dashboardStats?.todosChange || 0}%`,
			changeType:
				(dashboardStats?.todosChange || 0) >= 0 ? "positive" : "negative",
			icon: CheckSquare,
			color: "bg-orange-500",
		},
	];

	// recentActivity now comes from backend via context

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="animate-pulse">
						<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="bg-white dark:bg-gray-800 rounded-lg shadow p-5"
						>
							<div className="animate-pulse">
								<div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
								<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
								<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
							</div>
						</div>
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{[1, 2].map((i) => (
						<div
							key={i}
							className="bg-white dark:bg-gray-800 rounded-lg shadow"
						>
							<div className="p-6 animate-pulse">
								<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
								<div className="space-y-3">
									{[1, 2, 3].map((j) => (
										<div
											key={j}
											className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
										></div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Welcome Section */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
							Welcome back, {user?.fullName}!
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Here's what's happening with your resources today.
						</p>
					</div>
					<div className="text-right">
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{user?.organization}
						</p>
						<p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
							{user?.role}
						</p>
					</div>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => {
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
											<dd className="flex items-baseline">
												<div className="text-2xl font-semibold text-gray-900 dark:text-white">
													{stat.value}
												</div>
												<div
													className={`ml-2 flex items-baseline text-sm font-semibold ${
														stat.changeType === "positive"
															? "text-green-600 dark:text-green-400"
															: "text-red-600 dark:text-red-400"
													}`}
												>
													<TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
													<span className="ml-1">{stat.change}</span>
												</div>
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Recent Activity & Quick Actions */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recent Activity */}
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
					<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
							<Activity className="h-5 w-5 mr-2" />
							Recent Activity
						</h3>
					</div>
					<div className="divide-y divide-gray-200 dark:divide-gray-700">
						{recentActivity.map((activity) => (
							<div key={activity.id} className="px-6 py-4">
								<div className="flex items-center space-x-3">
									<div className="flex-shrink-0">
										<div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
											<span className="text-xs font-medium text-gray-600 dark:text-gray-300">
												{activity.user
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</span>
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm text-gray-900 dark:text-white">
											<span className="font-medium">{activity.user}</span>{" "}
											{activity.action}{" "}
											<span className="font-medium">{activity.resource}</span>
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{activity.time}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Quick Actions */}
				<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
					<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white">
							Quick Actions
						</h3>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-2 gap-4">
							<button
								onClick={() => openModal("link")}
								className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
							>
								<LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
								<span className="text-sm font-medium text-blue-900 dark:text-blue-100">
									Add Link
								</span>
							</button>
							<button
								onClick={() => openModal("credential")}
								className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
							>
								<Key className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
								<span className="text-sm font-medium text-green-900 dark:text-green-100">
									New Credential
								</span>
							</button>
							<button
								onClick={() => openModal("document")}
								className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
							>
								<FileText className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
								<span className="text-sm font-medium text-purple-900 dark:text-purple-100">
									Upload Doc
								</span>
							</button>
							<button
								onClick={() => openModal("todo")}
								className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
							>
								<CheckSquare className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
								<span className="text-sm font-medium text-orange-900 dark:text-orange-100">
									Create Task
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			<LinkModal isOpen={modals.link} onClose={() => closeModal("link")} />
			<DocumentModal
				isOpen={modals.document}
				onClose={() => closeModal("document")}
			/>
			<TodoModal isOpen={modals.todo} onClose={() => closeModal("todo")} />
			<CredentialModal
				isOpen={modals.credential}
				onClose={() => closeModal("credential")}
			/>
		</div>
	);
};

export default Dashboard;
