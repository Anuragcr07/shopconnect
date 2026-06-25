import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import crypto from "crypto";
import { rateLimit, emailRateLimitConfig } from "@/lib/rateLimit";
import { validateEmail, sanitiseString } from "@/lib/validation";

export async function POST(req: NextRequest) {
  // Apply rate limiting to prevent spamming email resets
  const rateLimitResult = await rateLimit(req, emailRateLimitConfig);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  try {
    const body = await req.json();
    const email = sanitiseString(body.email, 254).toLowerCase();

    if (!validateEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { email },
        data: {
          resetToken: token,
          resetTokenExpires: expires,
        },
      });

      await sendPasswordResetEmail(email, token);
    }

    // Generic response to prevent user enumeration
    return NextResponse.json(
      { message: "If an account exists with that email, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
