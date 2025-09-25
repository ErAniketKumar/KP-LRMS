const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
	const config = {
		host: process.env.EMAIL_HOST || "smtp.gmail.com",
		port: parseInt(process.env.EMAIL_PORT || "587"),
		secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
		tls: {
			rejectUnauthorized: false, // Allow self-signed certificates
		},
	};

	console.log("Email config:", {
		host: config.host,
		port: config.port,
		secure: config.secure,
		user: config.auth.user ? "***configured***" : "missing",
	});

	return nodemailer.createTransport(config);
};

// Send email verification
const sendVerificationEmail = async (email, verificationToken, fullName) => {
	try {
		const transporter = createTransporter();

		const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

		const mailOptions = {
			from: `KP-LRMS <${process.env.EMAIL_USER}>`,
			to: email,
			subject: "Verify Your KP-LRMS Account",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 50%; margin-bottom: 15px;">
              <span style="font-size: 24px; font-weight: bold;">KP</span>
            </div>
            <h1 style="margin: 0 0 10px 0;">KP-LRMS</h1>
            <p style="margin: 0; opacity: 0.9;">Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">A brand of kalawatiputra.com</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2>Welcome, ${fullName}!</h2>
            
            <p>Thank you for registering with KP-LRMS (Learning Resource Management System). To complete your account setup, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6B7280;">${verificationUrl}</p>
            
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            
            <p style="color: #6B7280; font-size: 14px;">
              If you didn't create an account with KP-LRMS, please ignore this email.
            </p>
            
            <p style="color: #6B7280; font-size: 14px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 KP-LRMS - Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">A brand of kalawatiputra.com</p>
          </div>
        </div>
      `,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("Verification email sent:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("Error sending verification email:", error);
		throw new Error("Failed to send verification email");
	}
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, fullName) => {
	try {
		const transporter = createTransporter();

		const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

		const mailOptions = {
			from: `KP-LRMS <${process.env.EMAIL_USER}>`,
			to: email,
			subject: "Password Reset Request - KP-LRMS",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 30px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 50%; margin-bottom: 15px;">
              <span style="font-size: 24px; font-weight: bold;">KP</span>
            </div>
            <h1 style="margin: 0 0 10px 0;">Password Reset Request</h1>
            <p style="margin: 0; opacity: 0.9;">KP-LRMS - Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">A brand of kalawatiputra.com</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2>Hello, ${fullName}</h2>
            
            <p>We received a request to reset your password for your KP-LRMS account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6B7280;">${resetUrl}</p>
            
            <p><strong>Important:</strong> This password reset link will expire in 10 minutes for security reasons.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            
            <div style="background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0; color: #92400E;">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <p style="color: #6B7280; font-size: 14px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 KP-LRMS - Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">A brand of kalawatiputra.com</p>
          </div>
        </div>
      `,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("Password reset email sent:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("Error sending password reset email:", error);
		throw new Error("Failed to send password reset email");
	}
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, fullName, organization) => {
	try {
		const transporter = createTransporter();

		const loginUrl = `${process.env.CLIENT_URL}/login`;

		const mailOptions = {
			from: `KP-LRMS <${process.env.EMAIL_USER}>`,
			to: email,
			subject: "Welcome to KP-LRMS - Account Verified Successfully",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 50%; margin-bottom: 15px;">
              <span style="font-size: 24px; font-weight: bold;">KP</span>
            </div>
            <h1 style="margin: 0 0 10px 0;">Welcome to KP-LRMS!</h1>
            <p style="margin: 0; opacity: 0.9;">Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">A brand of kalawatiputra.com</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2>Congratulations, ${fullName}!</h2>
            
            <p>Your email has been successfully verified and your KP-LRMS account is now active. You can now access all the features of the Learning Resource Management System.</p>
            
            <div style="background-color: #ECFDF5; padding: 20px; border-left: 4px solid #059669; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065F46;">What you can do now:</h3>
              <ul style="color: #065F46;">
                <li>Manage and organize your project links with QR codes</li>
                <li>Securely store and manage credentials</li>
                <li>Upload and share documents with team</li>
                <li>Create and track tasks efficiently</li>
                <li>Generate short URLs with analytics</li>
                <li>Use advanced search and filtering features</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Login to KP-LRMS
              </a>
            </div>
            
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Organization:</strong> ${organization}</p>
              <p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${email}</p>
            </div>
            
            <p>If you have any questions or need help getting started, please contact your system administrator.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            
            <p style="color: #6B7280; font-size: 14px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 KP-LRMS - Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">A brand of kalawatiputra.com</p>
          </div>
        </div>
      `,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("Welcome email sent:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("Error sending welcome email:", error);
		throw new Error("Failed to send welcome email");
	}
};

// Send notification email
const sendNotificationEmail = async (email, subject, message, fullName) => {
	try {
		const transporter = createTransporter();

		const mailOptions = {
			from: `KP-LRMS Notifications <${process.env.EMAIL_USER}>`,
			to: email,
			subject: `KP-LRMS - ${subject}`,
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 30px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 50%; margin-bottom: 15px;">
              <span style="font-size: 24px; font-weight: bold;">KP</span>
            </div>
            <h1 style="margin: 0 0 10px 0;">KP-LRMS Notification</h1>
            <p style="margin: 0; opacity: 0.9;">Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">A brand of kalawatiputra.com</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2>Hello, ${fullName}</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #6366F1;">
              ${message}
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            
            <p style="color: #6B7280; font-size: 14px;">
              This is an automated notification from KP-LRMS. Please do not reply to this message.
            </p>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2025 KP-LRMS - Learning Resource Management System</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">A brand of kalawatiputra.com</p>
          </div>
        </div>
      `,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("Notification email sent:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("Error sending notification email:", error);
		throw new Error("Failed to send notification email");
	}
};

// Test email configuration
const testEmailConfig = async () => {
	try {
		const transporter = createTransporter();
		await transporter.verify();
		console.log("Email configuration is valid");
		return { success: true, message: "Email configuration is valid" };
	} catch (error) {
		console.error("Email configuration error:", error);
		return { success: false, message: error.message };
	}
};

module.exports = {
	sendVerificationEmail,
	sendPasswordResetEmail,
	sendWelcomeEmail,
	sendNotificationEmail,
	testEmailConfig,
};
