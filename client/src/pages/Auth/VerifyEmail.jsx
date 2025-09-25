import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Mail, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import LoadingSpinner from "../../components/UI/LoadingSpinner";

const VerifyEmail = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'error'
	const [searchParams] = useSearchParams();

	const { resendVerification, user, verifyEmail } = useAuth();

	const token = searchParams.get("token");

	// Handle email verification if token is present
	useEffect(() => {
		const handleEmailVerification = async (verificationToken) => {
			setIsLoading(true);
			try {
				await verifyEmail(verificationToken);
				setVerificationStatus("success");
				setMessage("Email verified successfully! You can now log in.");
			} catch (err) {
				setVerificationStatus("error");
				setMessage(
					err.message ||
						"Failed to verify email. The link may be expired or invalid."
				);
			} finally {
				setIsLoading(false);
			}
		};

		if (token) {
			handleEmailVerification(token);
		}
	}, [token, verifyEmail]);

	const handleResendEmail = async () => {
		setIsLoading(true);
		setMessage("");

		try {
			await resendVerification(user?.email);
			setMessage("Verification email sent successfully!");
		} catch (err) {
			setMessage(err.message || "Failed to resend verification email");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
						{verificationStatus === "success" ? (
							<CheckCircle className="h-8 w-8 text-white" />
						) : verificationStatus === "error" ? (
							<XCircle className="h-8 w-8 text-white" />
						) : (
							<Mail className="h-8 w-8 text-white" />
						)}
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						{token
							? verificationStatus === "success"
								? "Email Verified!"
								: verificationStatus === "error"
								? "Verification Failed"
								: "Verifying your email..."
							: "Verify your KP-LRMS email"}
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
						{token
							? verificationStatus === "success"
								? "Your account has been successfully verified"
								: verificationStatus === "error"
								? "There was a problem verifying your email"
								: "Please wait while we verify your email address"
							: "We've sent a verification link to your email address"}
					</p>
					<p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
						A brand of kalawatiputra.com
					</p>
				</div>

				<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
					{token ? (
						// Token verification mode
						<div className="text-center">
							{isLoading ? (
								<div className="mb-4">
									<LoadingSpinner size="lg" />
									<p className="text-gray-600 dark:text-gray-400 mt-2">
										Verifying your email...
									</p>
								</div>
							) : verificationStatus === "success" ? (
								<div className="mb-4">
									<CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
									<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
										Verification Successful!
									</h3>
									<p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
										Your email has been verified. You can now access your
										account.
									</p>
								</div>
							) : verificationStatus === "error" ? (
								<div className="mb-4">
									<XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
									<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
										Verification Failed
									</h3>
									<p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
										{message}
									</p>
								</div>
							) : null}

							{message && (
								<div
									className={`mb-4 p-3 rounded-md text-sm ${
										message.includes("successfully") ||
										verificationStatus === "success"
											? "bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
											: "bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
									}`}
								>
									{message}
								</div>
							)}

							<div className="space-y-4">
								<Link
									to="/auth/login"
									className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								>
									Continue to Login
								</Link>
							</div>
						</div>
					) : (
						// Instruction mode (no token)
						<div className="text-center">
							<Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								Check your email
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
								We sent a verification link to{" "}
								<span className="font-medium">{user?.email}</span>
							</p>

							{message && (
								<div
									className={`mb-4 p-3 rounded-md text-sm ${
										message.includes("successfully")
											? "bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
											: "bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
									}`}
								>
									{message}
								</div>
							)}

							<div className="space-y-4">
								<button
									onClick={handleResendEmail}
									disabled={isLoading}
									className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<LoadingSpinner size="sm" />
									) : (
										"Resend verification email"
									)}
								</button>

								<div className="text-sm text-gray-500 dark:text-gray-400">
									<p>
										Didn't receive the email? Check your spam folder or try
										resending.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="text-center">
					<Link
						to="/auth/login"
						className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to login
					</Link>
				</div>
			</div>
		</div>
	);
};

export default VerifyEmail;
