import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="text-center">
					{/* KP-LRMS Brand Logo */}
					<div className="mx-auto h-20 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
						<span className="text-2xl font-bold text-white">KP</span>
					</div>
					<h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
						KP-LRMS
					</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
						Learning Resource Management System
					</p>

					{/* 404 Error */}
					<div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
						<span className="text-2xl font-bold text-red-600 dark:text-red-400">
							404
						</span>
					</div>
					<h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
						Page not found
					</h2>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Sorry, we couldn't find the page you're looking for in KP-LRMS.
					</p>
				</div>

				<div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
					<Link
						to="/dashboard"
						className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						<Home className="h-4 w-4 mr-2" />
						Go to Dashboard
					</Link>
					<button
						onClick={() => window.history.back()}
						className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Go Back
					</button>
				</div>
			</div>
		</div>
	);
};

export default NotFound;
