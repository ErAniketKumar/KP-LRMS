import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		// Add timestamp to filenames to prevent caching issues
		rollupOptions: {
			output: {
				assetFileNames: "assets/[name].[hash].[ext]",
				chunkFileNames: "assets/[name].[hash].js",
				entryFileNames: "assets/[name].[hash].js",
			},
		},
	},
	server: {
		// Disable caching in development
		headers: {
			"Cache-Control": "no-cache, no-store, must-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		},
		// Proxy API requests to backend server
		proxy: {
			"/api": {
				target: "http://localhost:5000",
				changeOrigin: true,
			},
		},
	},
});
