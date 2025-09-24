import React from "react";
import { X, QrCode, Download, Copy } from "lucide-react";

const QRCodeModal = ({ isOpen, onClose, shortUrl }) => {
	if (!isOpen || !shortUrl) return null;

	const shortUrlLink = `${window.location.origin}/s/${shortUrl.shortCode}`;

	const handleDownload = () => {
		if (!shortUrl.qrCodeUrl) return;

		// Create a download link
		const link = document.createElement("a");
		link.href = shortUrl.qrCodeUrl;
		link.download = `qr-code-${shortUrl.shortCode}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(shortUrlLink);
			alert("Short URL copied to clipboard!");
		} catch (error) {
			console.error("Error copying to clipboard:", error);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center space-x-3">
						<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
							<QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">
								QR Code
							</h2>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Scan to access your short URL
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="h-5 w-5 text-gray-500" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 text-center">
					{/* URL Info */}
					{shortUrl.title && (
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
							{shortUrl.title}
						</h3>
					)}

					<div className="mb-6">
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
							Short URL:
						</p>
						<code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm font-mono text-blue-600 dark:text-blue-400 break-all">
							{shortUrlLink}
						</code>
					</div>

					{/* QR Code */}
					{shortUrl.qrCodeUrl ? (
						<div className="mb-6">
							<div className="inline-block p-4 bg-white rounded-lg shadow-sm">
								<img
									src={shortUrl.qrCodeUrl}
									alt="QR Code"
									className="w-48 h-48 mx-auto"
								/>
							</div>
						</div>
					) : (
						<div className="mb-6">
							<div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
								<p className="text-gray-500 dark:text-gray-400">
									QR Code not available
								</p>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center justify-center space-x-3">
						<button
							onClick={handleCopy}
							className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
						>
							<Copy className="h-4 w-4" />
							<span>Copy URL</span>
						</button>
						{shortUrl.qrCodeUrl && (
							<button
								onClick={handleDownload}
								className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
							>
								<Download className="h-4 w-4" />
								<span>Download QR</span>
							</button>
						)}
					</div>

					{/* Instructions */}
					<div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
						<p className="text-sm text-blue-700 dark:text-blue-300">
							💡 Tip: Users can scan this QR code with their phone camera to
							quickly access your URL
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default QRCodeModal;
