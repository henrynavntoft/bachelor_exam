import { Resend } from 'resend';

// Email template data types
interface VerifyEmailData {
    firstName: string;
    verificationUrl: string;
}

interface ResetPasswordData {
    firstName: string;
    resetUrl: string;
}

interface WelcomeEmailData {
    firstName: string;
    loginUrl: string;
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL;

if (!fromEmail) {
    console.error('FATAL ERROR: RESEND_FROM_EMAIL environment variable is not defined.');
    process.exit(1);
}

// Base email template
const baseEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      line-height: 1.6;
      color: #333333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #1a6258;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #1a6258;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      margin-bottom: 20px;
      border-radius: 8px;
      border: 1px solid #e1e1e1;
    }
    .content p {
      margin: 0 0 15px 0;
      color: #333333;
    }
    .button {
      display: inline-block;
      background-color: #1a6258;
      color: #ffffff !important;
      text-decoration: none;
      padding: 15px 30px;
      font-weight: 600;
      border-radius: 6px;
      font-size: 16px;
      transition: background-color 0.3s ease;
    }
    .button:hover {
      background-color: #145248 !important;
    }
    .button:visited,
    .button:active {
      color: #ffffff !important;
    }
    a.button {
      color: #ffffff !important;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e1e1e1;
      color: #666666;
      font-size: 14px;
    }
    /* Override email client default link colors */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>{{title}}</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>This email was sent automatically. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// Email templates
const templates = {
    verifyEmail: {
        subject: 'Verify Your Account',
        html: (data: VerifyEmailData) => {
            const content = `
        <p>Hello ${data.firstName},</p>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${data.verificationUrl}" class="button">Verify Email</a>
        </p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      `;

            return baseEmailTemplate
                .replace('{{title}}', 'Verify Your Email Address')
                .replace('{{content}}', content);
        }
    },
    resetPassword: {
        subject: 'Reset Your Password',
        html: (data: ResetPasswordData) => {
            const content = `
        <p>Hello ${data.firstName},</p>
        <p>You requested to reset your password. Please click the button below to create a new password:</p>
        <p style="text-align: center;">
          <a href="${data.resetUrl}" class="button">Reset Password</a>
        </p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `;

            return baseEmailTemplate
                .replace('{{title}}', 'Reset Your Password')
                .replace('{{content}}', content);
        }
    },
    welcomeEmail: {
        subject: 'Welcome to Our Platform',
        html: (data: WelcomeEmailData) => {
            const content = `
        <p>Hello ${data.firstName},</p>
        <p>Thank you for joining our platform! We're excited to have you on board.</p>
        <p>You can now log in and start exploring:</p>
        <p style="text-align: center;">
          <a href="${data.loginUrl}" class="button">Log In</a>
        </p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      `;

            return baseEmailTemplate
                .replace('{{title}}', 'Welcome to Our Platform')
                .replace('{{content}}', content);
        }
    }
} as const;

type TemplateKey = keyof typeof templates;

/**
 * Email service for sending various emails
 */
export const emailService = {
    /**
     * Send a verification email
     */
    sendVerificationEmail: async (to: string, data: VerifyEmailData) => {
        try {
            const { subject, html } = templates.verifyEmail;

            await resend.emails.send({
                from: fromEmail,
                to,
                subject,
                html: html(data)
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send verification email:', error);
            return { success: false, error: 'Failed to send verification email' };
        }
    },

    /**
     * Send a password reset email
     */
    sendPasswordResetEmail: async (to: string, data: ResetPasswordData) => {
        try {
            const { subject, html } = templates.resetPassword;

            await resend.emails.send({
                from: fromEmail,
                to,
                subject,
                html: html(data)
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            return { success: false, error: 'Failed to send password reset email' };
        }
    },

    /**
     * Send a welcome email
     */
    sendWelcomeEmail: async (to: string, data: WelcomeEmailData) => {
        try {
            const { subject, html } = templates.welcomeEmail;

            await resend.emails.send({
                from: fromEmail,
                to,
                subject,
                html: html(data)
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            return { success: false, error: 'Failed to send welcome email' };
        }
    },

    /**
     * Generic method to send any templated email
     */
    sendTemplatedEmail: async <K extends TemplateKey>(
        templateKey: K,
        to: string,
        data: Parameters<typeof templates[K]['html']>[0]
    ) => {
        try {
            const template = templates[templateKey];

            if (!template) {
                throw new Error(`Email template "${templateKey}" not found`);
            }

            // Cast is necessary due to TypeScript limitations with nested generics
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const htmlContent = template.html(data as any);

            await resend.emails.send({
                from: fromEmail,
                to,
                subject: template.subject,
                html: htmlContent
            });

            return { success: true };
        } catch (error) {
            console.error(`Failed to send ${templateKey} email:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : `Failed to send ${templateKey} email`
            };
        }
    }
};