import React, {
	createContext,
	useContext,
	useReducer,
	useCallback,
	useEffect,
} from "react";
import {
	linksAPI,
	documentsAPI,
	todosAPI,
	credentialsAPI,
	dashboardAPI,
} from "../services/api";
import toast from "react-hot-toast";

// Create Resource Context
const ResourceContext = createContext();

// Resource Actions
const RESOURCE_ACTIONS = {
	SET_LOADING: "SET_LOADING",
	SET_ERROR: "SET_ERROR",
	CLEAR_ERROR: "CLEAR_ERROR",

	// Dashboard
	SET_STATS: "SET_STATS",
	SET_RECENT_ACTIVITY: "SET_RECENT_ACTIVITY",

	// Links
	SET_LINKS: "SET_LINKS",
	SET_LINKS_PAGINATION: "SET_LINKS_PAGINATION",
	ADD_LINK: "ADD_LINK",
	UPDATE_LINK: "UPDATE_LINK",
	DELETE_LINK: "DELETE_LINK",

	// Documents
	SET_DOCUMENTS: "SET_DOCUMENTS",
	ADD_DOCUMENT: "ADD_DOCUMENT",
	UPDATE_DOCUMENT: "UPDATE_DOCUMENT",
	DELETE_DOCUMENT: "DELETE_DOCUMENT",

	// Todos
	SET_TODOS: "SET_TODOS",
	ADD_TODO: "ADD_TODO",
	UPDATE_TODO: "UPDATE_TODO",
	DELETE_TODO: "DELETE_TODO",
	COMPLETE_TODO: "COMPLETE_TODO",

	// Credentials
	SET_CREDENTIALS: "SET_CREDENTIALS",
	ADD_CREDENTIAL: "ADD_CREDENTIAL",
	UPDATE_CREDENTIAL: "UPDATE_CREDENTIAL",
	DELETE_CREDENTIAL: "DELETE_CREDENTIAL",
};

// Initial State
const initialState = {
	loading: false,
	error: null,

	// Dashboard
	stats: {
		totalLinks: 0,
		totalDocuments: 0,
		totalTodos: 0,
		totalCredentials: 0,
		activeTasks: 0,
	},
	recentActivity: [],

	// Resources
	links: [],
	documents: [],
	todos: [],
	credentials: [],

	// Pagination
	linksPagination: {
		page: 1,
		limit: 10,
		total: 0,
		pages: 0,
	},
};

