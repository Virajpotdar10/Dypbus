exports.getResetPasswordEmailTemplate = (name, resetUrl) => {
  const appName = 'BusDriverApp';
  const supportEmail = 'support@busdriverapp.com';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          background-color: #f4f4f7;
        }
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border: 1px solid #e2e2e2;
          border-radius: 8px;
          overflow: hidden;
        }
        .email-header {
          background-color: #1a237e;
          color: #ffffff;
          padding: 20px;
          text-align: center;
        }
        .email-header h1 {
          margin: 0;
          font-size: 24px;
        }
        .email-body {
          padding: 30px;
          color: #333333;
          line-height: 1.6;
        }
        .email-body p {
          margin: 0 0 15px 0;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          background-color: #2962ff; /* Blue accent color */
          color: #ffffff;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          display: inline-block;
        }
        .note {
          font-size: 14px;
          color: #777777;
          border-top: 1px solid #eeeeee;
          padding-top: 20px;
          margin-top: 20px;
        }
        .email-footer {
          background-color: #f4f4f7;
          color: #777777;
          padding: 20px;
          text-align: center;
          font-size: 12px;
        }
        .email-footer a {
          color: #2962ff;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="email-body">
          <p>Hello ${name},</p>
          <p>We received a request to reset your password for your <strong>${appName}</strong> account. Please click the button below to choose a new password.</p>
          <div class="button-container">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>For your security, this link will expire in 30 minutes.</p>
          <div class="note">
            <p>If you did not request a password reset, please ignore this email. Your password will not be changed.</p>
          </div>
        </div>
        <div class="email-footer">
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          <p>If you have any questions, please contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
