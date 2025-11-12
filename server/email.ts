import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  // First try direct environment variable (for production deployments like AWS EC2)
  const directApiKey = process.env.RESEND_API_KEY;
  const directFromEmail = process.env.RESEND_FROM_EMAIL;
  
  if (directApiKey) {
    console.log('[Resend] Using direct API key from environment variable');
    return {
      apiKey: directApiKey,
      fromEmail: directFromEmail || 'noreply@pegslam.co.uk'
    };
  }

  // Fall back to Replit connector system (for Replit deployments)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      'Resend not configured. Please set RESEND_API_KEY environment variable or configure Resend connector in Replit.'
    );
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (!connectionSettings || (!connectionSettings.settings.api_key)) {
      throw new Error('Resend connector not set up in Replit');
    }
    
    console.log('[Resend] Using Replit connector');
    return {
      apiKey: connectionSettings.settings.api_key, 
      fromEmail: connectionSettings.settings.from_email || 'noreply@pegslam.co.uk'
    };
  } catch (error) {
    throw new Error(
      'Resend not configured. Please set RESEND_API_KEY environment variable or configure Resend connector in Replit.'
    );
  }
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'noreply@yourdomain.com'
  };
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string, userName: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const appUrl = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .content { background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .button:hover { opacity: 0.9; }
            .footer { text-align: center; color: #6b7280; font-size: 13px; margin-top: 30px; padding: 20px; }
            .divider { height: 1px; background-color: #e5e7eb; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">Peg Slam</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">UK's Premier Fishing Competitions</p>
            </div>
            <div class="content">
              <h2 style="color: #2d7a4f; margin-top: 0;">Password Reset Request</h2>
              <p>Hello ${userName},</p>
              <p>We received a request to reset your password for your Peg Slam account. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <div class="divider"></div>
              <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2d7a4f; font-size: 13px; background-color: #f9fafb; padding: 12px; border-radius: 4px;">${resetUrl}</p>
              <div class="divider"></div>
              <p style="background-color: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 14px;"><strong>⏰ This link will expire in 1 hour.</strong></p>
              <p style="font-size: 14px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Peg Slam. All rights reserved.</p>
              <p>UK's Premier Fishing Competitions</p>
              <p style="margin-top: 10px;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Password Reset Request - Peg Slam',
      html: htmlContent,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

export async function sendContactEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  comment: string;
}) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const contactRecipient = process.env.CONTACT_EMAIL || 'info@pegslam.co.uk';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .info-row { margin: 15px 0; padding: 12px; background-color: #f9fafb; border-radius: 4px; }
            .label { font-weight: 600; color: #2d7a4f; display: inline-block; width: 120px; }
            .value { color: #333; }
            .comment-box { background-color: #f9fafb; padding: 16px; border-left: 4px solid #2d7a4f; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Contact Form Submission</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Peg Slam</p>
            </div>
            <div class="content">
              <h2 style="color: #2d7a4f; margin-top: 0;">Contact Details</h2>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${data.firstName} ${data.lastName}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${data.email}</span>
              </div>
              <div class="info-row">
                <span class="label">Mobile:</span>
                <span class="value">${data.mobileNumber}</span>
              </div>
              <div class="comment-box">
                <strong style="color: #2d7a4f;">Message:</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${data.comment}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailData, error } = await client.emails.send({
      from: fromEmail,
      to: contactRecipient,
      replyTo: data.email,
      subject: `New Contact Form Submission from ${data.firstName} ${data.lastName}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Failed to send contact email:', error);
      throw new Error('Failed to send contact email');
    }

    console.log('Contact email sent successfully:', emailData);
    return { success: true, messageId: emailData?.id };
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
}

export async function sendEmailVerification(toEmail: string, verificationToken: string, userName: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const appUrl = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .content { background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .button:hover { opacity: 0.9; }
            .footer { text-align: center; color: #6b7280; font-size: 13px; margin-top: 30px; padding: 20px; }
            .divider { height: 1px; background-color: #e5e7eb; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">Peg Slam</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">UK's Premier Fishing Competitions</p>
            </div>
            <div class="content">
              <h2 style="color: #2d7a4f; margin-top: 0;">Welcome to Peg Slam!</h2>
              <p>Hello ${userName},</p>
              <p>Thank you for registering with Peg Slam! To complete your registration and start booking your spots in our fishing competitions, please verify your email address.</p>
              <p style="text-align: center;">
                <a href="${verifyUrl}" class="button">Verify Email Address</a>
              </p>
              <div class="divider"></div>
              <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2d7a4f; font-size: 13px; background-color: #f9fafb; padding: 12px; border-radius: 4px;">${verifyUrl}</p>
              <div class="divider"></div>
              <p style="background-color: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 14px;"><strong>⏰ This link will expire in 24 hours.</strong></p>
              <p style="font-size: 14px; color: #6b7280;">If you didn't create an account with Peg Slam, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Peg Slam. All rights reserved.</p>
              <p>UK's Premier Fishing Competitions</p>
              <p style="margin-top: 10px;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Verify Your Email - Peg Slam',
      html: htmlContent,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}
