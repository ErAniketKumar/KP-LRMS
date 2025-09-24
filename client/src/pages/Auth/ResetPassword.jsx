import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const ResetPassword = () => {
	const [searchParams] = useSearchParams();
	const [formData, setFormData] = useState({
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [token, setToken] = useState("");

	const { resetPassword } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		const resetToken = searchParams.get("token");
		if (!resetToken) {
			setError("Invalid or missing reset token");
			return;
		}
		setToken(resetToken);
	}, [searchParams]);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (formData.password.length < 6) {
			setError("Password must be at least 6 characters long");
			return;
		}

		setIsLoading(true);
		try {
			await resetPassword(token, formData.password);
			navigate("/auth/login", {
				state: {
					message:
						"Password reset successfully! Please login with your new password.",
				},
			});
		} catch (err) {
			setError(err.message || "Failed to reset password");
		} finally {
			setIsLoading(false);
		}
	};

	if (!token && !error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<LoadingSpinner />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
						<Lock className="h-8 w-8 text-white" />
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						Reset KP-LRMS Password
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
						Enter your new password below
					</p>
					<p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
						A brand of kalawatiputra.com
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					{error && (
						<div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label htmlFor="password" className="sr-only">
								New Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									required
									className="appearance-none rounded-md relative block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="New Password"
									value={formData.password}
									onChange={handleChange}
								/>
								<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
									<button
										type="button"
										className="text-gray-400 hover:text-gray-500 focus:outline-none"
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? (
											<EyeOff className="h-5 w-5" />
										) : (
											<Eye className="h-5 w-5" />
										)}
									</button>
								</div>
							</div>
						</div>

						<div>
							<label htmlFor="confirmPassword" className="sr-only">
								Confirm New Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="confirmPassword"
									name="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									required
									className="appearance-none rounded-md relative block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Confirm New Password"
									value={formData.confirmPassword}
									onChange={handleChange}
								/>
								<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
									<button
										type="button"
										className="text-gray-400 hover:text-gray-500 focus:outline-none"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									>
										{showConfirmPassword ? (
											<EyeOff className="h-5 w-5" />
										) : (
											<Eye className="h-5 w-5" />
										)}
									</button>
								</div>
							</div>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={isLoading || !token}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<LoadingSpinner size="sm" color="white" />
							) : (
								"Reset Password"
							)}
						</button>
					</div>

					<div className="text-center">
						<Link
							to="/auth/login"
							className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm"
						>
							Back to login
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ResetPassword;
