import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
	Home,
	Link as LinkIcon,
	Key,
	FileText,
	CheckSquare,
	Shield,
	Search,
	BarChart3,
	Users,
	Settings,
	Link2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { clsx } from "clsx";

const Sidebar = ({ isMobile = false, onNavigateClose }) => {
	const { user } = useAuth();
	const location = useLocation();

	const navigationItems = [
		{
			name: "Dashboard",
			href: "/dashboard",
			icon: Home,
			description: "Overview and analytics",
		},
		{
			name: "Links",
			href: "/links",
			icon: LinkIcon,
			description: "Manage project links",
		},
		{
			name: "Credentials",
			href: "/credentials",
			icon: Key,
			description: "Secure credential storage",
		},
		{
			name: "Documents",
			href: "/documents",
			icon: FileText,
			description: "File management",
		},
		{
			name: "URL Shortener",
			href: "/shorturl",
			icon: Link2,
			description: "Shorten URLs and QR codes",
		},
		{
			name: "Tasks",
			href: "/todos",
			icon: CheckSquare,
			description: "Task management",
		},
		{
			name: "Search",
			href: "/search",
			icon: Search,
			description: "Search all resources",
		},
	];

	const adminItems = [
		{
			name: "Admin Panel",
			href: "/admin",
			icon: Shield,
			description: "System administration",
		},
		{
			name: "Analytics",
			href: "/admin/analytics",
			icon: BarChart3,
			description: "Usage analytics",
		},
		{
			name: "User Management",
			href: "/admin/users",
			icon: Users,
			description: "Manage users",
		},
	];

	const isActiveLink = (href) => {
		if (href === "/dashboard") {
			return location.pathname === "/" || location.pathname === "/dashboard";
		}
		return location.pathname.startsWith(href);
	};

	const NavGroup = ({ items, activeColor = "indigo" }) => (
		<div className="space-y-1">
			{items.map((item) => {
				const Icon = item.icon;
				const isActive = isActiveLink(item.href);
				return (
					<NavLink
						key={item.name}
						to={item.href}
						onClick={() => onNavigateClose && onNavigateClose()}
						className={({ isActive: routeActive }) =>
							clsx(
								"group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
								(routeActive || isActive) && activeColor === "indigo"
									? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 border-r-2 border-indigo-500"
									: (routeActive || isActive) && activeColor === "red"
									? "bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 border-r-2 border-red-500"
									: "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
							)
						}
					>
						<Icon
							className={clsx(
								"mr-3 h-5 w-5 flex-shrink-0",
								isActive
									? activeColor === "indigo"
										? "text-indigo-500 dark:text-indigo-400"
										: "text-red-500 dark:text-red-400"
									: "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
							)}
						/>
						<div className="flex-1">
							<div>{item.name}</div>
							<div className="text-xs text-gray-500 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-500">
								{item.description}
							</div>
						</div>
					</NavLink>
				);
			})}
		</div>
	);

	if (isMobile) {
		return (
			<div className="lg:hidden h-full flex flex-col">
				<div className="flex-1 overflow-y-auto px-4 py-6">
					<NavGroup items={navigationItems} activeColor="indigo" />

					{user?.role === "admin" && (
						<div className="pt-6">
							<div className="px-3 mb-2">
								<h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Administration
								</h3>
							</div>
							<NavGroup items={adminItems} activeColor="red" />
						</div>
					)}
				</div>
				<div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
					<div className="flex items-center">
						<div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
							<span className="text-sm font-medium text-white">
								{user?.fullName?.charAt(0)?.toUpperCase() || "U"}
							</span>
						</div>
						<div className="ml-3 flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
								{user?.fullName}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
								{user?.organization} • {user?.role}
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* Desktop Sidebar */}
			<div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
				<div className="flex flex-col flex-grow overflow-y-auto">
					{/* Navigation */}
					<nav className="flex-1 px-4 py-6 space-y-1">
						<NavGroup items={navigationItems} activeColor="indigo" />

						{/* Admin Section */}
						{user?.role === "admin" && (
							<>
								<div className="pt-6">
									<div className="px-3 mb-2">
										<h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Administration
										</h3>
									</div>
									<NavGroup items={adminItems} activeColor="red" />
								</div>
							</>
						)}
					</nav>

					{/* User Info */}
					<div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
						{/* KP-LRMS Brand Footer */}
						<div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-600">
							<div className="flex items-center">
								<div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
									<span className="text-white font-bold text-sm">KP</span>
								</div>
								<div className="ml-2">
									<p className="text-sm font-semibold text-gray-900 dark:text-white">
										KP-LRMS
									</p>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										kalawatiputra.com
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-center">
							<div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
								<span className="text-sm font-medium text-white">
									{user?.fullName?.charAt(0)?.toUpperCase() || "U"}
								</span>
							</div>
							<div className="ml-3 flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
									{user?.fullName}
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
									{user?.organization} • {user?.role}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Sidebar;
