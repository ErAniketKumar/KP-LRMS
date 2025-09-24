import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Menu,
	X,
	Search,
	Bell,
	User,
	Sun,
	Moon,
	LogOut,
	Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [mobileSearchQuery, setMobileSearchQuery] = useState("");
	const { user, logout } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const { unread, items, fetchList, markAllAsRead, markAsRead } =
		useNotifications();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate("/auth/login");
	};

	const handleSearch = (query) => {
		if (query.trim()) {
			navigate(`/search?q=${encodeURIComponent(query.trim())}`);
		} else {
			navigate("/search");
		}
	};

	const handleSearchKeyPress = (e) => {
		if (e.key === "Enter") {
			handleSearch(searchQuery);
		}
	};

	const handleMobileSearchKeyPress = (e) => {
		if (e.key === "Enter") {
			handleSearch(mobileSearchQuery);
			setIsMobileMenuOpen(false);
		}
	};

	return (
		<header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
			<div className="px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Left side - Logo and Mobile Menu Button */}
					<div className="flex items-center">
						{/* Mobile menu button */}
						<button
							type="button"
							className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
							onClick={() => setSidebarOpen(!sidebarOpen)}
						>
							<span className="sr-only">Open main menu</span>
							{sidebarOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>

						{/* Logo */}
						<div className="flex items-center ml-4 lg:ml-0">
							<div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
								<span className="text-white font-bold text-lg">KP</span>
							</div>
							<div className="ml-3">
								<span className="text-xl font-bold text-gray-900 dark:text-white">
									KP-LRMS
								</span>
								<p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
									Learning Resource Management
								</p>
							</div>
						</div>
					</div>

					{/* Center - Search Bar (hidden on mobile) */}
					<div className="hidden md:flex flex-1 max-w-md mx-8">
						<div className="relative w-full">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search className="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyPress={handleSearchKeyPress}
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								placeholder="Search resources..."
							/>
						</div>
					</div>

					{/* Right side - Actions and Profile */}
					<div className="flex items-center space-x-4">
						{/* Mobile Search Toggle */}
						<button
							className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						>
							<Search className="h-5 w-5" />
						</button>

						{/* Theme Toggle */}
						<button
							onClick={toggleTheme}
							className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							{theme === "dark" ? (
								<Sun className="h-5 w-5" />
							) : (
								<Moon className="h-5 w-5" />
							)}
						</button>

						{/* Notifications */}
						<div className="relative">
							<button
								onClick={() => {
									const next = !isNotificationsOpen;
									setIsNotificationsOpen(next);
									if (next) fetchList();
								}}
								className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
							>
								<Bell className="h-5 w-5" />
								{unread > 0 && (
									<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full flex items-center justify-center">
										<span className="text-[10px] leading-none text-white">
											{unread > 9 ? "9+" : unread}
										</span>
									</span>
								)}
							</button>
							{/* Dropdown */}
							{isNotificationsOpen && (
								<div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
									<div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
										<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
											Notifications
										</span>
										<button
											onClick={markAllAsRead}
											className="text-xs text-indigo-600 hover:underline"
										>
											Mark all as read
										</button>
									</div>
									<ul className="max-h-80 overflow-auto divide-y divide-gray-100 dark:divide-gray-700">
										{items.length === 0 ? (
											<li className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
												No notifications
											</li>
										) : (
											items.map((n) => (
												<li
													key={n._id}
													className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
													onClick={() => {
														markAsRead(n._id);
														setIsNotificationsOpen(false);
														if (n.resourceType === "Link") navigate("/links");
														else if (n.resourceType === "Document")
															navigate("/documents");
														else if (n.resourceType === "Credential")
															navigate("/credentials");
													}}
												>
													<div className="flex items-start gap-3">
														<span
															className={`mt-1 h-2 w-2 rounded-full ${
																n.isRead ? "bg-gray-400" : "bg-indigo-500"
															}`}
														></span>
														<div className="min-w-0">
															<p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
																{n.title}
															</p>
															<p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
																{n.message}
															</p>
															<p className="mt-1 text-[10px] text-gray-500">
																{new Date(n.createdAt).toLocaleString()}
															</p>
														</div>
													</div>
												</li>
											))
										)}
									</ul>
								</div>
							)}
						</div>

						{/* Profile Dropdown */}
						<div className="relative">
							<button
								type="button"
								className="flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
							>
								<div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
									<span className="text-sm font-medium text-white">
										{user?.fullName?.charAt(0)?.toUpperCase() || "U"}
									</span>
								</div>
								<div className="hidden md:block text-left">
									<div className="text-sm font-medium">{user?.fullName}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										{user?.organization}
									</div>
								</div>
							</button>

							{/* Profile Dropdown Menu */}
							{isProfileMenuOpen && (
								<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
									<div className="py-1">
										<button
											onClick={() => {
												navigate("/profile");
												setIsProfileMenuOpen(false);
											}}
											className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
										>
											<User className="h-4 w-4 mr-3" />
											Profile
										</button>
										<button
											onClick={() => {
												// Navigate to settings
												setIsProfileMenuOpen(false);
											}}
											className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
										>
											<Settings className="h-4 w-4 mr-3" />
											Settings
										</button>
										<div className="border-t border-gray-100 dark:border-gray-700"></div>
										<button
											onClick={handleLogout}
											className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
										>
											<LogOut className="h-4 w-4 mr-3" />
											Sign out
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Search Bar */}
			{isMobileMenuOpen && (
				<div className="lg:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-4">
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="text"
							value={mobileSearchQuery}
							onChange={(e) => setMobileSearchQuery(e.target.value)}
							onKeyPress={handleMobileSearchKeyPress}
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							placeholder="Search resources..."
						/>
					</div>
				</div>
			)}

			{/* Click outside to close menus */}
			{isProfileMenuOpen && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setIsProfileMenuOpen(false)}
				></div>
			)}
			{isNotificationsOpen && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setIsNotificationsOpen(false)}
				></div>
			)}
		</header>
	);
};

export default Header;
