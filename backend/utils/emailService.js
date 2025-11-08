const nodemailer = require('nodemailer');

// Configure the transporter for Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: process.env.BREVO_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

/**
 * Sends an OTP email using the configured transporter.
 * @param {string} to - The recipient's email address.
 * @param {string} otp - The One-Time Password to send.
 */
const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"DYP Transport System" <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: 'Your Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Use the OTP below to proceed.</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr>
        <p><em>DYP Transport System</em></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending OTP email to ${to}:`, error);
    throw new Error('Could not send OTP email.');
  }
};

module.exports = { sendOTPEmail };