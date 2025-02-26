import nodemailer from 'nodemailer';
import crypto from 'crypto';

console.log("Setting up email transporter with Gmail credentials");

// Create transporter with explicitly defined SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  debug: true // Enable debug logs
});

export async function verifyEmailTransporter() {
  try {
    console.log("Verifying email configuration with credentials:", {
      user: process.env.GMAIL_USER,
      host: 'smtp.gmail.com'
    });

    const verificationResult = await transporter.verify();
    console.log("Email transporter verification result:", verificationResult);
    return verificationResult;
  } catch (error) {
    console.error("Email transporter verification failed:", error);
    throw error;
  }
}

// Verify the transporter configuration on startup
verifyEmailTransporter()
  .then(() => console.log('Email transporter is ready to send emails'))
  .catch(error => console.error('Email transporter verification failed:', error));

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
  if (!domain) {
    throw new Error('REPLIT_DOMAINS environment variable is not set');
  }

  const verificationUrl = `https://${domain}/verify-email?token=${token}`;

  console.log("Sending verification email to:", email);
  console.log("Verification URL:", verificationUrl);
  console.log("Using Gmail account:", process.env.GMAIL_USER);

  const mailOptions = {
    from: `"RoomcraftAI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verify your RoomcraftAI account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to RoomcraftAI!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for registering. Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        ">Verify Email</a>
        <p style="color: #666;">Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #666;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't create an account with RoomcraftAI, please ignore this email.</p>
      </div>
    `
  };

  try {
    console.log("Attempting to send email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export function generateVerificationToken(): { token: string, expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

  return { token, expires };
}