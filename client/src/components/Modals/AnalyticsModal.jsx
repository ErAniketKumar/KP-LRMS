import React, { useState, useEffect } from "react";
import {
	X,
	BarChart3,
	MousePointer,
	Users,
	Calendar,
	Globe,
	Smartphone,
	Monitor,
} from "lucide-react";

const AnalyticsModal = ({ isOpen, onClose, shortUrl }) => {
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(false);

	const fetchAnalytics = async () => {
		if (!shortUrl || !isOpen) return;

		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`/api/shorturl/${shortUrl._id}/analytics`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await response.json();
			if (data.success) {
				setAnalytics(data.data.analytics);
			}
		} catch (error) {
			console.error("Error fetching analytics:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAnalytics();
	}, [isOpen, shortUrl]);

	if (!isOpen || !shortUrl) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center space-x-3">
						<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
							<BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">
								Analytics
							</h2>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								{shortUrl.title ||
									`${window.location.origin}/s/${shortUrl.shortCode}`}
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

				{/* Content */}
				<div className="p-6">
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
							<p className="text-gray-600 dark:text-gray-400">
								Loading analytics...
							</p>
						</div>
					) : analytics ? (
						<div className="space-y-6">
							{/* Overview Stats */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
									<div className="flex items-center space-x-2 mb-2">
										<MousePointer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
										<span className="text-sm font-medium text-blue-700 dark:text-blue-300">
											Total Clicks
										</span>
									</div>
									<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
										{analytics.totalClicks}
									</p>
								</div>
								<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
									<div className="flex items-center space-x-2 mb-2">
										<Users className="h-5 w-5 text-green-600 dark:text-green-400" />
										<span className="text-sm font-medium text-green-700 dark:text-green-300">
											Unique Visitors
										</span>
									</div>
									<p className="text-2xl font-bold text-green-900 dark:text-green-100">
										{analytics.uniqueClicks}
									</p>
								</div>
								<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
									<div className="flex items-center space-x-2 mb-2">
										<Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
										<span className="text-sm font-medium text-purple-700 dark:text-purple-300">
											Today
										</span>
									</div>
									<p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
										{analytics.clicksToday}
									</p>
								</div>
								<div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
									<div className="flex items-center space-x-2 mb-2">
										<BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
										<span className="text-sm font-medium text-orange-700 dark:text-orange-300">
											This Week
										</span>
									</div>
									<p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
										{analytics.clicksThisWeek}
									</p>
								</div>
							</div>

							{/* Time Period Stats */}
							<div className="grid grid-cols-3 gap-4">
								<div className="text-center">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Today
									</p>
									<p className="text-xl font-semibold text-gray-900 dark:text-white">
										{analytics.clicksToday}
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										This Week
									</p>
									<p className="text-xl font-semibold text-gray-900 dark:text-white">
										{analytics.clicksThisWeek}
									</p>
								</div>
								<div className="text-center">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										This Month
									</p>
									<p className="text-xl font-semibold text-gray-900 dark:text-white">
										{analytics.clicksThisMonth}
									</p>
								</div>
							</div>

							{/* Charts Section */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Devices Chart */}
								<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
										<Smartphone className="h-5 w-5 mr-2" />
										Devices
									</h3>
									{Object.keys(analytics.devices).length > 0 ? (
										<div className="space-y-2">
											{Object.entries(analytics.devices).map(
												([device, count]) => (
													<div
														key={device}
														className="flex items-center justify-between"
													>
														<span className="text-sm text-gray-600 dark:text-gray-400">
															{device}
														</span>
														<div className="flex items-center space-x-2">
															<div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
																<div
																	className="bg-blue-600 h-2 rounded-full"
																	style={{
																		width: `${
																			(count / analytics.totalClicks) * 100
																		}%`,
																	}}
																></div>
															</div>
															<span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
																{count}
															</span>
														</div>
													</div>
												)
											)}
										</div>
									) : (
										<p className="text-gray-500 dark:text-gray-400 text-sm">
											No device data available
										</p>
									)}
								</div>

								{/* Browsers Chart */}
								<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
										<Globe className="h-5 w-5 mr-2" />
										Browsers
									</h3>
									{Object.keys(analytics.browsers).length > 0 ? (
										<div className="space-y-2">
											{Object.entries(analytics.browsers)
												.slice(0, 5)
												.map(([browser, count]) => (
													<div
														key={browser}
														className="flex items-center justify-between"
													>
														<span className="text-sm text-gray-600 dark:text-gray-400 truncate">
															{browser}
														</span>
														<div className="flex items-center space-x-2">
															<div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
																<div
																	className="bg-green-600 h-2 rounded-full"
																	style={{
																		width: `${
																			(count / analytics.totalClicks) * 100
																		}%`,
																	}}
																></div>
															</div>
															<span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
																{count}
															</span>
														</div>
													</div>
												))}
										</div>
									) : (
										<p className="text-gray-500 dark:text-gray-400 text-sm">
											No browser data available
										</p>
									)}
								</div>

								{/* Operating Systems Chart */}
								<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
										<Monitor className="h-5 w-5 mr-2" />
										Operating Systems
									</h3>
									{Object.keys(analytics.operatingSystems).length > 0 ? (
										<div className="space-y-2">
											{Object.entries(analytics.operatingSystems).map(
												([os, count]) => (
													<div
														key={os}
														className="flex items-center justify-between"
													>
														<span className="text-sm text-gray-600 dark:text-gray-400 truncate">
															{os}
														</span>
														<div className="flex items-center space-x-2">
															<div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
																<div
																	className="bg-purple-600 h-2 rounded-full"
																	style={{
																		width: `${
																			(count / analytics.totalClicks) * 100
																		}%`,
																	}}
																></div>
															</div>
															<span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
																{count}
															</span>
														</div>
													</div>
												)
											)}
										</div>
									) : (
										<p className="text-gray-500 dark:text-gray-400 text-sm">
											No OS data available
										</p>
									)}
								</div>

								{/* Recent Activity */}
								<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
										Recent Activity
									</h3>
									{analytics.recentClicks &&
									analytics.recentClicks.length > 0 ? (
										<div className="space-y-2 max-h-40 overflow-y-auto">
											{analytics.recentClicks.map((click, index) => (
												<div
													key={index}
													className="text-xs text-gray-600 dark:text-gray-400 py-1 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
												>
													<div className="flex justify-between items-center">
														<span>
															{new Date(click.timestamp).toLocaleString()}
														</span>
														<span className="text-gray-500">
															{click.browser}
														</span>
													</div>
													{click.referer && (
														<div className="truncate text-gray-500 dark:text-gray-500">
															From: {click.referer}
														</div>
													)}
												</div>
											))}
										</div>
									) : (
										<p className="text-gray-500 dark:text-gray-400 text-sm">
											No recent activity
										</p>
									)}
								</div>
							</div>

							{/* Daily Clicks Chart (Simple) */}
							{analytics.dailyClicks && analytics.dailyClicks.length > 0 && (
								<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
										Daily Clicks (Last 30 Days)
									</h3>
									<div className="flex items-end space-x-1 h-32">
										{analytics.dailyClicks.slice(-30).map((day, index) => {
											const maxClicks = Math.max(
												...analytics.dailyClicks.map((d) => d.clicks)
											);
											const height =
												maxClicks > 0 ? (day.clicks / maxClicks) * 100 : 0;
											return (
												<div
													key={index}
													className="flex-1 flex flex-col items-center"
												>
													<div
														className="w-full bg-blue-600 rounded-t min-h-[2px] transition-all"
														style={{ height: `${height}%` }}
														title={`${day.date}: ${day.clicks} clicks`}
													></div>
													<span className="text-xs text-gray-500 dark:text-gray-400 mt-1 rotate-45 origin-left">
														{new Date(day.date).toLocaleDateString(undefined, {
															month: "short",
															day: "numeric",
														})}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-8">
							<BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-600 dark:text-gray-400">
								No analytics data available
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AnalyticsModal;
