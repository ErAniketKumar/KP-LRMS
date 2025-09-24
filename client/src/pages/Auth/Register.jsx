import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Mail,
	Lock,
	User,
	Building,
	AlertCircle,
	CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/Common/LoadingSpinner";

const Register = () => {
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		password: "",
		confirmPassword: "",
		organization: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [organizations, setOrganizations] = useState([]);
	const [loadingOrgs, setLoadingOrgs] = useState(true);
	const [emailValidation, setEmailValidation] = useState({
		isValidating: false,
		isValid: null,
		message: "",
	});

	const { register } = useAuth();
	const navigate = useNavigate();

	// Fetch organizations on component mount
	useEffect(() => {
		const fetchOrganizations = async () => {
			try {
				const response = await fetch("/api/organizations/public");
				if (response.ok) {
					const data = await response.json();
					setOrganizations(data.data || []);
				} else {
					console.error("Failed to fetch organizations");
				}
			} catch (error) {
				console.error("Error fetching organizations:", error);
			} finally {
				setLoadingOrgs(false);
			}
		};

		fetchOrganizations();
	}, []);

	// Email domain validation with debouncing
	const validateEmailDomain = useCallback(async (email) => {
		console.log("validateEmailDomain called with:", email);

		if (!email || !email.includes("@")) {
			setEmailValidation({ isValidating: false, isValid: null, message: "" });
			return;
		}

		const emailDomain = email.split("@")[1]?.toLowerCase();
		console.log("Extracted domain:", emailDomain);

		// Check if domain is complete (proper domain format)
		if (!emailDomain || emailDomain.length < 4 || !emailDomain.includes(".")) {
			console.log("Domain incomplete, skipping validation");
			setEmailValidation({ isValidating: false, isValid: null, message: "" });
			return;
		}

		// Additional check: domain should end with a valid TLD (at least 2 characters after last dot)
		const domainParts = emailDomain.split(".");
		const tld = domainParts[domainParts.length - 1];
		if (!tld || tld.length < 2) {
			console.log("Domain TLD incomplete, skipping validation");
			setEmailValidation({ isValidating: false, isValid: null, message: "" });
			return;
		}

		setEmailValidation({ isValidating: true, isValid: null, message: "" });

		try {
			const url = `/api/organizations/validate-domain/${emailDomain}`;
			console.log("Making API call to:", url);

			const response = await fetch(url);
			const result = await response.json();

			console.log("API response:", response.status, result);

			if (response.ok) {
				setEmailValidation({
					isValidating: false,
					isValid: true,
					message: `✓ Domain ${emailDomain} is registered with ${result.organization.name}`,
				});
				// Auto-select the organization
				setFormData((prev) => ({
					...prev,
					organization: result.organization.name,
				}));
			} else {
				setEmailValidation({
					isValidating: false,
					isValid: false,
					message:
						result.message ||
						`Domain ${emailDomain} is not registered. Please contact your administrator.`,
				});
				// Clear organization selection
				setFormData((prev) => ({ ...prev, organization: "" }));
			}
		} catch (error) {
			setEmailValidation({
				isValidating: false,
				isValid: false,
				message: "Unable to validate domain. Please try again.",
			});
		}
	}, []);

	// Debounce email validation
	useEffect(() => {
		const timer = setTimeout(() => {
			if (formData.email) {
				validateEmailDomain(formData.email);
			}
		}, 1000); // Increased from 500ms to 1000ms

		return () => clearTimeout(timer);
	}, [formData.email, validateEmailDomain]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});

		// Clear email validation when email changes
		if (name === "email") {
			setEmailValidation({ isValidating: false, isValid: null, message: "" });
		}
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

		if (emailValidation.isValid === false) {
			setError(
				"Please use an email address from a registered organization domain"
			);
			return;
		}

		if (!emailValidation.isValid) {
			setError("Please wait for email domain validation");
			return;
		}

		setIsLoading(true);
		try {
			await register({
				fullName: formData.fullName,
				email: formData.email,
				password: formData.password,
				organization: formData.organization,
			});
			navigate("/auth/verify-email");
		} catch (err) {
			setError(err.message || "Registration failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
						<span className="text-white font-bold text-2xl">KP</span>
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						Join KP-LRMS
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
						Learning Resource Management System
					</p>
					<p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
						A brand of kalawatiputra.com
					</p>
					<p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
						Or{" "}
						<Link
							to="/auth/login"
							className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
						>
							sign in to your existing account
						</Link>
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
							<label htmlFor="fullName" className="sr-only">
								Full Name
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="fullName"
									name="fullName"
									type="text"
									required
									className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Full Name"
									value={formData.fullName}
									onChange={handleChange}
								/>
							</div>
						</div>

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
									className={`appearance-none rounded-md relative block w-full pl-10 pr-10 px-3 py-2 border ${
										emailValidation.isValid === true
											? "border-green-300 dark:border-green-600"
											: emailValidation.isValid === false
											? "border-red-300 dark:border-red-600"
											: "border-gray-300 dark:border-gray-600"
									} placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
									placeholder="Email address"
									value={formData.email}
									onChange={handleChange}
								/>
								{emailValidation.isValidating && (
									<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
										<LoadingSpinner size="sm" />
									</div>
								)}
								{!emailValidation.isValidating &&
									emailValidation.isValid === true && (
										<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
											<CheckCircle className="h-5 w-5 text-green-500" />
										</div>
									)}
								{!emailValidation.isValidating &&
									emailValidation.isValid === false && (
										<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
											<AlertCircle className="h-5 w-5 text-red-500" />
										</div>
									)}
							</div>
							{emailValidation.message && (
								<p
									className={`mt-1 text-sm ${
										emailValidation.isValid
											? "text-green-600 dark:text-green-400"
											: "text-red-600 dark:text-red-400"
									}`}
								>
									{emailValidation.message}
								</p>
							)}
						</div>

						<div>
							<label htmlFor="organization" className="sr-only">
								Organization
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Building className="h-5 w-5 text-gray-400" />
								</div>
								<select
									id="organization"
									name="organization"
									required
									disabled={loadingOrgs || emailValidation.isValid === false}
									className={`appearance-none rounded-md relative block w-full pl-10 pr-8 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
										loadingOrgs || emailValidation.isValid === false
											? "opacity-50 cursor-not-allowed"
											: ""
									}`}
									value={formData.organization}
									onChange={handleChange}
								>
									<option value="" disabled>
										{loadingOrgs
											? "Loading organizations..."
											: "Select organization"}
									</option>
									{organizations.map((org) => (
										<option key={org._id} value={org.name}>
											{org.name} ({org.domain})
										</option>
									))}
								</select>
							</div>
							{emailValidation.isValid === false && (
								<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
									Organization will be auto-selected once you enter a valid
									email domain
								</p>
							)}
						</div>

						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									required
									className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Password"
									value={formData.password}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div>
							<label htmlFor="confirmPassword" className="sr-only">
								Confirm Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									required
									className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Confirm Password"
									value={formData.confirmPassword}
									onChange={handleChange}
								/>
							</div>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={
								isLoading ||
								emailValidation.isValidating ||
								emailValidation.isValid !== true
							}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? <LoadingSpinner size="sm" /> : "Create Account"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Register;
