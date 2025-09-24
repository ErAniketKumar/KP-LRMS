import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../UI/LoadingSpinner";

const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, isLoading, user } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!isAuthenticated) {
		// Redirect to login page with return url
		return <Navigate to="/auth/login" state={{ from: location }} replace />;
	}

	// Check if email is verified
	if (user && !user.isVerified) {
		return <Navigate to="/auth/verify-email" replace />;
	}

	// Check if account is active
	if (user && !user.isActive) {
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
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							Account Deactivated
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
							Your account has been deactivated. Please contact your
							administrator for assistance.
						</p>
						<button
							onClick={() => (window.location.href = "/auth/login")}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
						>
							Back to Login
						</button>
					</div>
				</div>
			</div>
		);
	}

	return children;
};

export default ProtectedRoute;
