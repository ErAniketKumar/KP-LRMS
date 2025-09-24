import React from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const AuthLayout = () => {
	return (
		<>
			<Helmet>
				<title>KP-LRMS - Learning Resource Management System</title>
				<meta
					name="description"
					content="Secure authentication for KP-LRMS - Learning Resource Management System. A brand of kalawatiputra.com"
				/>
			</Helmet>

			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="flex min-h-screen">
					{/* Left side - Branding */}
					<div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 lg:py-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700">
						<div className="mx-auto max-w-md text-center">
							<div className="mb-8">
								<div className="mx-auto h-20 w-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
									<span className="text-3xl font-bold text-white">KP</span>
								</div>
								<h1 className="text-4xl font-bold text-white mb-2">KP-LRMS</h1>
								<p className="text-indigo-100 text-lg">
									Learning Resource Management System
								</p>
								<p className="text-indigo-200 text-sm mt-2">
									A brand of kalawatiputra.com
								</p>
							</div>

							<div className="space-y-4 text-left">
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0">
										<div className="h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center">
											<svg
												className="h-3 w-3 text-white"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
									</div>
									<div>
										<h3 className="text-white font-medium">
											Learning Resource Hub
										</h3>
										<p className="text-indigo-200 text-sm">
											Organize links, credentials, documents, and learning
											materials in one secure platform.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0">
										<div className="h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center">
											<svg
												className="h-3 w-3 text-white"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
									</div>
									<div>
										<h3 className="text-white font-medium">
											Smart URL Management
										</h3>
										<p className="text-indigo-200 text-sm">
											Create short URLs with QR codes, track analytics, and
											manage link collections efficiently.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0">
										<div className="h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center">
											<svg
												className="h-3 w-3 text-white"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
									</div>
									<div>
										<h3 className="text-white font-medium">
											Secure & Encrypted
										</h3>
										<p className="text-indigo-200 text-sm">
											Enterprise-grade security for your learning resources and
											sensitive data.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right side - Auth Form */}
					<div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
						<div className="mx-auto w-full max-w-md">
							{/* Mobile logo */}
							<div className="lg:hidden text-center mb-8">
								<div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
									<span className="text-white font-bold text-xl">KP</span>
								</div>
								<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
									KP-LRMS
								</h1>
								<p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
									Learning Resource Management System
								</p>
								<p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
									A brand of kalawatiputra.com
								</p>
							</div>

							{/* Auth form outlet */}
							<Outlet />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default AuthLayout;
