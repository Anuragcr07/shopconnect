import { google } from 'googleapis';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const GMAIL_USER = process.env.GMAIL_USER;
// The redirect URI must match what you put in Google Console
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify?token=${token}&email=${email}`;
  
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Create email headers and body
  const subject = "Verify your LocalTrade Hub Account";
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  
  const messageParts = [
    `From: "LocalTrade Hub" <${GMAIL_USER}>`,
    `To: ${email}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to LocalTrade Hub!</h2>
        <p>Please click the button below to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
        <hr />
        <p style="font-size: 10px; color: #999;">${confirmLink}</p>
      </div>
    `,
  ];
  
  const message = messageParts.join('\n');

  // Gmail API requires base64url encoding
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    console.log("✅ Email sent successfully via Gmail API");
  } catch (error) {
    console.error("❌ Gmail API Error:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${email}`;
  
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Create email headers and body
  const subject = "Reset your LocalTrade Hub Password";
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  
  const messageParts = [
    `From: "LocalTrade Hub" <${GMAIL_USER}>`,
    `To: ${email}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Reset your Password</h2>
        <p>You requested a password reset. Please click the button below to choose a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #666;">This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        <hr />
        <p style="font-size: 10px; color: #999;">${resetLink}</p>
      </div>
    `,
  ];
  
  const message = messageParts.join('\n');

  // Gmail API requires base64url encoding
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    console.log("✅ Password reset email sent successfully via Gmail API");
  } catch (error) {
    console.error("❌ Gmail API Error (Password Reset):", error);
    throw error;
  }
};