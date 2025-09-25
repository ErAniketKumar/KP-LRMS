import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ResourceProvider } from "./context/ResourceContext";
import { NotificationProvider } from "./context/NotificationContext";

// Layout Components
import Layout from "./components/Layout/Layout";
import AuthLayout from "./components/Layout/AuthLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Profile from "./pages/Profile/Profile";
import Links from "./pages/Links/Links";
import Credentials from "./pages/Credentials/Credentials";
import Documents from "./pages/Documents/Documents";
import ShortUrl from "./pages/ShortUrl/ShortUrl";
import Todos from "./pages/Todos/Todos";
import Admin from "./pages/Admin/Admin";
import AdminAnalytics from "./pages/Admin/AdminAnalytics";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminOrganizations from "./pages/Admin/AdminOrganizations";
import Search from "./pages/Search/Search";
import NotFound from "./pages/NotFound/NotFound";

// Protected Route Component
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AdminRoute from "./components/Auth/AdminRoute";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function App() {
	return (
		<HelmetProvider>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider>
					<AuthProvider>
						<Router>
							<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
								<Routes>
									{/* Public Auth Routes */}
									<Route path="/auth" element={<AuthLayout />}>
										<Route path="login" element={<Login />} />
										<Route path="register" element={<Register />} />
										<Route path="verify-email" element={<VerifyEmail />} />
										<Route
											path="forgot-password"
											element={<ForgotPassword />}
										/>
										<Route path="reset-password" element={<ResetPassword />} />
									</Route>

									{/* Direct routes for email verification (outside auth layout) */}
									<Route path="/verify-email" element={<VerifyEmail />} />
									<Route path="/reset-password" element={<ResetPassword />} />

									{/* Protected Routes */}
									<Route
										path="/"
										element={
											<ProtectedRoute>
												<NotificationProvider>
													<ResourceProvider>
														<Layout />
													</ResourceProvider>
												</NotificationProvider>
											</ProtectedRoute>
										}
									>
										<Route index element={<Dashboard />} />
										<Route path="dashboard" element={<Dashboard />} />
										<Route path="profile" element={<Profile />} />
										<Route path="links" element={<Links />} />
										<Route path="credentials" element={<Credentials />} />
										<Route path="documents" element={<Documents />} />
										<Route path="shorturl" element={<ShortUrl />} />
										<Route path="todos" element={<Todos />} />
										<Route path="search" element={<Search />} />

										{/* Admin Routes */}
										<Route
											path="admin"
											element={
												<AdminRoute>
													<Admin />
												</AdminRoute>
											}
										/>
										<Route
											path="admin/analytics"
											element={
												<AdminRoute>
													<AdminAnalytics />
												</AdminRoute>
											}
										/>
										<Route
											path="admin/users"
											element={
												<AdminRoute>
													<AdminUsers />
												</AdminRoute>
											}
										/>
										<Route
											path="admin/organizations"
											element={
												<AdminRoute>
													<AdminOrganizations />
												</AdminRoute>
											}
										/>
									</Route>

									{/* Redirects */}
									<Route
										path="/login"
										element={<Navigate to="/auth/login" replace />}
									/>
									<Route
										path="/register"
										element={<Navigate to="/auth/register" replace />}
									/>

									{/* 404 Route */}
									<Route path="*" element={<NotFound />} />
								</Routes>

								{/* Toast Notifications */}
								<Toaster
									position="top-right"
									toastOptions={{
										duration: 4000,
										style: {
											background: "#363636",
											color: "#fff",
										},
										success: {
											duration: 3000,
											theme: {
												primary: "green",
												secondary: "black",
											},
										},
									}}
								/>
							</div>
						</Router>
					</AuthProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</HelmetProvider>
	);
}

export default App;
