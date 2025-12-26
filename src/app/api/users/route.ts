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

    // 2. Hash Password (Schema uses passwordHash)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        shopName,
        address,
        phone,
      },
    });

    // 4. Generate & Save Verification Token (Using your schema's VerificationToken model)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: token,
        expires: expires,
      },
    });

    // 5. Send Email
    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: "Account created. Check your email to verify." }, { status: 201 });
  } catch (error: any) {
    console.error("SIGNUP_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}