// Reducer
const resourceReducer = (state, action) => {
	switch (action.type) {
		case RESOURCE_ACTIONS.SET_LOADING:
			return { ...state, loading: action.payload };

		case RESOURCE_ACTIONS.SET_ERROR:
			return { ...state, error: action.payload, loading: false };

		case RESOURCE_ACTIONS.CLEAR_ERROR:
			return { ...state, error: null };

		// Dashboard
		case RESOURCE_ACTIONS.SET_STATS:
			return { ...state, stats: action.payload };

		case RESOURCE_ACTIONS.SET_RECENT_ACTIVITY:
			return { ...state, recentActivity: action.payload };

		// Links
		case RESOURCE_ACTIONS.SET_LINKS:
			return {
				...state,
				links: Array.isArray(action.payload) ? action.payload : [],
				loading: false,
			};

		case RESOURCE_ACTIONS.SET_LINKS_PAGINATION:
			return {
				...state,
				linksPagination: {
					...state.linksPagination,
					...action.payload,
				},
			};

		case RESOURCE_ACTIONS.ADD_LINK:
			return {
				...state,
				links: [
					action.payload,
					...(Array.isArray(state.links) ? state.links : []),
				],
			};

		case RESOURCE_ACTIONS.UPDATE_LINK:
			return {
				...state,
				links: (Array.isArray(state.links) ? state.links : []).map((link) =>
					link._id === action.payload._id ? action.payload : link
				),
			};

		case RESOURCE_ACTIONS.DELETE_LINK:
			return {
				...state,
				links: (Array.isArray(state.links) ? state.links : []).filter(
					(link) => link._id !== action.payload
				),
			};

		// Documents
		case RESOURCE_ACTIONS.SET_DOCUMENTS:
			return {
				...state,
				documents: Array.isArray(action.payload) ? action.payload : [],
				loading: false,
			};

		case RESOURCE_ACTIONS.ADD_DOCUMENT:
			return {
				...state,
				documents: [
					action.payload,
					...(Array.isArray(state.documents) ? state.documents : []),
				],
			};

		case RESOURCE_ACTIONS.UPDATE_DOCUMENT:
			return {
				...state,
				documents: (Array.isArray(state.documents) ? state.documents : []).map(
					(doc) => (doc._id === action.payload._id ? action.payload : doc)
				),
			};

		case RESOURCE_ACTIONS.DELETE_DOCUMENT:
			return {
				...state,
				documents: (Array.isArray(state.documents)
					? state.documents
					: []
				).filter((doc) => doc._id !== action.payload),
			};

		// Todos
		case RESOURCE_ACTIONS.SET_TODOS:
			return {
				...state,
				todos: Array.isArray(action.payload) ? action.payload : [],
				loading: false,
			};

		case RESOURCE_ACTIONS.ADD_TODO:
			return {
				...state,
				todos: [
					action.payload,
					...(Array.isArray(state.todos) ? state.todos : []),
				],
			};

		case RESOURCE_ACTIONS.UPDATE_TODO:
			return {
				...state,
				todos: (Array.isArray(state.todos) ? state.todos : []).map((todo) =>
					todo._id === action.payload._id ? action.payload : todo
				),
			};

		case RESOURCE_ACTIONS.DELETE_TODO:
			return {
				...state,
				todos: (Array.isArray(state.todos) ? state.todos : []).filter(
					(todo) => todo._id !== action.payload
				),
			};

		case RESOURCE_ACTIONS.COMPLETE_TODO:
			return {
				...state,
				todos: state.todos.map((todo) =>
					todo._id === action.payload._id ? action.payload : todo
				),
			};

		// Credentials
		case RESOURCE_ACTIONS.SET_CREDENTIALS:
			return {
				...state,
				credentials: Array.isArray(action.payload) ? action.payload : [],
				loading: false,
			};

		case RESOURCE_ACTIONS.ADD_CREDENTIAL:
			return {
				...state,
				credentials: [
					action.payload,
					...(Array.isArray(state.credentials) ? state.credentials : []),
				],
			};

		case RESOURCE_ACTIONS.UPDATE_CREDENTIAL:
			return {
				...state,
				credentials: (Array.isArray(state.credentials)
					? state.credentials
					: []
				).map((cred) =>
					cred._id === action.payload._id ? action.payload : cred
				),
			};

		case RESOURCE_ACTIONS.DELETE_CREDENTIAL:
			return {
				...state,
				credentials: (Array.isArray(state.credentials)
					? state.credentials
					: []
				).filter((cred) => cred._id !== action.payload),
			};

		default:
			return state;
	}
};

