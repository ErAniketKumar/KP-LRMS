import axios from "axios";

// API Base URL - Production first with local fallback
const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://kplrms.vercel.app/api";

console.log("Services API_BASE_URL:", API_BASE_URL);

// Export the base URL for use in components that need direct fetch calls
export { API_BASE_URL };

// Create axios instance
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Links API
export const linksAPI = {
	getAll: (params = {}) => {
		const queryParams = new URLSearchParams();
		queryParams.set("limit", params.limit || 10);
		queryParams.set("page", params.page || 1);
		if (params.search) queryParams.set("search", params.search);
		if (params.category) queryParams.set("category", params.category);
		if (params.sortBy) queryParams.set("sortBy", params.sortBy);
		if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);

		return api.get(`/links?${queryParams.toString()}`);
	},
	getById: (id) => api.get(`/links/${id}`),
	create: (data) => api.post("/links", data),
	update: (id, data) => api.put(`/links/${id}`, data),
	delete: (id) => api.delete(`/links/${id}`),
};

// Documents API
export const documentsAPI = {
	getAll: (params = {}) => {
		const queryParams = new URLSearchParams();
		queryParams.set("limit", params.limit || 10);
		queryParams.set("page", params.page || 1);
		if (params.search) queryParams.set("search", params.search);
		if (params.type) queryParams.set("type", params.type);
		if (params.sortBy) queryParams.set("sortBy", params.sortBy);
		if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);

		return api.get(`/documents?${queryParams.toString()}`);
	},
	getById: (id) => api.get(`/documents/${id}`),
	upload: (formData) =>
		api.post("/documents", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		}),
	uploadMultiple: (formData) =>
		api.post("/documents/multiple", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		}),
	update: (id, data) => api.put(`/documents/${id}`, data),
	delete: (id) => api.delete(`/documents/${id}`),
	download: (id) =>
		api.get(`/documents/${id}/download`, { responseType: "blob" }),
	preview: (id) =>
		api.get(`/documents/${id}/preview`, { responseType: "blob" }),
};

// Todos API
export const todosAPI = {
	getAll: () => api.get("/todos"),
	getById: (id) => api.get(`/todos/${id}`),
	create: (data) => api.post("/todos", data),
	update: (id, data) => api.put(`/todos/${id}`, data),
	delete: (id) => api.delete(`/todos/${id}`),
	complete: (id) => api.patch(`/todos/${id}/complete`),
};

// Credentials API
export const credentialsAPI = {
	getAll: (params = {}) => {
		const queryParams = new URLSearchParams();
		queryParams.set("limit", params.limit || 10);
		queryParams.set("page", params.page || 1);
		if (params.search) queryParams.set("search", params.search);
		if (params.category) queryParams.set("category", params.category);
		if (params.includePasswords !== undefined)
			queryParams.set("includePasswords", params.includePasswords);
		if (params.sortBy) queryParams.set("sortBy", params.sortBy);
		if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);

		return api.get(`/credentials?${queryParams.toString()}`);
	},
	getById: (id) => api.get(`/credentials/${id}`),
	create: (data) => api.post("/credentials", data),
	update: (id, data) => api.put(`/credentials/${id}`, data),
	delete: (id) => api.delete(`/credentials/${id}`),
};

// Dashboard Stats API
export const dashboardAPI = {
	getStats: () => api.get("/dashboard/stats"),
	getRecentActivity: () => api.get("/dashboard/activity"),
};

// Notifications API
export const notificationsAPI = {
	list: (page = 1, limit = 20) =>
		api.get(`/notifications?page=${page}&limit=${limit}`),
	unreadCount: () => api.get("/notifications/unread-count"),
	markRead: (id) => api.patch(`/notifications/${id}/read`),
	markAllRead: () => api.patch("/notifications/read-all"),
};

export default api;
