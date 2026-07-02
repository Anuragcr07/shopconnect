
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import crypto from "crypto";
import { rateLimit, signupRateLimitConfig } from "@/lib/rateLimit";
import {
  validateEmail,
  validatePassword,
  validateRole,
  validatePhone,
  sanitiseString,
} from "@/lib/validation";

export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimit(req, signupRateLimitConfig);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult; 
  }

  try {
    const body = await req.json();

    const name = sanitiseString(body.name, 100);
    const email = sanitiseString(body.email, 254).toLowerCase();
    const password = body.password; 
    const role = body.role;
    const shopName = sanitiseString(body.shopName, 100);
    const address = sanitiseString(body.address, 300);
    const phone = sanitiseString(body.phone, 20);

    if (!name || name.length < 2) {
      return NextResponse.json(
        { message: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { message: passwordCheck.message },
        { status: 400 }
      );
    }

    if (!validateRole(role)) {
      return NextResponse.json(
        { message: "Invalid role. Must be CUSTOMER or SHOPKEEPER." },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { message: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      
      return NextResponse.json(
        { message: "Email already registered." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role,
          shopName: role === "SHOPKEEPER" ? shopName : null,
          address: role === "SHOPKEEPER" ? address : null,
          phone: role === "SHOPKEEPER" ? phone : null,
        },
      }),
      prisma.verificationToken.deleteMany({ where: { identifier: email } }),
      prisma.verificationToken.create({
        data: { identifier: email, token, expires },
      }),
    ]);

    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "Account created. Check your email to verify." },
      { status: 201 }
    );
  } catch (error: unknown) {
   
    console.error("SIGNUP_ERROR:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}