import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { BarChart3 } from "lucide-react";

const AdminAnalytics = () => {
	const { api, user } = useAuth();
	const [days, setDays] = useState(30);
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const res = await api.get(`/admin/analytics?days=${days}`);
				setData(res.data.data || []);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [api, days]);

	if (user?.role !== "admin") return null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
					<BarChart3 className="h-6 w-6 mr-2" /> Usage Analytics
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Events by day, action, and resource
				</p>
			</div>

			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center space-x-3">
				<label className="text-sm text-gray-600 dark:text-gray-400">
					Range
				</label>
				<select
					className="bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 text-sm"
					value={days}
					onChange={(e) => setDays(parseInt(e.target.value, 10))}
				>
					{[7, 14, 30, 60, 90].map((d) => (
						<option key={d} value={d}>
							{d} days
						</option>
					))}
				</select>
			</div>

			<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h3 className="text-lg font-medium text-gray-900 dark:text-white">
						Event counts
					</h3>
				</div>
				<div className="p-6">
					{loading ? (
						<div className="text-gray-500 dark:text-gray-400">Loading…</div>
					) : data.length === 0 ? (
						<div className="text-gray-500 dark:text-gray-400">
							No analytics data.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
								<thead className="bg-gray-50 dark:bg-gray-700">
									<tr>
										<th className="px-4 py-2 text-left font-semibold">Date</th>
										<th className="px-4 py-2 text-left font-semibold">
											Action
										</th>
										<th className="px-4 py-2 text-left font-semibold">
											Resource
										</th>
										<th className="px-4 py-2 text-left font-semibold">Count</th>
										<th className="px-4 py-2 text-left font-semibold">
											Unique Users
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{data.map((row, idx) => (
										<tr
											key={idx}
											className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
										>
											<td className="px-4 py-2">{row._id?.date}</td>
											<td className="px-4 py-2">{row._id?.action}</td>
											<td className="px-4 py-2">{row._id?.resourceType}</td>
											<td className="px-4 py-2">{row.count}</td>
											<td className="px-4 py-2">{row.uniqueUserCount}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AdminAnalytics;
