import React, {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useCallback,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";

// API Base URL - Production first with local fallback
const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://kplrms.vercel.app/api";

console.log("API_BASE_URL:", API_BASE_URL);

// Create axios instance
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
	SET_LOADING: "SET_LOADING",
	SET_USER: "SET_USER",
	SET_TOKEN: "SET_TOKEN",
	LOGOUT: "LOGOUT",
	SET_ERROR: "SET_ERROR",
	CLEAR_ERROR: "CLEAR_ERROR",
};

// Initial State
const initialState = {
	user: null,
	token: localStorage.getItem("token"),
	isLoading: true,
	isAuthenticated: false,
	error: null,
};

// Auth Reducer
const authReducer = (state, action) => {
	switch (action.type) {
		case AUTH_ACTIONS.SET_LOADING:
			return {
				...state,
				isLoading: action.payload,
			};
		case AUTH_ACTIONS.SET_USER:
			return {
				...state,
				user: action.payload,
				isAuthenticated: !!action.payload,
				isLoading: false,
				error: null,
			};
		case AUTH_ACTIONS.SET_TOKEN:
			return {
				...state,
				token: action.payload,
			};
		case AUTH_ACTIONS.LOGOUT:
			return {
				...state,
				user: null,
				token: null,
				isAuthenticated: false,
				isLoading: false,
				error: null,
			};
		case AUTH_ACTIONS.SET_ERROR:
			return {
				...state,
				error: action.payload,
				isLoading: false,
			};
		case AUTH_ACTIONS.CLEAR_ERROR:
			return {
				...state,
				error: null,
			};
		default:
			return state;
	}
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	// Set up axios interceptor for token
	useEffect(() => {
		const token = state.token;

		if (token) {
			api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
			localStorage.setItem("token", token);
		} else {
			delete api.defaults.headers.common["Authorization"];
			localStorage.removeItem("token");
		}
	}, [state.token]);

	// Response interceptor for handling auth errors
	useEffect(() => {
		const responseInterceptor = api.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response?.status === 401) {
					// Only trigger logout for protected routes, not auth endpoints
					const isAuthEndpoint = error.config?.url?.includes("/auth/");

					if (!isAuthEndpoint) {
						// Token expired or invalid on protected route
						logout(false); // Don't show success message
						toast.error("Session expired. Please login again.");
					}
				}
				return Promise.reject(error);
			}
		);

		return () => {
			api.interceptors.response.eject(responseInterceptor);
		};
	}, []);

	// Load user on app start
	useEffect(() => {
		const loadUser = async () => {
			const token = localStorage.getItem("token");

			if (token) {
				try {
					dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
					const response = await api.get("/auth/me");
					dispatch({
						type: AUTH_ACTIONS.SET_USER,
						payload: response.data.data,
					});
				} catch (error) {
					console.error("Failed to load user:", error);
					localStorage.removeItem("token");
					dispatch({ type: AUTH_ACTIONS.LOGOUT });
				}
			} else {
				dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
			}
		};

		loadUser();
	}, []);

	// Auth Functions
	const login = async (credentials) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			const response = await api.post("/auth/login", credentials);
			const { token, user } = response.data;

			dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
			dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

			toast.success("Login successful!");
			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Login failed";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	};

	const register = async (userData) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			const response = await api.post("/auth/register", userData);

			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
			toast.success(
				"Registration successful! Please check your email to verify your account."
			);

			return { success: true, data: response.data };
		} catch (error) {
			const message =
				error.response?.data?.errors?.[0]?.msg ||
				error.response?.data?.message ||
				"Registration failed";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	};

	const logout = async (showSuccessMessage = true) => {
		try {
			await api.post("/auth/logout");
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			dispatch({ type: AUTH_ACTIONS.LOGOUT });
			localStorage.removeItem("token");
			if (showSuccessMessage) {
				toast.success("Logged out successfully");
			}
		}
	};

	const forgotPassword = async (email) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			await api.post("/auth/forgot-password", { email });

			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
			toast.success("Password reset email sent!");

			return { success: true };
		} catch (error) {
			const message =
				error.response?.data?.message || "Failed to send reset email";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	};

	const resetPassword = async (token, password) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			const response = await api.put(`/auth/reset-password/${token}`, {
				password,
			});
			const { token: newToken, user } = response.data;

			dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: newToken });
			dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

			toast.success("Password reset successful!");
			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Password reset failed";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	};

	const verifyEmail = useCallback(async (token) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			await api.get(`/auth/verify-email/${token}`);

			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
			toast.success("Email verified successfully! You can now login.");

			return { success: true };
		} catch (error) {
			const message =
				error.response?.data?.message || "Email verification failed";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	}, []);

	const updateProfile = async (profileData) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			const response = await api.put("/auth/profile", profileData);
			dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.data });

			toast.success("Profile updated successfully!");
			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Profile update failed";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	};

	const changePassword = async (passwords) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			await api.put("/auth/change-password", passwords);

			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
			toast.success("Password changed successfully!");

			return { success: true };
		} catch (error) {
			const message = error.response?.data?.message || "Password change failed";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	};

	const resendVerification = useCallback(async (email) => {
		try {
			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
			dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

			await api.post("/auth/resend-verification", { email });

			dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
			toast.success("Verification email sent!");

			return { success: true };
		} catch (error) {
			const message =
				error.response?.data?.message || "Failed to send verification email";
			dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
			toast.error(message);
			return { success: false, error: message };
		}
	}, []);

	// Clear error function
	const clearError = () => {
		dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
	};

	const value = {
		// State
		user: state.user,
		token: state.token,
		isLoading: state.isLoading,
		isAuthenticated: state.isAuthenticated,
		error: state.error,

		// Functions
		login,
		register,
		logout,
		forgotPassword,
		resetPassword,
		verifyEmail,
		updateProfile,
		changePassword,
		resendVerification,
		clearError,

		// API instance for other components
		api,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
};

// Export api instance for use in other files
export { api };

export default AuthContext;
