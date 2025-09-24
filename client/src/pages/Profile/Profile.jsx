import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
	Loader2,
	Save,
	ShieldCheck,
	User,
	IdCard,
	Phone,
	MapPin,
} from "lucide-react";

const Profile = () => {
	const { user, updateProfile, changePassword, isLoading } = useAuth();

	const [saving, setSaving] = useState(false);
	const [changingPwd, setChangingPwd] = useState(false);

	const [form, setForm] = useState({
		fullName: "",
		employeeId: "",
		phone: "",
		address: "",
		linkedinProfile: "",
		bio: "",
	});

	const [pwdForm, setPwdForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		if (user) {
			setForm({
				fullName: user.fullName || "",
				employeeId: user.employeeId || "",
				phone: user?.contactDetails?.phone || "",
				address: user?.contactDetails?.address || "",
				linkedinProfile: user.linkedinProfile || "",
				bio: user.bio || "",
			});
		}
	}, [user]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handlePwdChange = (e) => {
		const { name, value } = e.target;
		setPwdForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);
		try {
			const payload = {};
			if (form.fullName) payload.fullName = form.fullName.trim();
			if (form.employeeId) payload.employeeId = form.employeeId.trim();

			const contactDetails = {};
			if (form.phone) contactDetails.phone = form.phone.trim();
			if (form.address) contactDetails.address = form.address.trim();
			if (Object.keys(contactDetails).length)
				payload.contactDetails = contactDetails;

			if (form.linkedinProfile)
				payload.linkedinProfile = form.linkedinProfile.trim();
			if (form.bio) payload.bio = form.bio;

			await updateProfile(payload);
		} finally {
			setSaving(false);
		}
	};

	const handleChangePassword = async (e) => {
		e.preventDefault();
		if (!pwdForm.currentPassword || !pwdForm.newPassword) return;
		if (pwdForm.newPassword !== pwdForm.confirmPassword) return;
		setChangingPwd(true);
		try {
			await changePassword({
				currentPassword: pwdForm.currentPassword,
				newPassword: pwdForm.newPassword,
			});
			setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
		} finally {
			setChangingPwd(false);
		}
	};

	const profileCompleteness = useMemo(() => {
		let score = 0;
		const fields = [
			form.fullName,
			user?.email,
			user?.organization,
			form.employeeId,
			form.phone,
			form.bio,
		];
		fields.forEach((f) => f && (score += 1));
		return Math.round((score / fields.length) * 100);
	}, [form, user]);

	return (
		<div className="space-y-6">
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Profile Settings
					</h1>
					<div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
						<ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" />
						Profile completeness: {profileCompleteness}%
					</div>
				</div>

				{/* Basic Info */}
				<form
					onSubmit={handleSubmit}
					className="grid grid-cols-1 md:grid-cols-2 gap-6"
				>
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Full Name
						</label>
						<div className="relative">
							<User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								name="fullName"
								value={form.fullName}
								onChange={handleChange}
								className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
								placeholder="Your full name"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Email (read-only)
						</label>
						<input
							type="email"
							value={user?.email || ""}
							disabled
							className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Organization (read-only)
						</label>
						<input
							type="text"
							value={user?.organization || ""}
							disabled
							className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Employee ID
						</label>
						<div className="relative">
							<IdCard className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								name="employeeId"
								value={form.employeeId}
								onChange={handleChange}
								className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
								placeholder="EMP-12345"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Phone
						</label>
						<div className="relative">
							<Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="tel"
								name="phone"
								value={form.phone}
								onChange={handleChange}
								className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
								placeholder="+1 555 123 4567"
							/>
						</div>
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Address
						</label>
						<div className="relative">
							<MapPin className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
							<textarea
								name="address"
								value={form.address}
								onChange={handleChange}
								rows={2}
								className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
								placeholder="Your address"
							/>
						</div>
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							LinkedIn Profile
						</label>
						<input
							type="url"
							name="linkedinProfile"
							value={form.linkedinProfile}
							onChange={handleChange}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
							placeholder="https://www.linkedin.com/in/username"
						/>
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Bio
						</label>
						<textarea
							name="bio"
							value={form.bio}
							onChange={handleChange}
							rows={4}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
							placeholder="Tell us a bit about yourself"
						/>
					</div>

					<div className="md:col-span-2 flex justify-end">
						<button
							type="submit"
							disabled={saving || isLoading}
							className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow disabled:opacity-60"
						>
							{saving ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" /> Save Changes
								</>
							)}
						</button>
					</div>
				</form>
			</div>

			{/* Security - Change Password */}
			<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
				<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
					Security
				</h2>
				<form
					onSubmit={handleChangePassword}
					className="grid grid-cols-1 md:grid-cols-3 gap-6"
				>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Current Password
						</label>
						<input
							type="password"
							name="currentPassword"
							value={pwdForm.currentPassword}
							onChange={handlePwdChange}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
							placeholder="Enter current password"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							New Password
						</label>
						<input
							type="password"
							name="newPassword"
							value={pwdForm.newPassword}
							onChange={handlePwdChange}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
							placeholder="Enter new password"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Confirm New Password
						</label>
						<input
							type="password"
							name="confirmPassword"
							value={pwdForm.confirmPassword}
							onChange={handlePwdChange}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
							placeholder="Re-enter new password"
							required
						/>
						{pwdForm.confirmPassword &&
							pwdForm.newPassword !== pwdForm.confirmPassword && (
								<p className="mt-1 text-xs text-red-500">
									Passwords do not match
								</p>
							)}
					</div>

					<div className="md:col-span-3 flex justify-end">
						<button
							type="submit"
							disabled={
								changingPwd || pwdForm.newPassword !== pwdForm.confirmPassword
							}
							className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow disabled:opacity-60"
						>
							{changingPwd ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating
								</>
							) : (
								<>Update Password</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Profile;
