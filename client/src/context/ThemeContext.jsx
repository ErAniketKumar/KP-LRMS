import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(() => {
		// Prefer stored theme, default to dark
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) return savedTheme;
		return "dark";
	});

	// Helper to apply theme immediately
	const applyTheme = (mode) => {
		const root = window.document.documentElement;
		root.classList.toggle("dark", mode === "dark");
		localStorage.setItem("theme", mode);
	};

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prevTheme) => {
			const next = prevTheme === "light" ? "dark" : "light";
			// Apply immediately so UI updates without waiting for effect
			try {
				const root = window.document.documentElement;
				root.classList.toggle("dark", next === "dark");
				localStorage.setItem("theme", next);
			} catch {}
			return next;
		});
	};

	const setLightTheme = () => {
		setTheme("light");
	};

	const setDarkTheme = () => {
		setTheme("dark");
	};

	const value = {
		theme,
		toggleTheme,
		setLightTheme,
		setDarkTheme,
		isDark: theme === "dark",
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};
