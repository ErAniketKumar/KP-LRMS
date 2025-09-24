import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	const { forgotPassword } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage("");

		try {
			await forgotPassword(email);
			setIsSuccess(true);
			setMessage("Password reset link sent to your email!");
		} catch (err) {
			setIsSuccess(false);
			setMessage(err.message || "Failed to send reset email");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
						<Mail className="h-8 w-8 text-white" />
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						Reset KP-LRMS Password
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
						Enter your email address and we'll send you a reset link
					</p>
					<p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
						A brand of kalawatiputra.com
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					{message && (
						<div
							className={`p-4 rounded-md text-sm ${
								isSuccess
									? "bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
									: "bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
							}`}
						>
							{message}
						</div>
					)}

					{!isSuccess && (
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Mail className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
						</div>
					)}

					{!isSuccess && (
						<div>
							<button
								type="submit"
								disabled={isLoading || !email}
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? <LoadingSpinner size="sm" /> : "Send reset link"}
							</button>
						</div>
					)}

					<div className="text-center">
						<Link
							to="/auth/login"
							className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
						>
							<ArrowLeft className="h-4 w-4 mr-1" />
							Back to login
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ForgotPassword;
