import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, shopName, address, phone } = body;

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User & Token in a Transaction (Safer)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // We use a transaction to ensure both happen or neither happen
    await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role,
          shopName,
          address,
          phone,
        },
      }),
      // Delete any existing tokens for this email and create a new one
      prisma.verificationToken.deleteMany({ where: { identifier: email } }),
      prisma.verificationToken.create({
        data: {
          identifier: email,
          token: token,
          expires: expires,
        },
      })
    ]);

    // 4. Send Email via Resend
    // Important: On Resend Free Tier, you can only send to your own registered email 
    // until you verify a custom domain!
    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: "Account created. Check your email to verify." }, { status: 201 });

  } catch (error: any) {
    console.error("SIGNUP_ERROR:", error);
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}