// Resource Provider Component
export const ResourceProvider = ({ children }) => {
	const [state, dispatch] = useReducer(resourceReducer, initialState);

	// Error handler
	const handleError = useCallback((error, customMessage) => {
		const message =
			error.response?.data?.message || customMessage || "An error occurred";
		dispatch({ type: RESOURCE_ACTIONS.SET_ERROR, payload: message });
		toast.error(message);
	}, []);

	// Dashboard functions
	const updateStatsOnly = useCallback(async () => {
		try {
			const { data } = await dashboardAPI.getStats();
			if (data?.success) {
				dispatch({ type: RESOURCE_ACTIONS.SET_STATS, payload: data.data });
			}
		} catch (error) {
			console.warn("Failed to update stats:", error);
		}
	}, []);

	const fetchDashboardStats = useCallback(async () => {
		try {
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: true });
			const { data } = await dashboardAPI.getStats();
			if (data?.success) {
				dispatch({ type: RESOURCE_ACTIONS.SET_STATS, payload: data.data });
			}
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		} catch (error) {
			handleError(error, "Failed to fetch dashboard stats");
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		}
	}, [handleError]);

	const fetchRecentActivity = useCallback(async () => {
		try {
			const { data } = await dashboardAPI.getRecentActivity();
			if (data?.success) {
				// Map server activity format to UI-friendly with time string
				const activities = data.data.slice(0, 4).map((item) => ({
					...item,
					time: new Date(item.createdAt).toLocaleString(),
				}));
				dispatch({
					type: RESOURCE_ACTIONS.SET_RECENT_ACTIVITY,
					payload: activities,
				});
			}
		} catch (error) {
			handleError(error, "Failed to fetch recent activity");
		}
	}, [handleError]);

	// Links functions
	const fetchLinks = useCallback(
		async (params = {}) => {
			try {
				dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: true });
				const response = await linksAPI.getAll(params);
				dispatch({
					type: RESOURCE_ACTIONS.SET_LINKS,
					payload: response.data.data,
				});
				dispatch({
					type: RESOURCE_ACTIONS.SET_LINKS_PAGINATION,
					payload: {
						page: response.data.pagination?.page || 1,
						limit: response.data.pagination?.limit || 10,
						total: response.data.pagination?.total || 0,
						pages: response.data.pagination?.pages || 0,
					},
				});
				dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
			} catch (error) {
				handleError(error, "Failed to fetch links");
				dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
			}
		},
		[handleError]
	);

	const createLink = useCallback(
		async (linkData) => {
			try {
				const response = await linksAPI.create(linkData);
				dispatch({ type: RESOURCE_ACTIONS.ADD_LINK, payload: response.data });
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Link created successfully!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to create link");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	const updateLink = useCallback(
		async (id, linkData) => {
			try {
				const response = await linksAPI.update(id, linkData);
				dispatch({
					type: RESOURCE_ACTIONS.UPDATE_LINK,
					payload: response.data,
				});
				toast.success("Link updated successfully!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to update link");
				throw error;
			}
		},
		[handleError]
	);

	const deleteLink = useCallback(
		async (id) => {
			try {
				await linksAPI.delete(id);
				dispatch({ type: RESOURCE_ACTIONS.DELETE_LINK, payload: id });
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Link deleted successfully!");
			} catch (error) {
				handleError(error, "Failed to delete link");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	// Documents functions
	const fetchDocuments = useCallback(async () => {
		try {
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: true });
			const response = await documentsAPI.getAll();
			dispatch({
				type: RESOURCE_ACTIONS.SET_DOCUMENTS,
				payload: response.data.data,
			});
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		} catch (error) {
			handleError(error, "Failed to fetch documents");
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		}
	}, [handleError]);

	const uploadDocument = useCallback(
		async (formData) => {
			try {
				const response = await documentsAPI.upload(formData);
				dispatch({
					type: RESOURCE_ACTIONS.ADD_DOCUMENT,
					payload: response.data,
				});
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Document uploaded successfully!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to upload document");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	const uploadMultipleDocuments = useCallback(
		async (formData) => {
			try {
				const response = await documentsAPI.uploadMultiple(formData);
				dispatch({
					type: RESOURCE_ACTIONS.ADD_DOCUMENT,
					payload: response.data,
				});
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Documents uploaded successfully as a single entry!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to upload documents");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	const deleteDocument = useCallback(
		async (id) => {
			try {
				await documentsAPI.delete(id);
				dispatch({ type: RESOURCE_ACTIONS.DELETE_DOCUMENT, payload: id });
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Document deleted successfully!");
			} catch (error) {
				handleError(error, "Failed to delete document");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	// Todos functions
	const fetchTodos = useCallback(async () => {
		try {
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: true });
			const response = await todosAPI.getAll();
			// The API returns { success, count, data: [...] }, so we need response.data.data
			dispatch({
				type: RESOURCE_ACTIONS.SET_TODOS,
				payload: response.data.data,
			});
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		} catch (error) {
			handleError(error, "Failed to fetch todos");
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		}
	}, [handleError]);

	const createTodo = useCallback(
		async (todoData) => {
			try {
				const response = await todosAPI.create(todoData);
				dispatch({ type: RESOURCE_ACTIONS.ADD_TODO, payload: response.data });
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Task created successfully!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to create task");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	const updateTodo = useCallback(
		async (id, todoData) => {
			try {
				const response = await todosAPI.update(id, todoData);
				dispatch({
					type: RESOURCE_ACTIONS.UPDATE_TODO,
					payload: response.data,
				});
				toast.success("Task updated successfully!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to update task");
				throw error;
			}
		},
		[handleError]
	);

	const completeTodo = useCallback(
		async (id) => {
			try {
				const response = await todosAPI.complete(id);
				dispatch({
					type: RESOURCE_ACTIONS.COMPLETE_TODO,
					payload: response.data,
				});
				toast.success("Task marked as complete!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to complete task");
				throw error;
			}
		},
		[handleError]
	);

	const deleteTodo = useCallback(
		async (id) => {
			try {
				await todosAPI.delete(id);
				dispatch({ type: RESOURCE_ACTIONS.DELETE_TODO, payload: id });
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Task deleted successfully!");
			} catch (error) {
				handleError(error, "Failed to delete task");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	// Credentials functions
	const fetchCredentials = useCallback(async () => {
		try {
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: true });
			const response = await credentialsAPI.getAll(true); // Include passwords for display
			dispatch({
				type: RESOURCE_ACTIONS.SET_CREDENTIALS,
				payload: response.data.data,
			});
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		} catch (error) {
			handleError(error, "Failed to fetch credentials");
			dispatch({ type: RESOURCE_ACTIONS.SET_LOADING, payload: false });
		}
	}, [handleError]);

	const createCredential = useCallback(
		async (credData) => {
			try {
				const response = await credentialsAPI.create(credData);
				dispatch({
					type: RESOURCE_ACTIONS.ADD_CREDENTIAL,
					payload: response.data,
				});
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Credential created successfully!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to create credential");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	const updateCredential = useCallback(
		async (id, credData) => {
			try {
				const response = await credentialsAPI.update(id, credData);
				dispatch({
					type: RESOURCE_ACTIONS.UPDATE_CREDENTIAL,
					payload: response.data,
				});
				toast.success("Credential updated successfully!");
				return response.data;
			} catch (error) {
				handleError(error, "Failed to update credential");
				throw error;
			}
		},
		[handleError]
	);

	const deleteCredential = useCallback(
		async (id) => {
			try {
				await credentialsAPI.delete(id);
				dispatch({ type: RESOURCE_ACTIONS.DELETE_CREDENTIAL, payload: id });
				// Update dashboard stats without affecting resource arrays
				updateStatsOnly();
				toast.success("Credential deleted successfully!");
			} catch (error) {
				handleError(error, "Failed to delete credential");
				throw error;
			}
		},
		[handleError, updateStatsOnly]
	);

	// Initialize data on mount
	useEffect(() => {
		const initializeData = async () => {
			try {
				// Fetch all initial data
				await Promise.all([
					fetchDashboardStats(),
					fetchLinks(),
					fetchDocuments(),
					fetchTodos(),
					fetchCredentials(),
				]);
			} catch (error) {
				console.error("Failed to initialize data:", error);
			}
		};

		initializeData();
	}, [
		fetchDashboardStats,
		fetchLinks,
		fetchDocuments,
		fetchTodos,
		fetchCredentials,
	]);

	const value = {
		...state,

		// Dashboard
		fetchDashboardStats,
		fetchRecentActivity,

		// Links
		fetchLinks,
		createLink,
		updateLink,
		deleteLink,

		// Documents
		fetchDocuments,
		uploadDocument,
		uploadMultipleDocuments,
		deleteDocument,

		// Todos
		fetchTodos,
		createTodo,
		updateTodo,
		completeTodo,
		deleteTodo,

		// Credentials
		fetchCredentials,
		createCredential,
		updateCredential,
		deleteCredential,

		// Utility
		clearError: () => dispatch({ type: RESOURCE_ACTIONS.CLEAR_ERROR }),
	};

	return (
		<ResourceContext.Provider value={value}>
			{children}
		</ResourceContext.Provider>
	);
};

// Custom hook to use Resource Context
// eslint-disable-next-line react-refresh/only-export-components
export const useResource = () => {
	const context = useContext(ResourceContext);
	if (!context) {
		throw new Error("useResource must be used within a ResourceProvider");
	}
	return context;
};

export default ResourceContext;
