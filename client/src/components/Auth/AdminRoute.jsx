import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../UI/LoadingSpinner";

const AdminRoute = ({ children }) => {
	const { isAuthenticated, isLoading, user } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/auth/login" replace />;
	}

	if (user?.role !== "admin") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
					<div className="text-center">
						<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
							<svg
								className="h-6 w-6 text-red-600 dark:text-red-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							Access Denied
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
							You don't have administrator privileges to access this page.
						</p>
						<button
							onClick={() => window.history.back()}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
						>
							Go Back
						</button>
					</div>
				</div>
			</div>
		);
	}

	return children;
};

export default AdminRoute;
