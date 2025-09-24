import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<>
			<Helmet>
				<title>Dashboard - KP-LRMS</title>
				<meta
					name="description"
					content="KP-LRMS Dashboard - Learning Resource Management System by kalawatiputra.com"
				/>
			</Helmet>

			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				{/* Header */}
				<Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

				{/* Mobile sidebar overlay */}
				{sidebarOpen && (
					<div className="fixed inset-0 z-40 lg:hidden">
						<div
							className="absolute inset-0 bg-gray-900/60"
							onClick={() => setSidebarOpen(false)}
						/>
						<div
							className="relative h-full w-80 max-w-[85vw] ml-0 bg-white dark:bg-gray-800 pt-16 shadow-xl"
							onClick={(e) => e.stopPropagation()}
						>
							<Sidebar isMobile onNavigateClose={() => setSidebarOpen(false)} />
						</div>
					</div>
				)}

				{/* Desktop Sidebar */}
				<Sidebar />

				{/* Main Content */}
				<main className="lg:pl-64 pt-16">
					<div className="px-4 sm:px-6 lg:px-8 py-8">
						<Outlet />
					</div>
				</main>
			</div>
		</>
	);
};

export default Layout;
