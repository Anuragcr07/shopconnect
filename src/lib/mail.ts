import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : 465,
  secure: true,
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD, // Use Gmail App Password
  },
    connectionTimeout: 10000, // 10 seconds timeout
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify?token=${token}&email=${email}`;

  await transporter.sendMail({
    from: '"LocalTrade Hub" <your-email@gmail.com>',
    to: email,
    subject: "Verify your LocalTrade Hub Account",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to LocalTrade Hub!</h2>
        <p>Please click the button below to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: #999;">Link: ${confirmLink}</p>
      </div>
    `,
  });
};