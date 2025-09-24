import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import api from "../services/api";

const NotificationContext = createContext();

export const useNotifications = () => {
	const ctx = useContext(NotificationContext);
	if (!ctx)
		throw new Error(
			"useNotifications must be used within NotificationProvider"
		);
	return ctx;
};

export const NotificationProvider = ({ children }) => {
	const [items, setItems] = useState([]);
	const [unread, setUnread] = useState(0);
	const [loading, setLoading] = useState(false);

	const fetchUnread = useCallback(async () => {
		try {
			const res = await api.get("/notifications/unread-count");
			setUnread(res.data.count || 0);
		} catch (e) {
			// ignore
		}
	}, []);

	const fetchList = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/notifications?limit=10");
			setItems(res.data.data || []);
			setUnread(res.data.unread || 0);
		} catch (e) {
			// ignore silently
		} finally {
			setLoading(false);
		}
	}, []);

	const markAllAsRead = useCallback(async () => {
		await api.patch("/notifications/read-all");
		setItems((prev) =>
			prev.map((n) => ({
				...n,
				isRead: true,
				readAt: new Date().toISOString(),
			}))
		);
		setUnread(0);
	}, []);

	const markAsRead = useCallback(async (id) => {
		await api.patch(`/notifications/${id}/read`);
		setItems((prev) =>
			prev.map((n) =>
				n._id === id
					? { ...n, isRead: true, readAt: new Date().toISOString() }
					: n
			)
		);
		setUnread((c) => Math.max(0, c - 1));
	}, []);

	useEffect(() => {
		fetchUnread();
		fetchList();
		const i = setInterval(fetchUnread, 15000);
		return () => clearInterval(i);
	}, [fetchUnread, fetchList]);

	return (
		<NotificationContext.Provider
			value={{
				items,
				unread,
				loading,
				fetchList,
				fetchUnread,
				markAllAsRead,
				markAsRead,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
};
